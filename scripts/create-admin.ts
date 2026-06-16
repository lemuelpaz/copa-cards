import { db } from "../lib/db";
import { hashPassword } from "../lib/password";
import { randomBytes } from "crypto";

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  return Array.from(randomBytes(12)).map(b => chars[b % chars.length]).join("");
}

async function main() {
  const username = "admin";
  const password = process.argv[2] ?? generatePassword();

  const hash = await hashPassword(password);

  const existing = await db.user.findFirst({ where: { phone: username } });
  if (existing) {
    await db.user.update({
      where: { id: existing.id },
      data: { passwordHash: hash, role: "admin", name: "Administrador" },
    });
    console.log("✓ Admin atualizado");
  } else {
    await db.user.create({
      data: { phone: username, name: "Administrador", role: "admin", balance: 0, passwordHash: hash },
    });
    console.log("✓ Admin criado");
  }

  console.log("\n=== Credenciais ===");
  console.log("Usuário:", username);
  console.log("Senha:  ", password);
  console.log("URL:     /admin/login");
  console.log("===================\n");

  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
