import { readFileSync } from "fs";
import path from "path";

try {
  const env = readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z_][^=]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
} catch {}

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const prices: Record<string, number> = {
  bronze:    1,
  silver:    5,
  gold:      10,
  legendary: 10,
};

async function main() {
  for (const [id, price] of Object.entries(prices)) {
    await prisma.pack.update({ where: { id }, data: { price } });
    console.log(`✅  ${id} → R$ ${price.toFixed(2)}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
