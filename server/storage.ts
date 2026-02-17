import {
  type User, type InsertUser,
  type CoinPackage, type InsertCoinPackage,
  type Server, type InsertServer,
  type Order, type InsertOrder,
  users, coinPackages, servers, orders,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
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
    return db.select().from(orders);
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
}

export const storage = new DatabaseStorage();
