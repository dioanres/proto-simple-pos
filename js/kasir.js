(function () {
  var st = {
    data: null,
    cart: null,
    editingId: null,
    category: "Semua",
    search: "",
    listOpen: false,
    inited: false,
  };

  var memoryStore = {};
  var memory = {
    getItem: function (k) { return k in memoryStore ? memoryStore[k] : null; },
    setItem: function (k, v) { memoryStore[k] = String(v); },
  };

  function store() {
    try {
      var s = window.localStorage;
      s.getItem("pos.probe");
      return s;
    } catch (e) {
      return memory;
    }
  }

  function $(id) { return document.getElementById(id); }

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") el.textContent = attrs[k];
      else if (k === "on") Object.keys(attrs.on).forEach(function (ev) { el.addEventListener(ev, attrs.on[ev]); });
      else if (k === "disabled") el.disabled = !!attrs[k];
      else el.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) el.appendChild(c); });
    return el;
  }

  function fmt(n) { return window.POS.sales.formatRupiah(n); }
  function setMsg(text, ok) {
    var m = $("kasir-msg");
    m.textContent = text || "";
    m.className = ok ? "muted" : "error";
  }

  function persist() {
    window.POS.storage.saveData(store(), st.data);
  }

  function reload() {
    st.data = window.POS.storage.loadData(store());
  }

  // Saat bill terbuka dimuat, stok sudah berkurang ketika disimpan.
  // Untuk validasi, stok dikembalikan sementara sesuai isi bill.
  function productsForCheck() {
    if (!st.editingId) return st.data.products;
    var bill = st.data.orders.filter(function (o) { return o.id === st.editingId; })[0];
    if (!bill) return st.data.products;
    return st.data.products.map(function (p) {
      var it = bill.items.filter(function (x) { return x.productId === p.id; })[0];
      return it ? Object.assign({}, p, { stock: p.stock + it.qty }) : p;
    });
  }

  function renderCats() {
    var wrap = $("kasir-cats");
    wrap.innerHTML = "";
    var cats = ["Semua"];
    st.data.products.forEach(function (p) {
      if (cats.indexOf(p.category) < 0) cats.push(p.category);
    });
    cats.forEach(function (c) {
      wrap.appendChild(h("button", {
        type: "button",
        class: "chip" + (c === st.category ? " active" : ""),
        text: c,
        on: { click: function () { st.category = c; render(); } },
      }));
    });
  }

  function visibleProducts() {
    var q = st.search.trim().toLowerCase();
    return st.data.products.filter(function (p) {
      var catOk = st.category === "Semua" || p.category === st.category;
      var qOk = !q || p.name.toLowerCase().indexOf(q) >= 0;
      return catOk && qOk;
    });
  }

  function renderProducts() {
    var wrap = $("kasir-products");
    wrap.innerHTML = "";
    visibleProducts().forEach(function (p) {
      wrap.appendChild(h("button", {
        type: "button",
        class: "tile",
        disabled: p.stock <= 0,
        on: { click: function () { addProduct(p.id); } },
      }, [
        h("span", { class: "name", text: p.name }),
        h("span", { class: "meta", text: fmt(p.price) + " · stok " + p.stock }),
      ]));
    });
  }

  function renderCart() {
    var list = $("kasir-items");
    list.innerHTML = "";
    var locked = !!st.editingId;
    st.cart.items.forEach(function (it) {
      list.appendChild(h("li", {}, [
        h("span", { text: it.name + " · " + it.qty + " x " + fmt(it.price) }),
        h("span", { class: "qty" }, [
          h("button", { type: "button", text: "−", disabled: locked, on: { click: function () { changeQty(it.productId, it.qty - 1); } } }),
          h("span", { text: String(it.qty) }),
          h("button", { type: "button", text: "+", disabled: locked, on: { click: function () { addProduct(it.productId); } } }),
        ]),
      ]));
    });
    if (!st.cart.items.length) {
      list.appendChild(h("li", { class: "muted", text: "Belum ada item" }));
    }

    var total = window.POS.sales.cartTotal(st.cart);
    $("kasir-total").textContent = fmt(total);

    var isCash = st.cart.payMethod === "cash";
    $("kasir-paid-wrap").hidden = !isCash;
    var change = window.POS.sales.changeDue(st.cart);
    if (isCash && change < 0) {
      $("kasir-change").textContent = "Kurang " + fmt(-change);
    } else {
      $("kasir-change").textContent = fmt(isCash ? Math.max(0, change) : 0);
    }

    $("kasir-table").value = st.cart.table;
    $("kasir-table").disabled = locked;
    $("kasir-paid").value = isCash && st.cart.paid ? String(st.cart.paid) : "";

    var ed = $("kasir-editing");
    ed.hidden = !locked;
    if (locked) ed.textContent = "Membayar open bill meja " + st.cart.table + ". Item tidak bisa diubah.";

    $("kasir-save-openbill").disabled = locked;
  }

  function renderOpenBills() {
    var open = window.POS.sales.openBills(st.data.orders);
    $("kasir-openbill-toggle").textContent = "Open Bill: " + open.length;
    var list = $("kasir-openlist");
    list.hidden = !st.listOpen;
    list.innerHTML = "";
    if (!open.length) {
      list.appendChild(h("p", { class: "muted", text: "Tidak ada open bill" }));
      return;
    }
    open.forEach(function (o) {
      list.appendChild(h("div", { class: "row" }, [
        h("span", { text: "Meja " + o.table + " · " + fmt(o.total) }),
        h("button", { type: "button", class: "btn", text: "Muat", on: { click: function () { loadOpenBill(o.id); } } }),
      ]));
    });
  }

  function render() {
    renderCats();
    renderProducts();
    renderCart();
    renderOpenBills();
  }

  function addProduct(productId) {
    if (st.editingId) {
      setMsg("Item tidak bisa diubah saat membayar open bill", false);
      return;
    }
    var p = st.data.products.filter(function (x) { return x.id === productId; })[0];
    if (!p) return;
    try {
      st.cart = window.POS.sales.addItem(st.cart, p);
      setMsg("", true);
    } catch (e) {
      setMsg(e.message, false);
    }
    render();
  }

  function changeQty(productId, qty) {
    if (st.editingId) return;
    st.cart = window.POS.sales.setQty(st.cart, productId, qty);
    setMsg("", true);
    render();
  }

  function resetCart() {
    st.cart = window.POS.sales.newCart();
    st.editingId = null;
  }

  function loadOpenBill(orderId) {
    var o = st.data.orders.filter(function (x) { return x.id === orderId; })[0];
    if (!o) return;
    st.editingId = o.id;
    st.cart = {
      items: o.items.map(function (it) { return Object.assign({}, it); }),
      table: o.table,
      payMethod: "cash",
      paid: 0,
    };
    st.listOpen = false;
    setMsg("", true);
    render();
  }

  function checkoutPay() {
    var products = productsForCheck();
    var check = window.POS.sales.validateCheckout(st.cart, "pay", products);
    if (!check.ok) return setMsg(check.error, false);

    var change = window.POS.sales.changeDue(st.cart);
    if (st.editingId) {
      st.data.orders = window.POS.sales.payOpenBill(st.data.orders, st.editingId, st.cart.payMethod, st.cart.paid);
      setMsg("Open bill dibayar. Kembali " + fmt(Math.max(0, change)), true);
    } else {
      var now = new Date().toISOString();
      var id = "o" + Date.now();
      st.data.products = window.POS.sales.applyStock(st.data.products, st.cart);
      st.data.orders.push(window.POS.sales.toOrder(st.cart, id, now, "paid"));
      setMsg("Transaksi tersimpan. Kembali " + fmt(Math.max(0, change)), true);
    }
    persist();
    resetCart();
    render();
  }

  function saveOpenBill() {
    if (st.editingId) return setMsg("Selesaikan atau kosongkan open bill yang sedang dimuat", false);
    var check = window.POS.sales.validateCheckout(st.cart, "openBill", st.data.products);
    if (!check.ok) return setMsg(check.error, false);

    var now = new Date().toISOString();
    var id = "o" + Date.now();
    st.data.products = window.POS.sales.applyStock(st.data.products, st.cart);
    st.data.orders.push(window.POS.sales.toOrder(st.cart, id, now, "open"));
    persist();
    setMsg("Open bill meja " + st.cart.table + " disimpan", true);
    resetCart();
    render();
  }

  function bindOnce() {
    if (st.inited) return;
    st.inited = true;

    $("kasir-search").addEventListener("input", function (e) {
      st.search = e.target.value;
      renderProducts();
    });
    $("kasir-search").addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      var first = visibleProducts().filter(function (p) { return p.stock > 0; })[0];
      if (first) {
        addProduct(first.id);
        $("kasir-search").value = "";
        st.search = "";
        render();
      } else {
        setMsg("Produk tidak ditemukan", false);
      }
    });

    $("kasir-table").addEventListener("input", function (e) {
      st.cart.table = e.target.value.trim();
    });
    $("kasir-paid").addEventListener("input", function (e) {
      st.cart.paid = Number(e.target.value.replace(/\D/g, "")) || 0;
      renderCart();
    });
    document.querySelectorAll('input[name="pay"]').forEach(function (r) {
      r.addEventListener("change", function () {
        st.cart.payMethod = r.value;
        renderCart();
      });
    });

    $("kasir-openbill-toggle").addEventListener("click", function () {
      st.listOpen = !st.listOpen;
      renderOpenBills();
    });
    $("kasir-clear").addEventListener("click", function () {
      resetCart();
      setMsg("", true);
      render();
    });
    $("kasir-save-openbill").addEventListener("click", saveOpenBill);
    $("kasir-pay").addEventListener("click", checkoutPay);
  }

  function init() {
    bindOnce();
    reload();
    if (!st.cart) resetCart();
    render();
    var s = $("kasir-search");
    if (s) s.focus();
  }

  var api = { init: init, render: render, productsForCheck: productsForCheck };

  if (typeof module !== "undefined") module.exports = api;
  if (typeof window !== "undefined") {
    window.POS = window.POS || {};
    window.POS.kasir = api;
  }
})();
