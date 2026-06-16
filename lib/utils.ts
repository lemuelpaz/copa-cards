import { db } from "./db";

export const fmt = (v: number) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function getConfig(key: string): Promise<string> {
  const row = await db.siteConfig.findUnique({ where: { key } });
  return row?.value ?? "";
}

export async function setConfig(key: string, value: string) {
  await db.siteConfig.upsert({ where: { key }, update: { value }, create: { key, value } });
}

export async function getAllConfigs(): Promise<Record<string, string>> {
  const rows = await db.siteConfig.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export type Rarity = "common" | "rare" | "epic" | "legendary";

export interface PackWeights { common: number; rare: number; epic: number; legendary: number }

export function applyWinRate(weights: PackWeights, winRate: number): PackWeights {
  const w = winRate / 100;
  const common    = Math.max(1, weights.common    * (1 + (1 - w)));
  const rare      = weights.rare;
  const epic      = Math.max(0, weights.epic      * (0.2 + w * 1.6));
  const legendary = Math.max(0, weights.legendary * (0.1 + w * 1.8));
  return { common, rare, epic, legendary };
}

export function weightedPick(weights: PackWeights): Rarity {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [k, v] of Object.entries(weights) as [Rarity, number][]) {
    r -= v;
    if (r <= 0) return k;
  }
  return "common";
}

export function formatPhone(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 11);
}
