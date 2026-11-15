(function () {
  var KEY = "pos.data";

  function seedData() {
    return {
      products: [
        { id: "p1", name: "Espresso", category: "Kopi", price: 18000, stock: 40 },
        { id: "p2", name: "Latte", category: "Kopi", price: 28000, stock: 30 },
        { id: "p3", name: "Kopi Susu", category: "Kopi", price: 22000, stock: 30 },
        { id: "p4", name: "Matcha", category: "Non-kopi", price: 25000, stock: 20 },
        { id: "p5", name: "Croissant", category: "Makanan", price: 20000, stock: 15 },
        { id: "p6", name: "Roti Coklat", category: "Makanan", price: 15000, stock: 15 },
      ],
      users: [
        { id: "u1", username: "admin", password: "admin", name: "Superadmin", role: "superadmin" },
        { id: "u2", username: "spv", password: "spv", name: "Supervisor", role: "supervisor" },
        { id: "u3", username: "kasir", password: "kasir", name: "Kasir", role: "cashier" },
      ],
      orders: [],
    };
  }

  function loadData(storage) {
    var raw = null;
    try {
      raw = storage.getItem(KEY);
    } catch (e) {
      raw = null;
    }
    if (!raw) return seedData();
    try {
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.products) || !Array.isArray(parsed.users) || !Array.isArray(parsed.orders)) {
        return seedData();
      }
      return parsed;
    } catch (e) {
      return seedData();
    }
  }

  function saveData(storage, data) {
    try {
      storage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage penuh atau diblokir: diabaikan, data tetap di memori halaman
    }
  }

  var api = { loadData: loadData, saveData: saveData, seedData: seedData };

  if (typeof module !== "undefined") module.exports = api;
  if (typeof window !== "undefined") {
    window.POS = window.POS || {};
    window.POS.storage = api;
  }
})();
