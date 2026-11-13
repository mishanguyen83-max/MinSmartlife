// Helpers dùng chung cho Cloudflare Pages Functions (KV binding: ORDERS_KV)
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}
export async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("msl::" + text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export function kv(env) { return env.ORDERS_KV || null; }
export async function requireAuth(request, env) {
  const store = kv(env); if (!store) return null;
  const m = (request.headers.get("Authorization") || "").match(/^Bearer (.+)$/);
  if (!m) return null;
  const user = await store.get("session:" + m[1]);
  return user || null;
}
