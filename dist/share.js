// "Share this site" card in every footer. The WhatsApp button is a plain wa.me link (works without JS).
// This shows the second button: the phone's share sheet when there is one, otherwise "copy link".
(function () {
  var btn = document.getElementById("share-site-more");
  if (!btn) return;
  var URL_ = "https://matchmyjathakam.com/";
  // same message as the wa.me link in the footer card (kept in sync by hand)
  var TEXT = "నమస్కారం 🙏\nతిరుమల తిరుపతి దేవస్థానం (TTD) పంచాంగం ప్రకారం వివాహ పొంతన — ఇప్పుడు ఆన్‌లైన్‌లో, పూర్తిగా ఉచితంగా.\n\n✅ వధూవరుల నక్షత్రం తెలిస్తే చాలు — తెలియకపోతే పుట్టిన తేదీ, సమయం, ఊరు ఇవ్వండి\n✅ 36 గుణాలు, 8 కూటముల పొంతన తెలుగులో, ప్రతి కూటమికి వివరణతో\n✅ నాడి, రాశి, గణ దోషాలు ఉన్నాయో లేదో TTD పంచాంగం ప్రకారం\n✅ ఫలితాన్ని వాట్సాప్‌లో పంపుకోవచ్చు\n✅ లాగిన్ అవసరం లేదు, మీ వివరాలు ఎక్కడా సేవ్ చేయబడవు";
  var label = btn.querySelector("span");
  var canShare = !!navigator.share;
  if (!canShare && !(navigator.clipboard && navigator.clipboard.writeText)) return;

  label.textContent = canShare ? "ఇతర యాప్‌లు" : "లింక్ కాపీ చేయండి";
  btn.hidden = false;
  btn.addEventListener("click", function () {
    if (canShare) {
      navigator.share({ title: "Match My Jathakam", text: TEXT, url: URL_ }).catch(function () {});
      return;
    }
    navigator.clipboard.writeText(URL_).then(function () {
      label.textContent = "కాపీ అయింది ✓";
      setTimeout(function () { label.textContent = "లింక్ కాపీ చేయండి"; }, 2500);
    }, function () {});
  });
})();
