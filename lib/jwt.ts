// Módulo edge-compatible para verificação de JWT (usado no middleware)
// Não importa "next/headers" — compatível com Edge Runtime
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "change-me");

export interface JWTPayload { userId: string; phone: string; role: string; }

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
