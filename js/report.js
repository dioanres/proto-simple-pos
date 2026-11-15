(function () {
  var HEADER = ["id", "tanggal", "meja", "metode", "total", "dibayar", "kembali", "status", "item"];

  function esc(v) {
    var s = v === null || v === undefined ? "" : String(v);
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function toCsv(orders) {
    var lines = [HEADER.join(",")];
    orders.forEach(function (o) {
      var items = o.items.map(function (it) { return it.name + " x" + it.qty; }).join("; ");
      var row = [o.id, o.createdAt, o.table, o.payMethod, o.total, o.paid, o.change, o.status, items];
      lines.push(row.map(esc).join(","));
    });
    return lines.join("\n");
  }

  function downloadCsv(filename, text) {
    var blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  // ===== UI layar Report =====
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

  function todayStr() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function filtered() {
    var from = $("rep-from").value;
    var to = $("rep-to").value;
    return st.data.orders.filter(function (o) {
      var day = new Date(o.createdAt);
      var key = day.getFullYear() + "-" + String(day.getMonth() + 1).padStart(2, "0") + "-" + String(day.getDate()).padStart(2, "0");
      return (!from || key >= from) && (!to || key <= to);
    });
  }

  function render() {
    var rows = filtered();
    $("rep-count").textContent = rows.length + " transaksi pada rentang ini";
  }

  function download() {
    var rows = filtered();
    var from = $("rep-from").value || "awal";
    var to = $("rep-to").value || todayStr();
    downloadCsv("laporan-" + from + "_" + to + ".csv", toCsv(rows));
  }

  function init() {
    if (!st.inited) {
      st.inited = true;
      $("rep-from").addEventListener("change", render);
      $("rep-to").addEventListener("change", render);
      $("rep-download").addEventListener("click", download);
    }
    st.data = window.POS.storage.loadData(store());
    if (!$("rep-to").value) $("rep-to").value = todayStr();
    render();
  }

  var api = { init: init, toCsv: toCsv, downloadCsv: downloadCsv };

  if (typeof module !== "undefined") module.exports = api;
  if (typeof window !== "undefined") {
    window.POS = window.POS || {};
    window.POS.report = api;
  }
})();
