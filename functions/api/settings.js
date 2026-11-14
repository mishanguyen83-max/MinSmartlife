import { json, kv, requireAuth } from "./_utils.js";
// GET  -> { settings } nội dung Hero admin đã lưu trên KV (null = dùng nội dung mặc định trong HTML)
// POST (admin) { settings: {...} } -> lưu nội dung Hero (badge, tiêu đề, mô tả, ảnh)
const LIMITS = { heroBadge: 80, heroLine1: 80, heroPre: 60, heroHighlight: 60, heroPost: 80, heroSub: 500, heroImage: 900000 };

function clean(body) {
  const src = (body && body.settings) || {};
  const out = {};
  for (const k of Object.keys(LIMITS)) {
    const v = src[k];
    if (typeof v === "string" && v.trim()) out[k] = v.trim().slice(0, LIMITS[k]);
  }
  if (out.heroImage && !/^https:\/\//i.test(out.heroImage) && !/^data:image\//i.test(out.heroImage)) delete out.heroImage;
  return out;
}

export async function onRequestGet({ env }) {
  const store = kv(env); if (!store) return json({ settings: null });
  const raw = await store.get("settings");
  return json({ settings: raw ? JSON.parse(raw) : null });
}

export async function onRequestPost({ request, env }) {
  const store = kv(env); if (!store) return json({ error: "Chưa gắn KV (ORDERS_KV)" }, 501);
  if (!(await requireAuth(request, env))) return json({ error: "Chưa đăng nhập" }, 401);
  const body = await request.json().catch(() => ({}));
  const settings = clean(body);
  await store.put("settings", JSON.stringify(settings));
  return json({ ok: true, settings });
}
