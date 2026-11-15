(function () {
  var ROLES = ["superadmin", "supervisor", "cashier"];
  var ROLE_LABEL = { superadmin: "Superadmin", supervisor: "Supervisor", cashier: "Kasir" };

  function validateAccount(users, input) {
    var username = String(input.username || "").trim();
    if (!username) return { ok: false, error: "Username wajib diisi" };
    if (!String(input.name || "").trim()) return { ok: false, error: "Nama wajib diisi" };
    if (ROLES.indexOf(input.role) < 0) return { ok: false, error: "Role tidak dikenal" };
    var dup = users.some(function (u) {
      return u.username === username && u.id !== input.id;
    });
    if (dup) return { ok: false, error: "Username sudah dipakai" };
    var isNew = !input.id;
    var pw = String(input.password || "");
    if (isNew && pw.length < 4) return { ok: false, error: "Password minimal 4 karakter" };
    if (!isNew && pw.length > 0 && pw.length < 4) return { ok: false, error: "Password minimal 4 karakter" };
    return { ok: true };
  }

  function upsertAccount(users, input) {
    var username = String(input.username).trim();
    var name = String(input.name).trim();
    var found = false;
    var out = users.map(function (u) {
      if (u.id !== input.id) return u;
      found = true;
      var pw = input.password ? String(input.password) : u.password;
      return Object.assign({}, u, { username: username, name: name, role: input.role, password: pw });
    });
    if (!found) {
      out.push({
        id: "u" + Date.now().toString(36) + Math.floor(Math.random() * 1000),
        username: username,
        password: String(input.password),
        name: name,
        role: input.role,
      });
    }
    return out;
  }

  function removeAccount(users, userId, actingUserId) {
    if (userId === actingUserId) throw new Error("Tidak bisa menghapus akun sendiri");
    var target = users.filter(function (u) { return u.id === userId; })[0];
    if (!target) return users;
    if (target.role === "superadmin") {
      var count = users.filter(function (u) { return u.role === "superadmin"; }).length;
      if (count <= 1) throw new Error("Tidak bisa menghapus superadmin terakhir");
    }
    return users.filter(function (u) { return u.id !== userId; });
  }

  // ===== UI layar Akun =====
  var st = { data: null, me: null, editId: null, inited: false };
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
  function setMsg(t) { $("acc-msg").textContent = t || ""; }
  function persist() { window.POS.storage.saveData(store(), st.data); }

  function sessionMe() {
    try {
      var raw = window.sessionStorage.getItem("pos.session");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function resetForm() {
    st.editId = null;
    $("acc-form-title").textContent = "Tambah akun";
    $("acc-id").value = "";
    $("acc-username").value = "";
    $("acc-name").value = "";
    $("acc-role").value = "cashier";
    $("acc-password").value = "";
    $("acc-password").placeholder = "Minimal 4 karakter";
    setMsg("");
  }

  function startEdit(id) {
    var u = st.data.users.filter(function (x) { return x.id === id; })[0];
    if (!u) return;
    st.editId = id;
    $("acc-form-title").textContent = "Ubah akun";
    $("acc-id").value = u.id;
    $("acc-username").value = u.username;
    $("acc-name").value = u.name;
    $("acc-role").value = u.role;
    $("acc-password").value = "";
    $("acc-password").placeholder = "Kosongkan jika tidak diganti";
    setMsg("");
  }

  function td(text) {
    var el = document.createElement("td");
    el.textContent = text;
    return el;
  }

  function btn(label, cls, handler) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.textContent = label;
    b.addEventListener("click", handler);
    return b;
  }

  function renderRows() {
    var tbody = $("acc-rows");
    tbody.innerHTML = "";
    st.data.users.forEach(function (u) {
      var tr = document.createElement("tr");
      tr.appendChild(td(u.name));
      tr.appendChild(td(u.username));
      tr.appendChild(td(ROLE_LABEL[u.role] || u.role));
      var act = document.createElement("td");
      act.appendChild(btn("Ubah", "btn ghost", function () { startEdit(u.id); }));
      if (!st.me || u.id !== st.me.id) {
        act.appendChild(btn("Hapus", "btn ghost", function () { removeUser(u.id); }));
      }
      tr.appendChild(act);
      tbody.appendChild(tr);
    });
  }

  function removeUser(id) {
    try {
      st.data.users = removeAccount(st.data.users, id, st.me ? st.me.id : null);
      persist();
      setMsg("");
      renderRows();
    } catch (e) {
      setMsg(e.message);
    }
  }

  function submitForm(e) {
    e.preventDefault();
    var input = {
      id: $("acc-id").value,
      username: $("acc-username").value,
      name: $("acc-name").value,
      role: $("acc-role").value,
      password: $("acc-password").value,
    };
    var check = validateAccount(st.data.users, input);
    if (!check.ok) return setMsg(check.error);
    st.data.users = upsertAccount(st.data.users, input);
    persist();
    resetForm();
    renderRows();
  }

  function bindOnce() {
    if (st.inited) return;
    st.inited = true;
    $("acc-form").addEventListener("submit", submitForm);
    $("acc-cancel").addEventListener("click", resetForm);
  }

  function init() {
    bindOnce();
    st.data = window.POS.storage.loadData(store());
    st.me = sessionMe();
    resetForm();
    renderRows();
  }

  var api = {
    init: init,
    validateAccount: validateAccount,
    upsertAccount: upsertAccount,
    removeAccount: removeAccount,
  };

  if (typeof module !== "undefined") module.exports = api;
  if (typeof window !== "undefined") {
    window.POS = window.POS || {};
    window.POS.accounts = api;
  }
})();
