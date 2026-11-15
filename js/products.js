(function () {
  function isInt(n) {
    return typeof n === "number" && isFinite(n) && Math.floor(n) === n;
  }

  function validateProduct(input) {
    if (!String(input.name || "").trim()) {
      return { ok: false, error: "Nama produk wajib diisi" };
    }
    if (!String(input.category || "").trim()) {
      return { ok: false, error: "Kategori wajib diisi" };
    }
    if (!isInt(input.price) || input.price < 0) {
      return { ok: false, error: "Harga harus bilangan bulat dan tidak negatif" };
    }
    if (!isInt(input.stock) || input.stock < 0) {
      return { ok: false, error: "Stok harus bilangan bulat dan tidak negatif" };
    }
    return { ok: true };
  }

  var counter = 0;
  function newId() {
    counter++;
    return "p" + Date.now().toString(36) + counter;
  }

  function upsertProduct(products, input) {
    var item = {
      id: input.id || newId(),
      name: String(input.name).trim(),
      category: String(input.category).trim(),
      price: input.price,
      stock: input.stock,
    };
    var found = false;
    var out = products.map(function (p) {
      if (p.id === item.id) { found = true; return item; }
      return p;
    });
    if (!found) out.push(item);
    return out;
  }

  function adjustStock(products, productId, delta) {
    return products.map(function (p) {
      if (p.id !== productId) return p;
      var next = p.stock + delta;
      if (next < 0) throw new Error("Stok tidak boleh negatif");
      return Object.assign({}, p, { stock: next });
    });
  }

  // Diekspor dari sales.js agar satu sumber untuk format rupiah.
  var formatRupiah = typeof window !== "undefined"
    ? window.POS.sales.formatRupiah
    : require("./sales.js").formatRupiah;

  // ===== UI layar Produk & Stok =====
  var st = { data: null, editId: null, inited: false };
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

  function setMsg(text) { $("prod-msg").textContent = text || ""; }

  function persist() { window.POS.storage.saveData(store(), st.data); }

  function resetForm() {
    st.editId = null;
    $("prod-form-title").textContent = "Tambah produk";
    $("prod-id").value = "";
    $("prod-name").value = "";
    $("prod-category").value = "";
    $("prod-price").value = "";
    $("prod-stock").value = "";
    setMsg("");
  }

  function renderRows() {
    var tbody = $("prod-rows");
    tbody.innerHTML = "";
    st.data.products.forEach(function (p) {
      var tr = document.createElement("tr");
      tr.appendChild(cell(p.name));
      tr.appendChild(cell(p.category));
      tr.appendChild(cell(api.formatRupiah(p.price), "num"));

      var stockTd = document.createElement("td");
      stockTd.className = "num";
      stockTd.appendChild(stockBtn("−", p.id, -1));
      var n = document.createElement("span");
      n.textContent = " " + p.stock + " ";
      stockTd.appendChild(n);
      stockTd.appendChild(stockBtn("+", p.id, 1));
      tr.appendChild(stockTd);

      var actTd = document.createElement("td");
      var edit = document.createElement("button");
      edit.type = "button";
      edit.className = "btn ghost";
      edit.textContent = "Ubah";
      edit.addEventListener("click", function () { startEdit(p.id); });
      actTd.appendChild(edit);
      tr.appendChild(actTd);

      tbody.appendChild(tr);
    });
    var cats = [];
    st.data.products.forEach(function (p) {
      if (cats.indexOf(p.category) < 0) cats.push(p.category);
    });
    $("prod-cats").innerHTML = "";
    cats.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c;
      $("prod-cats").appendChild(o);
    });
  }

  function cell(text, cls) {
    var td = document.createElement("td");
    if (cls) td.className = cls;
    td.textContent = text;
    return td;
  }

  function stockBtn(label, id, delta) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "btn ghost";
    b.textContent = label;
    b.addEventListener("click", function () {
      try {
        st.data.products = adjustStock(st.data.products, id, delta);
        persist();
        setMsg("");
        renderRows();
      } catch (e) {
        setMsg(e.message);
      }
    });
    return b;
  }

  function startEdit(id) {
    var p = st.data.products.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    st.editId = id;
    $("prod-form-title").textContent = "Ubah produk";
    $("prod-id").value = p.id;
    $("prod-name").value = p.name;
    $("prod-category").value = p.category;
    $("prod-price").value = String(p.price);
    $("prod-stock").value = String(p.stock);
    setMsg("");
  }

  function submitForm(e) {
    e.preventDefault();
    var input = {
      id: $("prod-id").value,
      name: $("prod-name").value,
      category: $("prod-category").value,
      price: Number($("prod-price").value),
      stock: Number($("prod-stock").value),
    };
    var check = validateProduct(input);
    if (!check.ok) return setMsg(check.error);
    st.data.products = upsertProduct(st.data.products, input);
    persist();
    resetForm();
    renderRows();
  }

  function bindOnce() {
    if (st.inited) return;
    st.inited = true;
    $("prod-form").addEventListener("submit", submitForm);
    $("prod-cancel").addEventListener("click", resetForm);
  }

  function init() {
    bindOnce();
    st.data = window.POS.storage.loadData(store());
    resetForm();
    renderRows();
  }

  var api = {
    init: init,
    validateProduct: validateProduct,
    upsertProduct: upsertProduct,
    adjustStock: adjustStock,
    formatRupiah: formatRupiah,
  };

  if (typeof module !== "undefined") module.exports = api;
  if (typeof window !== "undefined") {
    window.POS = window.POS || {};
    window.POS.products = api;
  }
})();
