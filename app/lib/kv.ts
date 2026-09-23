import { kv } from "@vercel/kv";

export function isKvConfigured(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
  );
}

export function getKv() {
  if (!isKvConfigured()) {
    throw new Error("KV is not configured");
  }
  return kv;
}
