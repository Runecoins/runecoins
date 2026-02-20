import { db } from "./db";
import { coinPackages, servers, users } from "@shared/schema";
import { sql, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  const existingPackages = await db.select().from(coinPackages);
  if (existingPackages.length === 0) {
    await db.insert(coinPackages).values([
      {
        name: "Tibia Coins",
        description: "Tibia Coins transferiveis para qualquer servidor. Entrega via gift no jogo.",
        pricePerUnit: "0.2200",
        minQuantity: 25,
        maxQuantity: 100000,
        imageUrl: "/images/tibia-coin.png",
        active: true,
        featured: true,
      },
      {
        name: "Tibia Coins Premium",
        description: "Pacote premium com entrega prioritaria e suporte dedicado.",
        pricePerUnit: "0.2100",
        minQuantity: 1000,
        maxQuantity: 100000,
        imageUrl: "/images/tibia-coin.png",
        active: true,
        featured: false,
      },
    ]);

    await db.insert(servers).values([
      { name: "Deletera" },
      { name: "Lordebra" },
      { name: "Dominium" },
    ]);

    console.log("Database seeded successfully!");
  }

  const existingAdmin = await db.select().from(users).where(eq(users.username, "admin"));
  if (existingAdmin.length === 0) {
    const hashedPassword = await bcrypt.hash("Bduo2y99!", 10);
    await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      email: "admin@runecoins.com",
      fullName: "Administrador",
      phone: "11999999999",
      role: "admin",
    });
    console.log("Admin user created");
  } else {
    const adminUser = existingAdmin[0];
    const isCurrentPassword = await bcrypt.compare("Bduo2y99!", adminUser.password);
    if (!isCurrentPassword) {
      const hashedPassword = await bcrypt.hash("Bduo2y99!", 10);
      await db.update(users).set({ password: hashedPassword }).where(eq(users.username, "admin"));
      console.log("Admin password updated");
    }
  }
}
