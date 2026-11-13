import { json, kv, requireAuth } from "./_utils.js";
// GET  -> { products } danh sách admin đã lưu trên KV (rỗng = dùng dữ liệu tĩnh của website)
// POST (admin) { products: [...] } -> lưu toàn bộ danh sách sản phẩm
export async function onRequestGet({ env }) {
  const store = kv(env); if (!store) return json({ products: null });
  const raw = await store.get("products");
  return json({ products: raw ? JSON.parse(raw) : null });
}
export async function onRequestPost({ request, env }) {
  const store = kv(env); if (!store) return json({ error: "Chưa gắn KV (ORDERS_KV)" }, 501);
  if (!(await requireAuth(request, env))) return json({ error: "Chưa đăng nhập" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!Array.isArray(body.products)) return json({ error: "Dữ liệu sản phẩm không hợp lệ" }, 400);
  await store.put("products", JSON.stringify(body.products));
  return json({ ok: true, count: body.products.length });
}
