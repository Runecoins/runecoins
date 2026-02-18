import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  phone: text("phone"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const coinPackages = pgTable("coin_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pricePerUnit: numeric("price_per_unit", { precision: 10, scale: 4 }).notNull(),
  minQuantity: integer("min_quantity").notNull().default(25),
  maxQuantity: integer("max_quantity").notNull().default(100000),
  imageUrl: text("image_url"),
  active: boolean("active").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
});

export const servers = pgTable("servers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  characterName: text("character_name").notNull(),
  serverId: varchar("server_id").notNull(),
  packageId: varchar("package_id").notNull(),
  quantity: integer("quantity").notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method"),
  contactInfo: text("contact_info"),
  pagarmeOrderId: text("pagarme_order_id"),
  pagarmeChargeId: text("pagarme_charge_id"),
  pixQrCode: text("pix_qr_code"),
  pixQrCodeUrl: text("pix_qr_code_url"),
  customerName: text("customer_name"),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  pixKey: text("pix_key"),
  pixAccountHolder: text("pix_account_holder"),
  storeScreenshot: text("store_screenshot"),
  marketScreenshot: text("market_screenshot"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
}).extend({
  email: z.string().email().optional(),
  fullName: z.string().optional(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  email: z.string().email(),
  fullName: z.string().min(1),
  phone: z.string().min(10),
});

export const insertCoinPackageSchema = createInsertSchema(coinPackages).omit({
  id: true,
});

export const insertServerSchema = createInsertSchema(servers).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type CoinPackage = typeof coinPackages.$inferSelect;
export type InsertCoinPackage = z.infer<typeof insertCoinPackageSchema>;
export type Server = typeof servers.$inferSelect;
export type InsertServer = z.infer<typeof insertServerSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
