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

  // Scroll reveal for content pages (CSS in style.css). Only cards that start below the fold are
  // hidden, and only after this sets .rv-on on <html> — no JS / no observer means nothing is hidden.
  // Leaf cards only (a section holding cards stays put, its cards fade), never inside the index views.
  var SEL = "main > section, main article, .tl-step, .nd-disclaimer, .match-card";
  var io = "IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches &&
    new IntersectionObserver(function (es) {
      var n = 0;
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.animationDelay = Math.min(n++ * 60, 240) + "ms";
        e.target.classList.add("rv-in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -6% 0px" });

  // all: also cards already on screen (freshly rendered lists, e.g. best-matches results).
  window.revealIn = function (root, all) {
    if (!io) return;
    document.documentElement.classList.add("rv-on");
    var vh = innerHeight;
    Array.prototype.forEach.call(root.querySelectorAll(SEL), function (el) {
      if (el.closest(".view") || el.querySelector(SEL)) return;
      if (!all && el.getBoundingClientRect().top < vh) return;
      el.classList.add("rv");
      io.observe(el);
    });
  };
  window.revealIn(document);
  addEventListener("beforeprint", function () {
    document.documentElement.classList.remove("rv-on");
  });
})();
