import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");
const SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const COOKIE = "copa_token";

export interface JWTPayload {
  userId: string;
  phone: string;
  role: string;
}

export async function signToken(payload: JWTPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function setCookie(token: string) {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearCookie() {
  cookies().set(COOKIE, "", { maxAge: 0, path: "/" });
}
