import pg from "pg";
import PgStoreFactory from "connect-pg-simple";
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, loginSchema, registerSchema } from "@shared/schema";
import { z } from "zod";
import {
  createPixPayment,
  getPaymentStatus,
} from "./mercadopago";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import bcrypt from "bcryptjs";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

import crypto from "crypto";

const adminSSEClients: Set<Response> = new Set();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext && mime);
  },
});

const BUY_PRICE_PER_UNIT = 0.0799;
const SELL_PRICE_PER_UNIT = 0.0649;

const paymentSchema = z.object({
  type: z.enum(["buy", "sell"]),
  characterName: z.string().min(1),
  serverId: z.string().min(1),
  quantity: z.number().min(25).max(100000),
  paymentMethod: z.enum(["pix"]),
  contactInfo: z.string().optional(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerDocument: z.string().min(11),
  customerPhone: z.string().min(10),
  cardNumber: z.string().optional(),
  cardHolderName: z.string().optional(),
  cardExpMonth: z.number().optional(),
  cardExpYear: z.number().optional(),
  cardCvv: z.string().optional(),
  installments: z.number().optional(),
});

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Nao autenticado" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Nao autenticado" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Acesso negado" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {

  app.set("trust proxy", 1);
  const PgStore = connectPgSimple(session);
  const connectionString = process.env.DATABASE_URL;
  const sessionPool = new pg.Pool({
    connectionString,
    ssl: connectionString?.includes("neon.tech")
      ? { rejectUnauthorized: false }
      : undefined,
  });
 
  app.use(
    session({
      store: new PgStore({
        pool: sessionPool,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "runecoins-secret-key-change-me",
      resave: false,
      saveUninitialized: false,
      proxy: true,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    }),
  );

  app.use(
    "/uploads",
    (req, res, next) => {
      res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
      next();
    },
    express.static(uploadsDir),
  );

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const existing = await storage.getUserByUsername(data.username);
      if (existing) {
        return res.status(400).json({ error: "Nome de usuario ja existe" });
      }
      const hashedPassword = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        username: data.username,
        password: hashedPassword,
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        role: "user",
      });
      req.session.userId = user.id;
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "Dados invalidos", details: error.errors });
      } else {
        console.error("Register error:", error);
        res.status(500).json({ error: "Erro ao registrar" });
      }
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(data.username);
      if (!user) {
        return res.status(401).json({ error: "Usuario ou senha incorretos" });
      }
      const valid = await bcrypt.compare(data.password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Usuario ou senha incorretos" });
      }
      req.session.userId = user.id;
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Dados invalidos" });
      } else {
        console.error("Login error:", error);
        res.status(500).json({ error: "Erro ao fazer login" });
      }
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/user", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Nao autenticado" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "Usuario nao encontrado" });
    }
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });
  });

  app.get("/api/admin/notifications/stream", requireAdmin, (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write("data: {\"type\":\"connected\"}\n\n");
    adminSSEClients.add(res);
    req.on("close", () => {
      adminSSEClients.delete(res);
    });
  });

  app.post("/api/admin/test-notification", requireAdmin, async (_req, res) => {
    const notification = JSON.stringify({
      type: "payment_approved",
      orderId: "TEST-" + Date.now(),
      amount: "21.23",
      quantity: 250,
      customerName: "Cliente Teste",
    });
    Array.from(adminSSEClients).forEach((client) => {
      client.write(`data: ${notification}\n\n`);
    });
    res.json({ success: true, message: "Notificação de teste enviada" });
  });

  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    try {
      const allUsers = await storage.getUsers();
      const safeUsers = allUsers.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        fullName: u.fullName,
        phone: u.phone,
        role: u.role,
        createdAt: u.createdAt,
      }));
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ error: "Erro ao listar usuarios" });
    }
  });

  app.get("/api/admin/orders", requireAdmin, async (_req, res) => {
    try {
      const allOrders = await storage.getOrders();
      res.json(allOrders);
    } catch (error) {
      res.status(500).json({ error: "Erro ao listar pedidos" });
    }
  });

  app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
    try {
      const stats = await storage.getOrderStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Erro ao buscar estatisticas" });
    }
  });

  const statusUpdateSchema = z.object({
    status: z.enum([
      "pending",
      "awaiting_payment",
      "paid",
      "processing",
      "completed",
      "cancelled",
    ]),
  });

  app.patch("/api/admin/orders/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status } = statusUpdateSchema.parse(req.body);
      const orderId = req.params.id as string;
      const order = await storage.updateOrderStatus(orderId, status);
      if (!order) {
        return res.status(404).json({ error: "Pedido nao encontrado" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar status" });
    }
  });

  app.delete("/api/admin/orders/:id", requireAdmin, async (req, res) => {
    try {
      const orderId = req.params.id as string;
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: "Pedido nao encontrado" });
      }
      if (order.status === "paid" || order.status === "completed") {
        return res.status(400).json({ error: "Nao e possivel excluir pedidos pagos ou concluidos" });
      }
      const deleted = await storage.deleteOrder(orderId);
      if (!deleted) {
        return res.status(500).json({ error: "Erro ao excluir pedido" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Erro ao excluir pedido" });
    }
  });

  app.get("/api/packages", async (_req, res) => {
    try {
      const packages = await storage.getPackages();
      res.json(packages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch packages" });
    }
  });

  app.get("/api/servers", async (_req, res) => {
    try {
      const servers = await storage.getServers();
      res.json(servers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch servers" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const parsed = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(parsed);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "Invalid order data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create order" });
      }
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  const sellOrderSchema = z.object({
    characterName: z.string().min(1, "Nome do personagem obrigatorio"),
    serverId: z.string().min(1, "Servidor obrigatorio"),
    quantity: z
      .string()
      .refine(
        (v) => !isNaN(parseInt(v)) && parseInt(v) >= 25,
        "Quantidade minima: 25 coins",
      ),
    customerName: z.string().min(1, "Nome obrigatorio"),
    customerEmail: z.string().email("E-mail invalido"),
    customerPhone: z.string().min(10, "Telefone invalido"),
    pixKey: z.string().min(1, "Chave PIX obrigatoria"),
    pixAccountHolder: z.string().min(1, "Titular da conta obrigatorio"),
  });

  app.post(
    "/api/sell-orders",
    upload.fields([
      { name: "storeScreenshot", maxCount: 1 },
      { name: "marketScreenshot", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        const validated = sellOrderSchema.parse(req.body);
        const qty = parseInt(validated.quantity);

        const totalPrice = parseFloat((SELL_PRICE_PER_UNIT * qty).toFixed(2));

        const files = req.files as {
          [fieldname: string]: Express.Multer.File[];
        };
        const storeFile = files?.storeScreenshot?.[0];
        const marketFile = files?.marketScreenshot?.[0];

        const order = await storage.createOrder({
          type: "sell",
          characterName: validated.characterName,
          serverId: validated.serverId,
          packageId: "coins",
          quantity: qty,
          totalPrice: totalPrice.toFixed(2),
          paymentMethod: "pix",
          contactInfo: "",
          pagarmeOrderId: null,
          pagarmeChargeId: null,
          pixQrCode: null,
          pixQrCodeUrl: null,
          customerName: validated.customerName,
          customerEmail: validated.customerEmail,
          customerPhone: validated.customerPhone,
          pixKey: validated.pixKey,
          pixAccountHolder: validated.pixAccountHolder,
          storeScreenshot: storeFile ? `/uploads/${storeFile.filename}` : null,
          marketScreenshot: marketFile
            ? `/uploads/${marketFile.filename}`
            : null,
        });

        const sellNotification = JSON.stringify({
          type: "new_sell_order",
          orderId: order.id,
          amount: totalPrice.toFixed(2),
          quantity: qty,
          customerName: validated.customerName || "Cliente",
        });
        Array.from(adminSSEClients).forEach((client) => {
          client.write(`data: ${sellNotification}\n\n`);
        });

        res.status(201).json({
          orderId: order.id,
          quantity: qty,
          totalPrice: totalPrice.toFixed(2),
          pixKey: validated.pixKey,
          status: "pending",
        });
      } catch (error: any) {
        console.error("Sell order error:", error);
        if (error instanceof z.ZodError) {
          res
            .status(400)
            .json({ error: "Dados invalidos", details: error.errors });
        } else {
          res.status(500).json({ error: "Erro ao criar pedido de venda." });
        }
      }
    },
  );

  app.post("/api/payments", async (req, res) => {
    try {
      const data = paymentSchema.parse(req.body);

      if (data.type === "sell") {
        return res
          .status(400)
          .json({
            error:
              "Vendas nao sao processadas por pagamento online. Entre em contato pelo suporte.",
          });
      }

      const pricePerUnit =
        data.type === "buy" ? BUY_PRICE_PER_UNIT : SELL_PRICE_PER_UNIT;
      const baseTotal = pricePerUnit * data.quantity;
      const serverTotal = parseFloat(baseTotal.toFixed(2));
      const amountInCents = Math.round(serverTotal * 100);

      if (amountInCents < 100) {
        return res
          .status(400)
          .json({ error: "Valor minimo para pagamento: R$ 1,00" });
      }

      const order = await storage.createOrder({
        type: data.type,
        characterName: data.characterName,
        serverId: data.serverId,
        packageId: "coins",
        quantity: data.quantity,
        totalPrice: serverTotal.toFixed(2),
        paymentMethod: data.paymentMethod,
        contactInfo: data.contactInfo || "",
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
      });

      const description = `RuneCoins - ${data.quantity} Paulistinha Coins (${data.type === "buy" ? "Compra" : "Venda"})`;

      if (data.paymentMethod === "pix") {
        const result = await createPixPayment({
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerDocument: data.customerDocument,
          customerPhone: data.customerPhone,
          amountInCents,
          description,
        });

        await storage.updateOrderPayment(order.id, {
          pagarmeOrderId: result.paymentId,
          pagarmeChargeId: result.paymentId,
          pixQrCode: result.pixQrCode,
          pixQrCodeUrl: result.pixQrCodeBase64,
          status: result.status === "approved" ? "paid" : "awaiting_payment",
        });

        const buyNotification = JSON.stringify({
          type: "new_buy_order",
          orderId: order.id,
          amount: serverTotal.toFixed(2),
          quantity: data.quantity,
          customerName: data.customerName || "Cliente",
        });
        Array.from(adminSSEClients).forEach((client) => {
          client.write(`data: ${buyNotification}\n\n`);
        });

        res.status(201).json({
          orderId: order.id,
          mercadoPagoId: result.paymentId,
          status: result.status,
          paymentMethod: "pix",
          pixQrCode: result.pixQrCode,
          pixQrCodeBase64: result.pixQrCodeBase64,
          ticketUrl: result.ticketUrl,
        });
      }
    } catch (error: any) {
      console.error(
        "Payment error:",
        error?.response?.data || error?.message || error,
      );
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ error: "Dados invalidos", details: error.errors });
      } else {
        const msg =
          error?.response?.data?.message ||
          error?.message ||
          "Erro ao processar pagamento";
        res.status(500).json({ error: msg });
      }
    }
  });

  app.get("/api/payments/:orderId/status", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Pedido nao encontrado" });
      }

      if (order.pagarmeOrderId) {
        const mpStatus = await getPaymentStatus(order.pagarmeOrderId);
        const newStatus =
          mpStatus.status === "approved" ? "paid" : order.status;

        if (newStatus !== order.status) {
          await storage.updateOrderStatus(order.id, newStatus);
        }

        res.json({
          orderId: order.id,
          status: newStatus,
          mercadoPagoStatus: mpStatus.status,
        });
      } else {
        res.json({ orderId: order.id, status: order.status });
      }
    } catch (error) {
      res.status(500).json({ error: "Erro ao verificar status" });
    }
  });

  app.post("/api/webhooks/mercadopago", async (req, res) => {
    try {
      const xSignature = req.headers["x-signature"];
      const xRequestId = req.headers["x-request-id"];
      const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

      if (secret) {
        if (!xSignature || !xRequestId) {
          console.error("[MercadoPago] Missing webhook signature headers");
          return res.sendStatus(401);
        }

        const parts = String(xSignature).split(",");
        let ts = "";
        let hash = "";
        parts.forEach(part => {
          const [key, value] = part.trim().split("=");
          if (key === "ts") ts = value;
          if (key === "v1") hash = value;
        });

        if (!ts || !hash) {
          console.error("[MercadoPago] Malformed webhook signature");
          return res.sendStatus(401);
        }

        const dataId = req.query["data.id"] || req.query.id || req.body?.data?.id || "";
        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
        const hmac = crypto.createHmac("sha256", secret);
        hmac.update(manifest);
        const digest = hmac.digest("hex");

        if (digest !== hash) {
          console.error("[MercadoPago] Invalid webhook signature");
          return res.sendStatus(401);
        }
      }

      let paymentId: string | null = null;

      if (req.body?.type === "payment" && req.body?.data?.id) {
        paymentId = String(req.body.data.id);
      } else if (req.body?.action?.includes("payment") && req.body?.data?.id) {
        paymentId = String(req.body.data.id);
      } else if (req.query?.topic === "payment" && req.query?.id) {
        paymentId = String(req.query.id);
      }

      if (paymentId) {
        const mpStatus = await getPaymentStatus(paymentId);
        if (mpStatus.status === "approved") {
          const allOrders = await storage.getOrders();
          const order = allOrders.find(
            (o) => o.pagarmeOrderId === paymentId,
          );
          if (order && order.status !== "paid") {
            await storage.updateOrderStatus(order.id, "paid");
            console.log(`[MercadoPago] Pagamento aprovado para pedido ${order.id}`);
            const notification = JSON.stringify({
              type: "payment_approved",
              orderId: order.id,
              amount: order.totalPrice,
              quantity: order.quantity,
              customerName: order.customerName || "Cliente",
            });
            Array.from(adminSSEClients).forEach((client) => {
              client.write(`data: ${notification}\n\n`);
            });
          }
        }
      }
      res.sendStatus(200);
    } catch (error) {
      console.error("[MercadoPago] Webhook error:", error);
      res.sendStatus(200);
    }
  });

  return httpServer;
}
