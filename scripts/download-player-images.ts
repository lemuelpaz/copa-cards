/**
 * Baixa fotos dos jogadores da Wikipedia (Creative Commons) e atualiza o banco.
 * Uso: $env:DATABASE_URL="postgresql://..."; npx tsx scripts/download-player-images.ts
 */

import { readFileSync, existsSync } from "fs";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// Carrega .env.local manualmente
try {
  const env = readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
  for (const line of env.split("\n")) {
    const m = line.match(/^([A-Z_][^=]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  }
} catch {}

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Mapa: nome do card → título exato na Wikipedia em inglês
const WIKI: Record<string, string> = {
  "Vinicius Jr":       "Vinícius Júnior",
  "Kylian Mbappé":     "Kylian Mbappé",
  "Erling Haaland":    "Erling Haaland",
  "Lamine Yamal":      "Lamine Yamal",
  "Jude Bellingham":   "Jude Bellingham",
  "Lionel Messi":      "Lionel Messi",
  "Florian Wirtz":     "Florian Wirtz",
  "Pedri":             "Pedri",
  "R. Lewandowski":    "Robert Lewandowski",
  "Cristiano Ronaldo": "Cristiano Ronaldo",
  "Rodrygo":           "Rodrygo",
  "Richarlison":       "Richarlison",
  "Raphinha":          "Raphinha",
  "Bruno Fernandes":   "Bruno Fernandes (footballer, born 1994)",
  "Rafael Leão":       "Rafael Leão",
  "Harry Kane":        "Harry Kane",
  "Phil Foden":        "Phil Foden",
  "Bukayo Saka":       "Bukayo Saka",
  "Julián Álvarez":    "Julián Álvarez (footballer)",
  "Lautaro Martínez":  "Lautaro Martínez",
  "Jamal Musiala":     "Jamal Musiala",
  "Achraf Hakimi":     "Achraf Hakimi",
  "Endrick":           "Endrick Felipe",
  "Casemiro":          "Casemiro",
  "Marquinhos":        "Marquinhos",
  "Rodrigo De Paul":   "Rodrigo De Paul",
  "Theo Hernandez":    "Theo Hernández",
  "Virgil van Dijk":   "Virgil van Dijk",
  "Christian Pulisic": "Christian Pulisic",
  "Gavi":              "Gavi (footballer)",
  "Fede Valverde":     "Federico Valverde",
  "Darwin Núñez":      "Darwin Núñez",
  "Alisson Becker":    "Alisson Becker",
  "Gabriel Magalhães": "Gabriel Magalhães",
  "G. Martinelli":     "Gabriel Martinelli",
  "Kai Havertz":       "Kai Havertz",
  "Ferran Torres":     "Ferran Torres",
  "Diogo Jota":        "Diogo Jota",
  "Marcus Rashford":   "Marcus Rashford",
  "Sofyan Amrabat":    "Sofyan Amrabat",
};

function slugify(name: string): string {
  return name
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function getWikiImageUrl(title: string): Promise<string | null> {
  // Tenta 1: REST API summary (mais confiável)
  try {
    const slug = encodeURIComponent(title.replace(/ /g, "_"));
    const res  = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`, {
      headers: {
        "User-Agent":     "Copa2026/1.0 (educational; contact: admin@copa2026.com)",
        "Api-User-Agent": "Copa2026/1.0",
      },
    });
    if (res.ok) {
      const data = await res.json() as any;
      const src  = data?.originalimage?.source ?? data?.thumbnail?.source;
      if (src && !src.toLowerCase().endsWith(".svg")) return src;
    }
  } catch {}

  // Tenta 2: MediaWiki pageimages API
  try {
    const url =
      `https://en.wikipedia.org/w/api.php?action=query` +
      `&titles=${encodeURIComponent(title)}` +
      `&prop=pageimages&format=json&pithumbsize=600&pilicense=any`;
    const res   = await fetch(url, { headers: { "User-Agent": "Copa2026/1.0 (educational)" } });
    const data  = await res.json() as any;
    const pages = data?.query?.pages ?? {};
    const page  = Object.values(pages)[0] as any;
    const src   = page?.thumbnail?.source as string | undefined;
    if (src && !src.toLowerCase().endsWith(".svg")) return src;
  } catch {}

  return null;
}

async function download(url: string, dest: string, retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; Copa2026Bot/1.0; +educational)",
          "Referer":    "https://en.wikipedia.org/",
          "Accept":     "image/webp,image/jpeg,image/png,image/*",
        },
      });
      if (!res.ok) { await sleep(800); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(dest, buf);
      return true;
    } catch {
      await sleep(800);
    }
  }
  return false;
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const cards = await prisma.card.findMany({ orderBy: { rarity: "desc" } });
  console.log(`\n🃏  ${cards.length} cards encontrados no banco\n`);

  let ok = 0, skip = 0, fail = 0;

  for (const card of cards) {
    // Já tem foto e o arquivo existe — pula
    if (card.photo && existsSync(path.join(process.cwd(), "public", card.photo))) {
      console.log(`⏭️   ${card.name.padEnd(22)} já possui foto`);
      skip++;
      continue;
    }

    const wikiTitle = WIKI[card.name];
    if (!wikiTitle) {
      console.log(`⚠️   ${card.name.padEnd(22)} sem mapeamento Wikipedia`);
      fail++;
      continue;
    }

    // Busca URL da imagem na Wikipedia
    const imgUrl = await getWikiImageUrl(wikiTitle);
    if (!imgUrl) {
      console.log(`❌   ${card.name.padEnd(22)} imagem não encontrada`);
      fail++;
      await sleep(400);
      continue;
    }

    // Determina extensão
    const rawExt = imgUrl.split(".").pop()?.split(/[?#]/)[0]?.toLowerCase() ?? "jpg";
    const ext    = ["jpg","jpeg","png","webp"].includes(rawExt) ? rawExt : "jpg";
    const fname  = `player-${slugify(card.name)}.${ext}`;
    const dest   = path.join(uploadsDir, fname);

    const saved = await download(imgUrl, dest);
    if (!saved) {
      console.log(`❌   ${card.name.padEnd(22)} falha no download`);
      fail++;
      await sleep(400);
      continue;
    }

    await prisma.card.update({
      where: { id: card.id },
      data:  { photo: `/uploads/${fname}` },
    });

    console.log(`✅   ${card.name.padEnd(22)} → /uploads/${fname}`);
    ok++;

    // Pausa cortês para não sobrecarregar a Wikipedia
    await sleep(500);
  }

  console.log(`\n──────────────────────────────────`);
  console.log(`✅ Baixados:  ${ok}`);
  console.log(`⏭️  Pulados:   ${skip}`);
  console.log(`❌ Falharam: ${fail}`);
  console.log(`──────────────────────────────────\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
