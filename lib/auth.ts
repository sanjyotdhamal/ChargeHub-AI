import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { z } from "zod";
import { connectDB } from "./db";
import { User } from "@/models/User";

export const COOKIE_NAME = "chargehub_session";
export const SESSION_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface SessionPayload {
  sub: string;
  email: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  return new TextEncoder().encode(secret);
}

// Passwords
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Sessions
export async function signSession(payload: SessionPayload): Promise<string> {
  const secretKey = getJwtSecret();
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const secretKey = getJwtSecret();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (!payload.sub || typeof payload.email !== "string") {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

// Current logged in user (Server context)
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const session = await verifySession(token);
    if (!session) return null;

    await connectDB();
    const userDoc = await User.findById(session.sub).select("_id name email").lean();
    if (!userDoc) return null;

    return {
      id: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
    };
  } catch {
    return null;
  }
}

// Cookie Options for response headers or cookie store
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_EXPIRY_SECONDS,
};

// Zod Validation Schemas
export const SignupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be between 2 and 60 characters")
    .max(60, "Name must be between 2 and 60 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)/,
      "Password must contain at least one letter and one number"
    ),
});

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

// Demo-level in-memory rate limiting
// NOTE: This in-memory store is for demo / single-instance development purposes only.
// In production, use Redis or a distributed key-value store.
interface RateLimitRecord {
  count: number;
  resetTime: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  ip: string,
  prefix = "auth",
  maxAttempts = 10,
  windowMs = 15 * 60 * 1000
): { allowed: boolean; remaining: number } {
  const key = `${prefix}:${ip}`;
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: maxAttempts - record.count };
}

export { isValidRedirect } from "./redirect";
