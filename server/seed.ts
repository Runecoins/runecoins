import { db } from "./db";
import { coinPackages, servers } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  const existingPackages = await db.select().from(coinPackages);
  if (existingPackages.length > 0) return;

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
