import {
  type User, type InsertUser,
  type CoinPackage, type InsertCoinPackage,
  type Server, type InsertServer,
  type Order, type InsertOrder,
  users, coinPackages, servers, orders,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { email?: string; fullName?: string; phone?: string; role?: string }): Promise<User>;
  getUsers(): Promise<User[]>;

  getPackages(): Promise<CoinPackage[]>;
  getPackage(id: string): Promise<CoinPackage | undefined>;
  createPackage(pkg: InsertCoinPackage): Promise<CoinPackage>;

  getServers(): Promise<Server[]>;
  getServer(id: string): Promise<Server | undefined>;
  createServer(server: InsertServer): Promise<Server>;

  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  updateOrderPayment(id: string, data: {
    pagarmeOrderId?: string;
    pagarmeChargeId?: string;
    pixQrCode?: string;
    pixQrCodeUrl?: string;
    status?: string;
  }): Promise<Order | undefined>;

  getOrderStats(): Promise<{ total: number; pending: number; paid: number; sell: number; buy: number }>;
  deleteOrder(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser & { email?: string; fullName?: string; phone?: string; role?: string }): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getPackages(): Promise<CoinPackage[]> {
    return db.select().from(coinPackages);
  }

  async getPackage(id: string): Promise<CoinPackage | undefined> {
    const [pkg] = await db.select().from(coinPackages).where(eq(coinPackages.id, id));
    return pkg;
  }

  async createPackage(pkg: InsertCoinPackage): Promise<CoinPackage> {
    const [created] = await db.insert(coinPackages).values(pkg).returning();
    return created;
  }

  async getServers(): Promise<Server[]> {
    return db.select().from(servers);
  }

  async getServer(id: string): Promise<Server | undefined> {
    const [server] = await db.select().from(servers).where(eq(servers.id, id));
    return server;
  }

  async createServer(server: InsertServer): Promise<Server> {
    const [created] = await db.insert(servers).values(server).returning();
    return created;
  }

  async getOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [updated] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async updateOrderPayment(id: string, data: {
    pagarmeOrderId?: string;
    pagarmeChargeId?: string;
    pixQrCode?: string;
    pixQrCodeUrl?: string;
    status?: string;
  }): Promise<Order | undefined> {
    const updateData: Record<string, string> = {};
    if (data.pagarmeOrderId) updateData.pagarmeOrderId = data.pagarmeOrderId;
    if (data.pagarmeChargeId) updateData.pagarmeChargeId = data.pagarmeChargeId;
    if (data.pixQrCode) updateData.pixQrCode = data.pixQrCode;
    if (data.pixQrCodeUrl) updateData.pixQrCodeUrl = data.pixQrCodeUrl;
    if (data.status) updateData.status = data.status;

    const [updated] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async getOrderStats(): Promise<{ total: number; pending: number; paid: number; sell: number; buy: number }> {
    const allOrders = await db.select().from(orders);
    return {
      total: allOrders.length,
      pending: allOrders.filter(o => o.status === "pending" || o.status === "awaiting_payment").length,
      paid: allOrders.filter(o => o.status === "paid").length,
      sell: allOrders.filter(o => o.type === "sell").length,
      buy: allOrders.filter(o => o.type === "buy").length,
    };
  }

  async deleteOrder(id: string): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
