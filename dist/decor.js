(function () {
  var ASSET = "vendor/twemoji/";
  var STORY = "vendor/storyset/";

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function img(name, cls, base) {
    var el = document.createElement("img");
    el.src = (base || ASSET) + name;
    el.alt = "";
    el.draggable = false;
    if (cls) el.className = cls;
    return el;
  }

  function initPetals() {
    var layer = document.createElement("div");
    layer.className = "petal-layer";
    var flowers = ["marigold.svg", "hibiscus.svg", "marigold.svg"];
    for (var i = 0; i < 10; i++) {
      var f = document.createElement("img");
      f.src = ASSET + flowers[i % flowers.length];
      f.className = "falling-flower";
      f.alt = "";
      f.draggable = false;
      f.style.left = rand(0, 100).toFixed(1) + "vw";
      f.style.animationDuration = rand(11, 20).toFixed(2) + "s";
      f.style.animationDelay = "-" + rand(0, 20).toFixed(2) + "s";
      var s = rand(14, 24).toFixed(0);
      f.style.width = s + "px";
      f.style.height = s + "px";
      layer.appendChild(f);
    }
    document.body.appendChild(layer);
  }

  function makeDiyaRow(n) {
    var row = document.createElement("div");
    row.className = "diya-row";
    for (var i = 0; i < n; i++) {
      var d = document.createElement("span");
      d.className = "diya-emoji";
      d.appendChild(img("diya.svg"));
      row.appendChild(d);
    }
    return row;
  }

  function buildMotifs() {
    var spots = [
      { cls: "float-motif fm-1", file: "om.svg" },
      { cls: "float-motif fm-2", file: "marigold.svg" },
      { cls: "float-motif fm-3", file: "diya.svg" },
      { cls: "float-motif fm-4", file: "hibiscus.svg" },
    ];
    spots.forEach(function (s) {
      var m = document.createElement("div");
      m.className = s.cls;
      m.appendChild(img(s.file));
      document.body.appendChild(m);
    });
  }

  function insertDiyas() {
    var inputView = document.getElementById("view-input");
    if (inputView) inputView.insertBefore(makeDiyaRow(3), inputView.firstChild);
    var resultView = document.getElementById("view-result");
    if (resultView) {
      var backBtn = resultView.querySelector(".back-btn");
      if (backBtn) resultView.insertBefore(makeDiyaRow(3), backBtn.nextSibling);
      else resultView.insertBefore(makeDiyaRow(3), resultView.firstChild);
    }
  }

  function insertCouple() {
    var inputView = document.getElementById("view-input");
    if (!inputView) return;
    var header = inputView.querySelector("header");
    if (!header) return;

    var art = document.createElement("div");
    art.className = "couple-art";
    art.appendChild(img("wedding-pana.svg", "hero-couple", STORY));

    var badge = header.querySelector(".badge");
    if (badge && badge.parentNode === header) header.insertBefore(art, badge);
    else header.insertBefore(art, header.firstChild);
  }

  var TELUGU_GOLD = ["#f59e0b", "#fbbf24", "#FF9933", "#e11d48", "#d97706"];

  function pasupuShower(intensity) {
    if (typeof confetti !== "function") return;
    var base = {
      spread: 110,
      startVelocity: 34,
      origin: { y: 0 },
      gravity: 0.65,
      scalar: 0.85,
      ticks: 240,
      colors: TELUGU_GOLD,
      shapes: ["circle", "square"],
    };
    confetti(Object.assign({}, base, { particleCount: Math.round(intensity * 0.5), angle: 55, origin: { x: 0 } }));
    confetti(Object.assign({}, base, { particleCount: Math.round(intensity * 0.5), angle: 125, origin: { x: 1 } }));
    confetti(Object.assign({}, base, { particleCount: intensity, spread: 150, startVelocity: 24, origin: { x: 0.5 } }));
  }

  window.celebrate = function (big) {
    try {
      pasupuShower(big ? 200 : 110);
    } catch (e) {}
  };

  function init() {
    try { insertDiyas(); } catch (e) {}
    try { buildMotifs(); } catch (e) {}
    try { insertCouple(); } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
