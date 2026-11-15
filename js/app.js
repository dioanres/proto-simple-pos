(function () {
  var SCREENS = ["kasir", "dashboard", "produk", "akun", "report"];
  // Modul yang punya init() untuk setiap screen.
  var MODULE_FOR = {
    kasir: "kasir",
    dashboard: "dashboard",
    produk: "products",
    akun: "accounts",
    report: "report",
  };

  var state = { user: null, screen: null };

  function $(id) { return document.getElementById(id); }

  function store() {
    try {
      var s = window.localStorage;
      s.getItem("pos.probe");
      return s;
    } catch (e) {
      return { getItem: function () { return null; }, setItem: function () {} };
    }
  }

  function sessionStore() {
    try {
      var s = window.sessionStorage;
      s.getItem("pos.probe");
      return s;
    } catch (e) {
      return { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} };
    }
  }

  function firstAllowed(role) {
    for (var i = 0; i < SCREENS.length; i++) {
      if (window.POS.auth.canAccess(role, SCREENS[i])) return SCREENS[i];
    }
    return null;
  }

  function showScreen(name) {
    if (!state.user) return;
    if (!window.POS.auth.canAccess(state.user.role, name)) {
      name = firstAllowed(state.user.role);
      if (!name) return;
    }
    state.screen = name;
    SCREENS.forEach(function (s) {
      var el = $("screen-" + s);
      if (el) el.hidden = s !== name;
    });
    document.querySelectorAll("#nav button[data-screen]").forEach(function (b) {
      var s = b.getAttribute("data-screen");
      b.hidden = !window.POS.auth.canAccess(state.user.role, s);
      b.classList.toggle("active", s === name);
    });
    var mod = window.POS[MODULE_FOR[name]];
    if (mod && typeof mod.init === "function") mod.init();
  }

  function showLogin() {
    state.user = null;
    state.screen = null;
    $("app").hidden = true;
    $("login").hidden = false;
    $("login-password").value = "";
    $("login-error").textContent = "";
    $("login-username").focus();
  }

  function enter(user) {
    state.user = user;
    $("login").hidden = true;
    $("app").hidden = false;
    $("user-label").textContent = user.name + " · " + user.role;
    showScreen(firstAllowed(user.role));
  }

  function handleLogin(e) {
    e.preventDefault();
    var username = $("login-username").value.trim();
    var password = $("login-password").value;
    var data = window.POS.storage.loadData(store());
    var user = window.POS.auth.login(data.users, username, password);
    if (!user) {
      $("login-error").textContent = "Username atau password salah";
      return;
    }
    window.POS.auth.saveSession(sessionStore(), user);
    enter(user);
  }

  function handleLogout() {
    window.POS.auth.clearSession(sessionStore());
    showLogin();
  }

  function restoreSession() {
    var saved = window.POS.auth.loadSession(sessionStore());
    if (!saved) return false;
    var data = window.POS.storage.loadData(store());
    var user = data.users.filter(function (u) { return u.id === saved.id; })[0];
    if (!user) return false;
    enter(user);
    return true;
  }

  function init() {
    document.querySelectorAll("#nav button[data-screen]").forEach(function (b) {
      b.addEventListener("click", function () { showScreen(b.getAttribute("data-screen")); });
    });
    $("login-form").addEventListener("submit", handleLogin);
    $("logout-btn").addEventListener("click", handleLogout);
    if (!restoreSession()) showLogin();
  }

  var app = { showScreen: showScreen, SCREENS: SCREENS, init: init };

  if (typeof module !== "undefined") module.exports = app;
  if (typeof window !== "undefined") {
    window.POS = window.POS || {};
    window.POS.app = app;
    document.addEventListener("DOMContentLoaded", init);
  }
})();
