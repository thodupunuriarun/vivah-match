(function () {
  // Result celebration only: a light "pasupu" (turmeric) confetti shower for good scores.
  // The old floating twemoji motifs, falling petals and result-view diya row were removed
  // with the background redesign (plain cream + muggu watermark in style.css).
  var TELUGU_GOLD = ["#f59e0b", "#fbbf24", "#FF9933", "#8E1330", "#d97706"];

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
})();
