(function () {
  var SESSION_KEY = "pos.session";

  var ACCESS = {
    superadmin: ["kasir", "dashboard", "produk", "akun", "report"],
    supervisor: ["dashboard", "produk", "report"],
    cashier: ["kasir"],
  };

  function login(users, username, password) {
    for (var i = 0; i < users.length; i++) {
      var u = users[i];
      if (u.username === username && u.password === password) return u;
    }
    return null;
  }

  function canAccess(role, screen) {
    var list = ACCESS[role] || [];
    return list.indexOf(screen) >= 0;
  }

  // Sesi hanya disimpan di sessionStorage: hilang saat tab ditutup.
  function saveSession(storage, user) {
    try {
      storage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, role: user.role, name: user.name }));
    } catch (e) { /* diabaikan */ }
  }

  function loadSession(storage) {
    try {
      var raw = storage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearSession(storage) {
    try { storage.removeItem(SESSION_KEY); } catch (e) { /* diabaikan */ }
  }

  var api = {
    login: login,
    canAccess: canAccess,
    saveSession: saveSession,
    loadSession: loadSession,
    clearSession: clearSession,
  };

  if (typeof module !== "undefined") module.exports = api;
  if (typeof window !== "undefined") {
    window.POS = window.POS || {};
    window.POS.auth = api;
  }
})();
