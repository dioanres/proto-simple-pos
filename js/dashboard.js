(function () {
  function summarize(orders, fromDate, toDate) {
    var from = new Date(fromDate).getTime();
    var to = new Date(toDate).getTime();
    var byPayMethod = { cash: 0, transfer: 0, qris: 0 };
    var revenue = 0;
    var count = 0;
    var qtyByName = {};

    orders.forEach(function (o) {
      if (o.status !== "paid") return;
      var t = new Date(o.createdAt).getTime();
      if (!(t >= from && t <= to)) return;
      count++;
      revenue += o.total;
      if (byPayMethod.hasOwnProperty(o.payMethod)) {
        byPayMethod[o.payMethod] += o.total;
      }
      o.items.forEach(function (it) {
        qtyByName[it.name] = (qtyByName[it.name] || 0) + it.qty;
      });
    });

    var topItems = Object.keys(qtyByName).map(function (name) {
      return { name: name, qty: qtyByName[name] };
    });
    topItems.sort(function (a, b) { return b.qty - a.qty; });

    return {
      revenue: revenue,
      count: count,
      byPayMethod: byPayMethod,
      topItems: topItems.slice(0, 5),
    };
  }

  // ===== UI layar Dashboard =====
  var st = { data: null, inited: false };
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

  function rangeFor(value) {
    var now = new Date();
    var from = new Date(now);
    if (value === "today") {
      from.setHours(0, 0, 0, 0);
    } else {
      var days = value === "30" ? 30 : 7;
      from.setDate(from.getDate() - (days - 1));
      from.setHours(0, 0, 0, 0);
    }
    return { from: from.toISOString(), to: now.toISOString() };
  }

  function card(label, value) {
    var c = document.createElement("div");
    c.className = "card stat";
    var l = document.createElement("span");
    l.className = "muted";
    l.textContent = label;
    var v = document.createElement("strong");
    v.textContent = value;
    c.appendChild(l);
    c.appendChild(v);
    return c;
  }

  function render() {
    var r = rangeFor($("dash-range").value);
    var s = summarize(st.data.orders, r.from, r.to);
    var fmt = window.POS.sales.formatRupiah;

    var cards = $("dash-cards");
    cards.innerHTML = "";
    cards.appendChild(card("Omzet", fmt(s.revenue)));
    cards.appendChild(card("Transaksi", String(s.count)));

    var bars = $("dash-bars");
    bars.innerHTML = "";
    var max = Math.max(s.byPayMethod.cash, s.byPayMethod.transfer, s.byPayMethod.qris, 1);
    [["cash", "Cash"], ["transfer", "Transfer"], ["qris", "QRIS"]].forEach(function (pair) {
      var val = s.byPayMethod[pair[0]];
      var row = document.createElement("div");
      row.className = "bar-row";
      var label = document.createElement("span");
      label.textContent = pair[1];
      var track = document.createElement("div");
      track.className = "bar-track";
      var fill = document.createElement("div");
      fill.className = "bar-fill";
      fill.style.width = Math.round((val / max) * 100) + "%";
      track.appendChild(fill);
      var amount = document.createElement("span");
      amount.className = "muted";
      amount.textContent = fmt(val);
      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(amount);
      bars.appendChild(row);
    });

    var top = $("dash-top");
    top.innerHTML = "";
    if (!s.topItems.length) {
      var none = document.createElement("li");
      none.className = "muted";
      none.textContent = "Belum ada penjualan";
      top.appendChild(none);
    }
    s.topItems.forEach(function (it) {
      var li = document.createElement("li");
      li.textContent = it.name + " · " + it.qty + " porsi";
      top.appendChild(li);
    });
  }

  function init() {
    if (!st.inited) {
      st.inited = true;
      $("dash-range").addEventListener("change", render);
    }
    st.data = window.POS.storage.loadData(store());
    render();
  }

  var api = { init: init, summarize: summarize };

  if (typeof module !== "undefined") module.exports = api;
  if (typeof window !== "undefined") {
    window.POS = window.POS || {};
    window.POS.dashboard = api;
  }
})();
