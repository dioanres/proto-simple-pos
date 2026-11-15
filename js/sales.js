(function () {
  function newCart() {
    return { items: [], table: "", payMethod: "cash", paid: 0 };
  }

  function findProduct(products, id) {
    for (var i = 0; i < products.length; i++) {
      if (products[i].id === id) return products[i];
    }
    return null;
  }

  function addItem(cart, product) {
    var items = cart.items.slice();
    var idx = -1;
    for (var i = 0; i < items.length; i++) {
      if (items[i].productId === product.id) idx = i;
    }
    var currentQty = idx >= 0 ? items[idx].qty : 0;
    if (currentQty + 1 > product.stock) {
      throw new Error("Stok tidak cukup");
    }
    if (idx >= 0) {
      items[idx] = Object.assign({}, items[idx], { qty: currentQty + 1 });
    } else {
      items.push({ productId: product.id, name: product.name, price: product.price, qty: 1 });
    }
    return Object.assign({}, cart, { items: items });
  }

  function setQty(cart, productId, qty) {
    var items = cart.items.filter(function (it) {
      return it.productId !== productId || qty > 0;
    }).map(function (it) {
      return it.productId === productId ? Object.assign({}, it, { qty: qty }) : it;
    });
    return Object.assign({}, cart, { items: items });
  }

  function cartTotal(cart) {
    return cart.items.reduce(function (sum, it) { return sum + it.price * it.qty; }, 0);
  }

  function changeDue(cart) {
    if (cart.payMethod !== "cash") return 0;
    return cart.paid - cartTotal(cart);
  }

  function validateCheckout(cart, mode, products) {
    if (!cart.items.length) {
      return { ok: false, error: "Keranjang masih kosong" };
    }
    if (mode === "openBill" && !String(cart.table || "").trim()) {
      return { ok: false, error: "Nomor meja wajib diisi untuk open bill" };
    }
    for (var i = 0; i < cart.items.length; i++) {
      var it = cart.items[i];
      var p = findProduct(products, it.productId);
      if (!p || it.qty > p.stock) {
        return { ok: false, error: "Stok tidak cukup untuk " + it.name };
      }
    }
    if (mode === "pay" && cart.payMethod === "cash" && cart.paid < cartTotal(cart)) {
      return { ok: false, error: "Uang tunai kurang dari total" };
    }
    return { ok: true };
  }

  function toOrder(cart, id, createdAt, status) {
    var total = cartTotal(cart);
    var paid = cart.payMethod === "cash" ? cart.paid : total;
    return {
      id: id,
      table: cart.table,
      items: cart.items.map(function (it) { return Object.assign({}, it); }),
      total: total,
      payMethod: cart.payMethod,
      paid: paid,
      change: changeDue(cart),
      status: status || "paid",
      createdAt: createdAt,
    };
  }

  function applyStock(products, cart) {
    return products.map(function (p) {
      var it = cart.items.filter(function (x) { return x.productId === p.id; })[0];
      if (!it) return p;
      if (it.qty > p.stock) throw new Error("Stok tidak cukup");
      return Object.assign({}, p, { stock: p.stock - it.qty });
    });
  }

  function openBills(orders) {
    return orders.filter(function (o) { return o.status === "open"; });
  }

  function payOpenBill(orders, orderId, payMethod, paid) {
    return orders.map(function (o) {
      if (o.id !== orderId) return o;
      var cash = payMethod === "cash";
      return Object.assign({}, o, {
        status: "paid",
        payMethod: payMethod,
        paid: cash ? paid : o.total,
        change: cash ? paid - o.total : 0,
      });
    });
  }

  function formatRupiah(n) {
    var s = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return "Rp " + s;
  }

  var api = {
    formatRupiah: formatRupiah,
    newCart: newCart,
    addItem: addItem,
    setQty: setQty,
    cartTotal: cartTotal,
    changeDue: changeDue,
    validateCheckout: validateCheckout,
    toOrder: toOrder,
    applyStock: applyStock,
    openBills: openBills,
    payOpenBill: payOpenBill,
  };

  if (typeof module !== "undefined") module.exports = api;
  if (typeof window !== "undefined") {
    window.POS = window.POS || {};
    window.POS.sales = api;
  }
})();
