/**
 * InsForge client for po-onlineadmission.
 * Set VITE_INSFORGE_BASE_URL and VITE_INSFORGE_ANON_KEY in .env for backend mode.
 * If unset, getInsForgeClient() returns null and the app can fall back to localStorage.
 */
import { createClient, type InsForgeClient } from "@insforge/sdk";

const baseUrl =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_INSFORGE_BASE_URL
    ? String(import.meta.env.VITE_INSFORGE_BASE_URL).trim()
    : "";
const anonKey =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_INSFORGE_ANON_KEY
    ? String(import.meta.env.VITE_INSFORGE_ANON_KEY).trim()
    : "";

let clientInstance: InsForgeClient | null = null;

export function getInsForgeClient(): InsForgeClient | null {
  if (!baseUrl || !anonKey) return null;
  if (!clientInstance) {
    clientInstance = createClient({ baseUrl, anonKey });
  }
  return clientInstance;
}

export function isInsForgeConfigured(): boolean {
  return Boolean(baseUrl && anonKey);
}

export function getInsForgeBaseUrl(): string {
  return baseUrl;
}
