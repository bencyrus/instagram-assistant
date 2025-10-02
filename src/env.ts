import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { Credentials } from "./types";

export function loadEnv(): void {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

export function getCredentials(): Credentials {
  const username = process.env.IG_USERNAME?.trim();
  const password = process.env.IG_PASSWORD?.trim();
  if (!username || !password) {
    throw new Error("Missing IG_USERNAME or IG_PASSWORD in environment");
  }
  return { username, password };
}

export const DATA_DIR = path.resolve(process.cwd(), "data");
export const STORAGE_DIR = path.resolve(process.cwd(), "playwright/.auth");

export function ensureDirs(): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORAGE_DIR))
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}
