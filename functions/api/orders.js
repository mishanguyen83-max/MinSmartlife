import { json, kv, requireAuth } from "./_utils.js";
// GET  (admin) -> { orders: [...] }
// POST {action:"create", ...order}      -> khách đặt hàng (công khai)
// POST {action:"update", id, status}     -> admin đổi trạng thái
// POST {action:"delete", id}             -> admin xoá đơn
const INDEX = "orders:index";
async function readIndex(store) { try { return JSON.parse((await store.get(INDEX)) || "[]"); } catch { return []; } }
export async function onRequestGet({ request, env }) {
  const store = kv(env); if (!store) return json({ orders: [] });
  if (!(await requireAuth(request, env))) return json({ error: "Chưa đăng nhập" }, 401);
  const ids = await readIndex(store);
  const orders = [];
  for (const id of ids.slice(0, 500)) {
    const raw = await store.get("order:" + id);
    if (raw) orders.push(JSON.parse(raw));
  }
  return json({ orders });
}
export async function onRequestPost({ request, env }) {
  const store = kv(env); if (!store) return json({ error: "Chưa gắn KV (ORDERS_KV)" }, 501);
  const body = await request.json().catch(() => ({}));
  if (body.action === "create") {
    const order = {
      id: String(body.id || ("MSL" + Date.now().toString().slice(-8))),
      createdAt: body.createdAt || new Date().toISOString(),
      customer: body.customer || {}, items: body.items || [],
      total: Number(body.total || 0), status: "new",
    };
    await store.put("order:" + order.id, JSON.stringify(order));
    const ids = await readIndex(store);
    ids.unshift(order.id);
    await store.put(INDEX, JSON.stringify([...new Set(ids)].slice(0, 500)));
    return json({ ok: true, id: order.id });
  }
  if (!(await requireAuth(request, env))) return json({ error: "Chưa đăng nhập" }, 401);
  if (body.action === "update") {
    const raw = await store.get("order:" + body.id);
    if (!raw) return json({ error: "Không tìm thấy đơn" }, 404);
    const order = JSON.parse(raw); order.status = body.status;
    await store.put("order:" + body.id, JSON.stringify(order));
    return json({ ok: true });
  }
  if (body.action === "delete") {
    await store.delete("order:" + body.id);
    const ids = (await readIndex(store)).filter((x) => x !== body.id);
    await store.put(INDEX, JSON.stringify(ids));
    return json({ ok: true });
  }
  return json({ error: "Action không hợp lệ" }, 400);
}
