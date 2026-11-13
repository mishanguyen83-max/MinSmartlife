import { json, kv } from "./_utils.js";
export async function onRequestGet({ env }) {
  return json({ ok: true, kv: !!kv(env) });
}
