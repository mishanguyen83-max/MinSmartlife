import { json, kv, sha256, requireAuth } from "./_utils.js";
// Danh sách quản trị viên lưu ở KV key "admins": [{username, passHash}]
// GET  -> { hasAdmin }
// POST {action:"setup", username, password}  -> tạo admin đầu tiên (chỉ khi chưa có ai) + token
// POST {action:"login", username, password}  -> { token }
// POST {action:"create", username, password} -> (cần đăng nhập) thêm admin mới
// POST {action:"list"}                        -> (cần đăng nhập) danh sách tên đăng nhập
const KEY = "admins";
async function readAdmins(store) {
  try {
    const raw = await store.get(KEY);
    if (raw) return JSON.parse(raw);
    const legacy = await store.get("admin"); // tương thích bản cũ: 1 admin ở key "admin"
    if (legacy) { const list = [JSON.parse(legacy)]; await store.put(KEY, JSON.stringify(list)); return list; }
  } catch (e) {}
  return [];
}
async function newSession(store, username) {
  const token = crypto.randomUUID();
  await store.put("session:" + token, username, { expirationTtl: 60 * 60 * 24 * 7 });
  return token;
}
export async function onRequestGet({ env }) {
  const store = kv(env);
  if (!store) return json({ hasAdmin: false, noKv: true });
  const admins = await readAdmins(store);
  return json({ hasAdmin: admins.length > 0 });
}
export async function onRequestPost({ request, env }) {
  const store = kv(env);
  if (!store) return json({ error: "Chưa gắn KV (ORDERS_KV) cho Pages project" }, 501);
  const body = await request.json().catch(() => ({}));
  const { action, username, password } = body;
  const admins = await readAdmins(store);

  if (action === "setup") {
    if (admins.length > 0) return json({ error: "Đã có tài khoản quản trị" }, 409);
    if (!username || !password) return json({ error: "Thiếu tên đăng nhập hoặc mật khẩu" }, 400);
    admins.push({ username, passHash: await sha256(password) });
    await store.put(KEY, JSON.stringify(admins));
    return json({ token: await newSession(store, username) });
  }
  if (action === "login") {
    const found = admins.find((a) => a.username === username);
    if (!found || found.passHash !== (await sha256(password || ""))) {
      return json({ error: "Sai tên đăng nhập hoặc mật khẩu" }, 401);
    }
    return json({ token: await newSession(store, username) });
  }
  // Các action dưới đây cần đăng nhập
  if (!(await requireAuth(request, env))) return json({ error: "Chưa đăng nhập" }, 401);
  if (action === "list") return json({ admins: admins.map((a) => a.username) });
  if (action === "create") {
    if (!username || !password) return json({ error: "Thiếu tên đăng nhập hoặc mật khẩu" }, 400);
    if (admins.some((a) => a.username === username)) return json({ error: "Tên đăng nhập đã tồn tại" }, 409);
    admins.push({ username, passHash: await sha256(password) });
    await store.put(KEY, JSON.stringify(admins));
    return json({ ok: true });
  }
  return json({ error: "Action không hợp lệ" }, 400);
}
