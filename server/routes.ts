import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema } from "@shared/schema";
import { z } from "zod";
import { createPixPayment, createCreditCardPayment, getOrderStatus } from "./pagarme";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

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
const SELL_PRICE_PER_UNIT = 0.06;

const paymentSchema = z.object({
  type: z.enum(["buy", "sell"]),
  characterName: z.string().min(1),
  serverId: z.string().min(1),
  quantity: z.number().min(25).max(100000),
  paymentMethod: z.enum(["pix", "credit_card"]),
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use("/uploads", (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    next();
  }, express.static(uploadsDir));

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
        res.status(400).json({ error: "Invalid order data", details: error.errors });
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
    quantity: z.string().refine((v) => !isNaN(parseInt(v)) && parseInt(v) >= 25, "Quantidade minima: 25 coins"),
    customerName: z.string().min(1, "Nome obrigatorio"),
    customerEmail: z.string().email("E-mail invalido"),
    customerPhone: z.string().min(10, "Telefone invalido"),
    pixKey: z.string().min(1, "Chave PIX obrigatoria"),
    pixAccountHolder: z.string().min(1, "Titular da conta obrigatorio"),
  });

  app.post("/api/sell-orders", upload.fields([
    { name: "storeScreenshot", maxCount: 1 },
    { name: "marketScreenshot", maxCount: 1 },
  ]), async (req, res) => {
    try {
      const validated = sellOrderSchema.parse(req.body);
      const qty = parseInt(validated.quantity);

      const totalPrice = parseFloat((SELL_PRICE_PER_UNIT * qty).toFixed(2));

      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
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
        marketScreenshot: marketFile ? `/uploads/${marketFile.filename}` : null,
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
        res.status(400).json({ error: "Dados invalidos", details: error.errors });
      } else {
        res.status(500).json({ error: "Erro ao criar pedido de venda." });
      }
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const data = paymentSchema.parse(req.body);

      if (data.type === "sell") {
        return res.status(400).json({ error: "Vendas nao sao processadas por pagamento online. Entre em contato pelo suporte." });
      }

      const pricePerUnit = data.type === "buy" ? BUY_PRICE_PER_UNIT : SELL_PRICE_PER_UNIT;
      const baseTotal = pricePerUnit * data.quantity;
      const creditCardSurcharge = data.paymentMethod === "credit_card" ? 0.05 : 0;
      const serverTotal = parseFloat((baseTotal * (1 + creditCardSurcharge)).toFixed(2));
      const amountInCents = Math.round(serverTotal * 100);

      if (amountInCents < 100) {
        return res.status(400).json({ error: "Valor minimo para pagamento: R$ 1,00" });
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
          pagarmeOrderId: result.orderId,
          pagarmeChargeId: result.chargeId,
          pixQrCode: result.pixQrCode,
          pixQrCodeUrl: result.pixQrCodeUrl,
          status: result.status === "paid" ? "paid" : "awaiting_payment",
        });

        res.status(201).json({
          orderId: order.id,
          pagarmeOrderId: result.orderId,
          status: result.status,
          paymentMethod: "pix",
          pixQrCode: result.pixQrCode,
          pixQrCodeUrl: result.pixQrCodeUrl,
        });
      } else {
        if (!data.cardNumber || !data.cardHolderName || !data.cardExpMonth || !data.cardExpYear || !data.cardCvv) {
          return res.status(400).json({ error: "Dados do cartao incompletos" });
        }

        const result = await createCreditCardPayment({
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerDocument: data.customerDocument,
          customerPhone: data.customerPhone,
          amountInCents,
          description,
          installments: data.installments || 1,
          cardNumber: data.cardNumber,
          cardHolderName: data.cardHolderName,
          cardExpMonth: data.cardExpMonth,
          cardExpYear: data.cardExpYear,
          cardCvv: data.cardCvv,
        });

        await storage.updateOrderPayment(order.id, {
          pagarmeOrderId: result.orderId,
          pagarmeChargeId: result.chargeId,
          status: result.status === "paid" ? "paid" : "processing",
        });

        res.status(201).json({
          orderId: order.id,
          pagarmeOrderId: result.orderId,
          status: result.status,
          paymentMethod: "credit_card",
        });
      }
    } catch (error: any) {
      console.error("Payment error:", error?.response?.data || error?.message || error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Dados invalidos", details: error.errors });
      } else {
        const msg = error?.response?.data?.message || error?.message || "Erro ao processar pagamento";
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
        const pagarmeStatus = await getOrderStatus(order.pagarmeOrderId);
        const newStatus = pagarmeStatus.status === "paid" ? "paid" : order.status;

        if (newStatus !== order.status) {
          await storage.updateOrderStatus(order.id, newStatus);
        }

        res.json({
          orderId: order.id,
          status: newStatus,
          pagarmeStatus: pagarmeStatus.status,
        });
      } else {
        res.json({ orderId: order.id, status: order.status });
      }
    } catch (error) {
      res.status(500).json({ error: "Erro ao verificar status" });
    }
  });

  app.post("/api/webhooks/pagarme", async (req, res) => {
    try {
      const event = req.body;
      if (event.type === "charge.paid") {
        const pagarmeOrderId = event.data?.order?.id;
        if (pagarmeOrderId) {
          const allOrders = await storage.getOrders();
          const order = allOrders.find((o) => o.pagarmeOrderId === pagarmeOrderId);
          if (order) {
            await storage.updateOrderStatus(order.id, "paid");
          }
        }
      }
      res.sendStatus(200);
    } catch (error) {
      res.sendStatus(200);
    }
  });

  return httpServer;
}
