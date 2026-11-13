/* Min Smart Life — app logic: render, filter, search, cart (local), product modal */
(function () {
  "use strict";
  var FB_URL = "https://www.facebook.com/profile.php?id=61596530125836";
  var MME_URL = "https://m.me/61596530125836";
  var products = window.MSL_PRODUCTS || [];
  var categories = window.MSL_CATEGORIES || [];
  var SMART_CATS = ["Robot lau nhà", "Máy lọc không khí, hút ẩm, phun sương", "Các loại đèn chống cận", "Đèn, vợt bắt muỗi", "Tủ lạnh, máy làm đá", "Máy rửa bát", "Loa, tai nghe, thiết bị âm thanh"];

  var state = { cat: "all", q: "", sort: "popular" };
  var cart = {};
  try { cart = JSON.parse(localStorage.getItem("msl_cart") || "{}"); } catch (e) { cart = {}; }

  function fmt(n) { return Number(n || 0).toLocaleString("vi-VN") + "₫"; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function byId(id) { return document.getElementById(id); }

  /* ---------- Product card ---------- */
  function cardHTML(p, idx) {
    var badge = p.sold >= 20 ? '<span class="p-badge">Bán chạy</span>' : (SMART_CATS.indexOf(p.category) >= 0 ? '<span class="p-badge">Smarthome</span>' : "");
    return '<article class="p-card reveal">' +
      '<div class="p-media"><img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async" onerror="this.src=\'https://placehold.co/600x600/EAF2FD/03224E?text=Min+Smart+Life\'">' + badge +
      (p.sold ? '<span class="p-sold">Đã bán ' + p.sold + '</span>' : "") + '</div>' +
      '<div class="p-body"><span class="p-cat">' + esc(p.category) + '</span>' +
      '<h3 class="p-name">' + esc(p.name) + '</h3>' +
      (p.sku ? '<span class="p-sku">Mã: ' + esc(p.sku) + (p.factory ? " • " + esc(p.factory) : "") + '</span>' : "") +
      '<div class="p-price">' + fmt(p.price) + '<small>Giá đã gồm VAT — shop xác nhận trước khi giao</small></div>' +
      '<div class="p-actions"><button class="btn btn-primary" data-add="' + idx + '">Thêm vào giỏ</button>' +
      '<button class="btn btn-detail" data-detail="' + idx + '" aria-label="Xem chi tiết">Chi tiết</button></div>' +
      '</div></article>';
  }
  function renderGrid(el, list) {
    el.innerHTML = list.map(function (p) { return cardHTML(p, products.indexOf(p)); }).join("");
    observeReveals(el);
  }

  /* ---------- Categories ---------- */
  var presentCats = [];
  function computePresentCats() {
    presentCats = [];
    products.forEach(function (p) { if (presentCats.indexOf(p.category) < 0) presentCats.push(p.category); });
  }
  computePresentCats();

  function renderCategories() {
    computePresentCats();
    var grid = byId("catGrid");
    // Ưu tiên danh mục có ảnh đẹp + có sản phẩm trước, sau đó các danh mục còn lại của Mega Sun
    var withImg = categories.filter(function (c) { return c.image; });
    var ordered = withImg.slice(0, 17);
    grid.innerHTML = ordered.map(function (c) {
      return '<button class="cat-card reveal" data-cat="' + esc(c.name) + '"><img src="' + esc(c.image) + '" alt="' + esc(c.name) + '" loading="lazy" decoding="async" onerror="this.style.display=\'none\'"><span>' + esc(c.name) + '</span></button>';
    }).join("") + '<div class="cat-more">+ ' + Math.max(0, categories.length - ordered.length) + ' danh mục khác<br>sẽ cập nhật dần</div>';
    grid.querySelectorAll("[data-cat]").forEach(function (b) {
      b.addEventListener("click", function () { setCategory(b.getAttribute("data-cat"), true); });
    });
    byId("footerCats").innerHTML = presentCats.slice(0, 6).map(function (c) {
      return '<li><a href="#san-pham" data-footcat="' + esc(c) + '">' + esc(c) + '</a></li>';
    }).join("");
    byId("footerCats").querySelectorAll("[data-footcat]").forEach(function (a) {
      a.addEventListener("click", function () { setCategory(a.getAttribute("data-footcat"), false); });
    });
  }

  /* ---------- Filters ---------- */
  function renderChips() {
    computePresentCats();
    var chips = byId("filterChips");
    var all = ["all"].concat(presentCats);
    chips.innerHTML = all.map(function (c) {
      var label = c === "all" ? "Tất cả" : c;
      return '<button class="chip-btn' + (state.cat === c ? " active" : "") + '" data-chip="' + esc(c) + '">' + esc(label) + '</button>';
    }).join("");
    chips.querySelectorAll("[data-chip]").forEach(function (b) {
      b.addEventListener("click", function () { setCategory(b.getAttribute("data-chip"), false); });
    });
  }
  function setCategory(cat, scroll) {
    state.cat = presentCats.indexOf(cat) >= 0 ? cat : "all";
    renderChips(); renderProducts();
    if (scroll) document.getElementById("san-pham").scrollIntoView({ behavior: "smooth" });
  }
  function filtered() {
    var list = products.slice();
    if (state.cat !== "all") list = list.filter(function (p) { return p.category === state.cat; });
    if (state.q) {
      var q = state.q.toLowerCase();
      list = list.filter(function (p) {
        return (p.name + " " + p.category + " " + p.sku).toLowerCase().indexOf(q) >= 0;
      });
    }
    if (state.sort === "price-asc") list.sort(function (a, b) { return a.price - b.price; });
    else if (state.sort === "price-desc") list.sort(function (a, b) { return b.price - a.price; });
    else if (state.sort === "name") list.sort(function (a, b) { return a.name.localeCompare(b.name, "vi"); });
    else list.sort(function (a, b) { return (b.sold || 0) - (a.sold || 0); });
    return list;
  }
  function renderProducts() {
    var list = filtered();
    renderGrid(byId("productGrid"), list);
    byId("emptyMsg").hidden = list.length > 0;
    byId("resultCount").textContent = "Hiển thị " + list.length + " / " + products.length + " sản phẩm" + (state.cat !== "all" ? " — danh mục: " + state.cat : "") + (state.q ? ' — tìm kiếm: "' + state.q + '"' : "");
  }

  /* ---------- Sections ---------- */
  function renderSections() {
    var best = products.slice().sort(function (a, b) { return (b.sold || 0) - (a.sold || 0); }).slice(0, 8);
    renderGrid(byId("bestGrid"), best);
    var smart = products.filter(function (p) { return SMART_CATS.indexOf(p.category) >= 0; })
      .sort(function (a, b) { return (b.sold || 0) - (a.sold || 0); }).slice(0, 8);
    renderGrid(byId("smartGrid"), smart);
  }

  /* ---------- Reveal on scroll ---------- */
  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.08 }) : null;
  function observeReveals(scope) {
    scope.querySelectorAll(".reveal:not(.in)").forEach(function (el) {
      if (io) io.observe(el); else el.classList.add("in");
    });
  }

  /* ---------- Cart ---------- */
  function saveCart() { localStorage.setItem("msl_cart", JSON.stringify(cart)); }
  function cartList() { return Object.keys(cart).map(function (k) { return { p: products[+k], qty: cart[k] }; }).filter(function (x) { return x.p; }); }
  function cartTotalQty() { return cartList().reduce(function (s, x) { return s + x.qty; }, 0); }
  function cartTotal() { return cartList().reduce(function (s, x) { return s + x.qty * x.p.price; }, 0); }
  function renderCart() {
    byId("cartCount").textContent = cartTotalQty();
    var box = byId("cartItems");
    var list = cartList();
    if (!list.length) { box.innerHTML = '<p class="drawer-empty">Giỏ hàng đang trống.<br>Hãy chọn vài món cho tổ ấm nhé!</p>'; }
    else {
      box.innerHTML = list.map(function (x) {
        var idx = products.indexOf(x.p);
        return '<div class="cart-item"><img src="' + esc(x.p.image) + '" alt=""><div class="ci-info"><strong>' + esc(x.p.name) + '</strong><span>' + fmt(x.p.price) + '</span></div>' +
          '<div><div class="qty"><button data-dec="' + idx + '" aria-label="Giảm">−</button><b>' + x.qty + '</b><button data-inc="' + idx + '" aria-label="Tăng">+</button></div>' +
          '<button class="ci-remove" data-remove="' + idx + '">Xóa</button></div></div>';
      }).join("");
    }
    byId("cartTotal").textContent = fmt(cartTotal());
    box.querySelectorAll("[data-inc]").forEach(function (b) { b.addEventListener("click", function () { cart[b.dataset.inc]++; saveCart(); renderCart(); }); });
    box.querySelectorAll("[data-dec]").forEach(function (b) { b.addEventListener("click", function () { var k = b.dataset.dec; cart[k]--; if (cart[k] <= 0) delete cart[k]; saveCart(); renderCart(); }); });
    box.querySelectorAll("[data-remove]").forEach(function (b) { b.addEventListener("click", function () { delete cart[b.dataset.remove]; saveCart(); renderCart(); }); });
  }
  function addToCart(idx, openDrawer) {
    cart[idx] = (cart[idx] || 0) + 1; saveCart(); renderCart();
    if (openDrawer) openCart(); else { var cb = byId("cartBtn"); if (cb.animate) { try { cb.animate([{ transform: "scale(1)" }, { transform: "scale(1.18)" }, { transform: "scale(1)" }], { duration: 260 }); } catch (e) {} } }
  }
  function openCart() { byId("cartDrawer").classList.add("open"); byId("cartDrawer").setAttribute("aria-hidden", "false"); var b = byId("drawerBackdrop"); b.hidden = false; b.classList.add("open"); b.style.display = ""; }
  function closeCart() { byId("cartDrawer").classList.remove("open"); byId("cartDrawer").setAttribute("aria-hidden", "true"); var b = byId("drawerBackdrop"); b.hidden = true; b.classList.remove("open"); b.style.display = "none"; }

  /* ---------- Modal ---------- */
  var modalIdx = null;
  function openModal(idx) {
    var p = products[idx]; if (!p) return; modalIdx = idx;
    byId("modalImg").src = p.image; byId("modalImg").alt = p.name;
    byId("modalCat").textContent = p.category;
    byId("modalName").textContent = p.name;
    byId("modalSku").textContent = (p.sku ? "Mã sản phẩm: " + p.sku : "") + (p.factory ? " • Xuất xứ: " + p.factory : "") + (p.sold ? " • Đã bán: " + p.sold : "");
    byId("modalPrice").textContent = fmt(p.price);
    var lines = (p.desc && p.desc.length) ? p.desc.slice(0, 6) : ["Sản phẩm chính hãng, bảo hành theo chính sách nhà sản xuất.", "Tư vấn chi tiết và báo giá tốt nhất qua Fanpage Min Smart Life."];
    byId("modalDesc").innerHTML = lines.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("");
    var thumbs = byId("modalThumbs");
    var imgs = (p.images && p.images.length) ? p.images : [p.image];
    thumbs.innerHTML = imgs.map(function (src, i) {
      return '<button data-thumb="' + esc(src) + '" class="' + (i === 0 ? "active" : "") + '"><img src="' + esc(src) + '" alt="" loading="lazy"></button>';
    }).join("");
    thumbs.querySelectorAll("[data-thumb]").forEach(function (b) {
      b.addEventListener("click", function () {
        byId("modalImg").src = b.getAttribute("data-thumb");
        thumbs.querySelectorAll("button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
      });
    });
    var mb = byId("modalBackdrop"); mb.hidden = false; mb.classList.add("open"); mb.style.display = "";
    document.body.style.overflow = "hidden";
  }
  function closeModal() { var mb = byId("modalBackdrop"); mb.hidden = true; mb.classList.remove("open"); mb.style.display = "none"; document.body.style.overflow = ""; }

  /* ---------- Events ---------- */
  document.addEventListener("click", function (e) {
    var add = e.target.closest("[data-add]");
    if (add) { addToCart(+add.getAttribute("data-add"), false); return; }
    var det = e.target.closest("[data-detail]");
    if (det) { openModal(+det.getAttribute("data-detail")); }
  });
  byId("searchForm").addEventListener("submit", function (e) {
    e.preventDefault();
    state.q = byId("searchInput").value.trim();
    renderProducts();
    document.getElementById("san-pham").scrollIntoView({ behavior: "smooth" });
  });
  byId("searchInput").addEventListener("input", function (e) { state.q = e.target.value.trim(); renderProducts(); });
  byId("sortSelect").addEventListener("change", function (e) { state.sort = e.target.value; renderProducts(); });
  byId("cartBtn").addEventListener("click", openCart);
  byId("cartClose").addEventListener("click", closeCart);
  byId("drawerBackdrop").addEventListener("click", closeCart);
  byId("modalClose").addEventListener("click", closeModal);
  byId("modalBackdrop").addEventListener("click", function (e) { if (e.target === this) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeModal(); closeCart(); } });
  byId("modalAdd").addEventListener("click", function () { if (modalIdx != null) { closeModal(); addToCart(modalIdx, true); } });
  byId("menuBtn").addEventListener("click", function () {
    var nav = byId("mainNav"); var open = nav.classList.toggle("open");
    this.setAttribute("aria-expanded", open ? "true" : "false");
  });
  /* ---------- Checkout: form thông tin khách + tự soạn tin nhắn Fanpage ---------- */
  var coFields = { name: "coName", phone: "coPhone", email: "coEmail", address: "coAddress" };
  function loadCustomer() {
    try {
      var saved = JSON.parse(localStorage.getItem("msl_customer") || "{}");
      Object.keys(coFields).forEach(function (k) { if (saved[k]) byId(coFields[k]).value = saved[k]; });
    } catch (e) {}
  }
  function saveCustomer() {
    var data = {};
    Object.keys(coFields).forEach(function (k) { data[k] = byId(coFields[k]).value.trim(); });
    try { localStorage.setItem("msl_customer", JSON.stringify(data)); } catch (e) {}
    return data;
  }
  Object.keys(coFields).forEach(function (k) {
    byId(coFields[k]).addEventListener("input", function () {
      byId("f-" + k).classList.remove("show-err");
      byId(coFields[k]).classList.remove("invalid");
    });
  });
  function markInvalid(k, bad) {
    byId("f-" + k).classList.toggle("show-err", bad);
    byId(coFields[k]).classList.toggle("invalid", bad);
    return !bad;
  }
  function validateCustomer(data) {
    var ok = true;
    ok = markInvalid("name", data.name.length < 2) && ok;
    ok = markInvalid("phone", !/^0\d{9}$/.test(data.phone.replace(/[\s.]/g, ""))) && ok;
    ok = markInvalid("email", !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) && ok;
    ok = markInvalid("address", data.address.length < 8) && ok;
    return ok;
  }
  byId("orderBtn").addEventListener("click", function () {
    var list = cartList();
    var status = byId("orderStatus");
    if (!list.length) { status.textContent = "Giỏ hàng đang trống — bạn chọn thêm sản phẩm trước khi đặt hàng nhé."; return; }
    var data = saveCustomer();
    if (!validateCustomer(data)) {
      status.textContent = "Bạn kiểm tra lại các ô đang báo đỏ giúp shop nhé.";
      var firstBad = document.querySelector(".checkout-form .invalid");
      if (firstBad) { try { firstBad.focus(); if (firstBad.scrollIntoView) firstBad.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) {} }
      return;
    }
    var order = {
      id: "MSL" + Date.now().toString().slice(-8),
      createdAt: new Date().toISOString(),
      customer: { name: data.name, phone: data.phone, email: data.email, address: data.address },
      items: list.map(function (x) { return { name: x.p.name, sku: x.p.sku || "", price: x.p.price, qty: x.qty }; }),
      total: cartTotal(),
      status: "new"
    };
    saveOrderToCMS(order);
    var text = "Xin chào Min Smart Life, mình vừa đặt đơn " + order.id + " trên website:\n"
      + "Họ và tên: " + data.name + "\nSố điện thoại: " + data.phone + "\nEmail: " + data.email + "\nĐịa chỉ giao hàng: " + data.address + "\n"
      + list.map(function (x, i) { return (i + 1) + ". " + x.p.name + " — SL: " + x.qty + " — " + fmt(x.p.price * x.qty); }).join("\n")
      + "\nTạm tính: " + fmt(order.total);
    var fbBtn = byId("fbOrderBtn");
    fbBtn.href = MME_URL + "?text=" + encodeURIComponent(text);
    fbBtn.hidden = false;
    cart = {}; saveCart(); renderCart();
    status.innerHTML = "Đặt hàng thành công! Mã đơn của bạn là <b>" + order.id + "</b>. Shop đã nhận được thông tin trong hệ thống quản trị và sẽ liên hệ xác nhận sớm nhất.";
  });

  /* ---------- Dữ liệu CMS: đơn hàng + sản phẩm quản trị từ admin.html / Cloudflare ---------- */
  function saveOrderToCMS(order) {
    try {
      var arr = JSON.parse(localStorage.getItem("msl_orders") || "[]");
      arr.unshift(order);
      localStorage.setItem("msl_orders", JSON.stringify(arr.slice(0, 500)));
    } catch (e) {}
    if (/^https?:$/.test(window.location.protocol)) {
      try { fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(order) }).catch(function () {}); } catch (e) {}
    }
  }
  function applyProducts(newList) {
    if (!newList || !newList.length) return;
    products.length = 0;
    newList.forEach(function (p) { products.push(p); });
    computePresentCats();
    renderCategories(); renderChips(); renderSections(); renderProducts();
  }
  function loadDynamicProducts() {
    try {
      var ov = JSON.parse(localStorage.getItem("msl_products") || "null");
      if (ov && ov.length) applyProducts(ov);
    } catch (e) {}
    if (window.fetch && /^https?:$/.test(window.location.protocol)) {
      fetch("/api/products").then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { if (d && d.products && d.products.length) applyProducts(d.products); })
        .catch(function () {});
    }
  }

  /* ---------- Init ---------- */
  try {
    var sParam = new URLSearchParams(window.location.search).get("s");
    if (sParam) { state.q = sParam; byId("searchInput").value = sParam; }
  } catch (e) {}
  try {
    var qs = new URLSearchParams(window.location.search);
    if (qs.get("tu_cms") === "1") {
      sessionStorage.setItem("msl_from_cms", "1");
      if (window.history && history.replaceState) history.replaceState(null, "", window.location.pathname + window.location.hash);
    }
    if (sessionStorage.getItem("msl_from_cms") === "1") byId("cmsBackBtn").hidden = false;
  } catch (e) {}
  loadCustomer();
  renderCategories();
  renderChips();
  renderSections();
  renderProducts();
  renderCart();
  loadDynamicProducts();
  observeReveals(document);
})();
