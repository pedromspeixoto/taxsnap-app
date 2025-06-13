import bcrypt from "bcryptjs";
import { clsx, type ClassValue } from "clsx"
import { randomBytes } from "crypto";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

export async function generateSecureToken(): Promise<string> {
  const buffer = randomBytes(32);
  return buffer.toString('hex');
}