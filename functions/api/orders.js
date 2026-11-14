import { json, kv, requireAuth } from "./_utils.js";
// GET  (admin) -> { orders: [...] }
// POST tạo đơn (công khai): {action:"create", ...order} HOẶC gửi thẳng object đơn {...order} như storefront
// POST {action:"update", id, status}     -> admin đổi trạng thái (huỷ đơn -> hoàn tồn kho; bỏ huỷ -> trừ lại)
// POST {action:"delete", id}             -> admin xoá đơn (đơn chưa huỷ -> hoàn tồn kho)
// Tồn kho: trừ khi tạo đơn, chỉ áp dụng với sản phẩm có stock là số (đang được quản lý tồn trong CMS).
const INDEX = "orders:index";
async function readIndex(store) { try { return JSON.parse((await store.get(INDEX)) || "[]"); } catch { return []; } }
async function adjustStock(store, items, dir) {
  try {
    const raw = await store.get("products");
    if (!raw) return; // CMS chưa đồng bộ danh mục lên máy chủ -> chưa quản lý tồn
    const list = JSON.parse(raw);
    let changed = false;
    (items || []).forEach((it) => {
      const p = list.find((x) => (it.sku && x.sku && x.sku === it.sku) || x.name === it.name);
      if (p && typeof p.stock === "number") {
        p.stock = Math.max(0, p.stock + dir * Number(it.qty || 0));
        changed = true;
      }
    });
    if (changed) await store.put("products", JSON.stringify(list));
  } catch (e) {}
}
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
  const isCreate = body.action === "create" || (!body.action && body.customer && Array.isArray(body.items));
  if (isCreate) {
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
    await adjustStock(store, order.items, -1);
    return json({ ok: true, id: order.id });
  }
  if (!(await requireAuth(request, env))) return json({ error: "Chưa đăng nhập" }, 401);
  if (body.action === "update") {
    const raw = await store.get("order:" + body.id);
    if (!raw) return json({ error: "Không tìm thấy đơn" }, 404);
    const order = JSON.parse(raw);
    const oldStatus = order.status;
    order.status = body.status;
    await store.put("order:" + body.id, JSON.stringify(order));
    if (oldStatus !== "cancelled" && body.status === "cancelled") await adjustStock(store, order.items, +1);
    else if (oldStatus === "cancelled" && body.status !== "cancelled") await adjustStock(store, order.items, -1);
    return json({ ok: true });
  }
  if (body.action === "delete") {
    const raw = await store.get("order:" + body.id);
    if (raw) {
      const order = JSON.parse(raw);
      if (order.status !== "cancelled") await adjustStock(store, order.items, +1);
    }
    await store.delete("order:" + body.id);
    const ids = (await readIndex(store)).filter((x) => x !== body.id);
    await store.put(INDEX, JSON.stringify(ids));
    return json({ ok: true });
  }
  return json({ error: "Action không hợp lệ" }, 400);
}
