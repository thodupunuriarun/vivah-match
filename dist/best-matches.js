const comboSelect = document.getElementById("person-combo");
const findButton = document.getElementById("find-matches");
const statusText = document.getElementById("finder-status");
const results = document.getElementById("results");
const tierResults = document.getElementById("tier-results");
const comboLabel = document.getElementById("combo-label");
const finderHelp = document.getElementById("finder-help");

const fmt = (n) => String(n); // totals are TTD integers
// short koota names for the TTD exception chip ("గణ దోషానికి TTD మినహాయింపు")
const SHORT = { varna: "వర్ణ", vashya: "వశ్య", tara: "తారా", yoni: "యోని", graha_maitri: "గ్రహమైత్రి", gana: "గణ", bhakoot: "భకూట", nadi: "నాడి" };

// same pada wording as the results page (app.js padaText)
function padaText(p) {
  const a = p.split(",");
  return a.length === 1 ? `${a[0]}వ పాదం` : `${a.join(", ")} పాదాలు`;
}

const combinations = [];
for (let id = 1; id <= 36; id++) {
  const c = Koota.combo(id);
  const full = c.padas === "1,2,3,4";
  combinations.push({ id, rasi: c.rasi, star: c.nakshatra + (full ? "" : ` · ${padaText(c.padas)}`) });
}

function selectedSide() {
  return document.querySelector('input[name="side"]:checked').value;
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
}

function updateSideCopy() {
  const isBoy = selectedSide() === "boy";
  comboLabel.textContent = isBoy ? "వరుడి రాశి - నక్షత్రము" : "వధువు రాశి - నక్షత్రము";
  finderHelp.textContent = isBoy
    ? "మీ వివరాలు ఎంచుకుంటే సరిపోయే వధువు రాశి-నక్షత్ర జోడీలు కనిపిస్తాయి."
    : "మీ వివరాలు ఎంచుకుంటే సరిపోయే వరుడి రాశి-నక్షత్ర జోడీలు కనిపిస్తాయి.";
  results.classList.add("hidden");
}

function buildRankings(side, selectedId) {
  const ranked = combinations.map((candidate) => {
    const girlId = side === "boy" ? candidate.id : selectedId;
    const boyId = side === "boy" ? selectedId : candidate.id;
    const m = Koota.match(girlId, boyId);
    const restored = m.parihara.map((p) => SHORT[p.key]);
    return { ...candidate, total: m.total, nadiDosha: m.nadiDosha, restored, girlId, boyId };
  }).filter((item) => item.total >= 18);

  ranked.sort((a, b) => b.total - a.total || a.id - b.id);

  let previousScore = null;
  let rank = 0;
  ranked.forEach((item, index) => {
    if (item.total !== previousScore) rank = index + 1;
    item.rank = rank;
    previousScore = item.total;
  });
  return ranked;
}

function matchCountLabel(count) {
  return `${count} ${count === 1 ? "జోడీ" : "జోడీలు"}`;
}

function createMatchCard(item) {
  const card = document.createElement("a");
  card.className = "match-card";
  card.href = `/results?g=${item.girlId}&b=${item.boyId}`;
  card.setAttribute("aria-label", `${item.rasi} ${item.star}, ${fmt(item.total)} పాయింట్లు, పూర్తి పొంతన చూడండి`);

  const rank = document.createElement("span");
  rank.className = "match-rank";
  const rankWrap = document.createElement("span");
  rankWrap.textContent = "#";
  const rankStrong = document.createElement("strong");
  rankStrong.textContent = String(item.rank);
  rankWrap.append(rankStrong);
  rank.append(rankWrap);

  const name = document.createElement("span");
  name.className = "match-name";
  const rasi = document.createElement("strong");
  rasi.textContent = item.rasi;
  const star = document.createElement("span");
  star.textContent = item.star;
  name.append(rasi, star);
  // turmeric "నాడి 0/8" when nadi is 0; neutral chip naming the dosha(s) with a TTD p66 exception
  if (item.nadiDosha || item.restored.length) {
    const chips = document.createElement("span");
    chips.className = "match-chips";
    if (item.nadiDosha) {
      const chip = document.createElement("span");
      chip.className = "nadi-chip";
      chip.textContent = "నాడి 0/8";
      chips.append(chip);
    }
    if (item.restored.length) {
      const chip = document.createElement("span");
      chip.className = "nadi-chip leaf";
      chip.textContent = `${item.restored.join(", ")} దోషానికి TTD మినహాయింపు`;
      chips.append(chip);
    }
    name.append(chips);
  }

  const score = document.createElement("span");
  score.className = "match-score";
  const scoreStrong = document.createElement("strong");
  scoreStrong.textContent = `${fmt(item.total)}/36`;
  const more = document.createElement("span");
  more.className = "match-more";
  more.textContent = "పూర్తి వివరాలు →";
  score.append(scoreStrong, more);
  card.append(rank, name, score);
  return card;
}

// Small echo of the results-page score seal: zari scalloped rim + tier-coloured disc (colour via CSS --tier-color).
function miniSeal() {
  const NS = "http://www.w3.org/2000/svg";
  const node = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const svg = node("svg", { class: "tier-seal", viewBox: "0 0 32 32", width: "32", height: "32", "aria-hidden": "true", focusable: "false" });
  const rim = node("g", { fill: "#D9B25F" });
  for (let k = 0; k < 16; k++) { const t = k * Math.PI / 8; rim.append(node("circle", { cx: (16 + 13.6 * Math.cos(t)).toFixed(2), cy: (16 + 13.6 * Math.sin(t)).toFixed(2), r: "2.2" })); }
  rim.append(node("circle", { cx: "16", cy: "16", r: "13.6" }));
  svg.append(rim, node("circle", { class: "tier-seal-disc", cx: "16", cy: "16", r: "11.8" }), node("circle", { cx: "16", cy: "16", r: "9.6", fill: "none", stroke: "#E7C170", "stroke-width": ".8" }));
  return svg;
}

function renderRankings(ranked, side, selectedId) {
  tierResults.replaceChildren();
  const selected = combinations.find((combo) => combo.id === selectedId);
  document.getElementById("results-title").textContent = side === "boy" ? "వరుడికి అనుకూలమైన వధువు జోడీలు" : "వధువుకు అనుకూలమైన వరుడు జోడీలు";
  document.getElementById("results-subtitle").textContent = `${selected.rasi} · ${selected.star} — మొత్తం ${matchCountLabel(ranked.length)}`;

  if (!ranked.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "18 లేదా అంతకంటే ఎక్కువ స్కోరు ఉన్న జోడీలు కనబడలేదు. మరో రాశి-నక్షత్రం ఎంచుకుని ప్రయత్నించండి.";
    tierResults.append(empty);
  } else {
    Koota.TIERS.forEach((tier, i) => {
      const items = ranked.filter((item) => Koota.tier(item.total).key === tier.key);
      if (!items.length) return;

      const section = document.createElement("section");
      section.className = "match-tier";
      section.style.setProperty("--tier-color", tier.color);
      section.setAttribute("aria-labelledby", `tier-${tier.key}`);

      const head = document.createElement("div");
      head.className = "tier-head";
      const tierCopy = document.createElement("div");
      tierCopy.className = "tier-copy";
      const tierTitle = document.createElement("h2");
      tierTitle.id = `tier-${tier.key}`;
      tierTitle.textContent = tier.label;
      const tierRange = document.createElement("p");
      tierRange.textContent = `${tier.min}–${i ? Koota.TIERS[i - 1].min - 1 : 36} గుణాలు`;
      tierCopy.append(tierTitle, tierRange);
      const tierCountEl = document.createElement("span");
      tierCountEl.className = "tier-count";
      tierCountEl.textContent = matchCountLabel(items.length);
      head.append(miniSeal(), tierCopy, tierCountEl);

      const list = document.createElement("div");
      list.className = "match-list";
      items.forEach((item) => list.append(createMatchCard(item)));
      section.append(head, list);
      tierResults.append(section);
    });
  }

  results.classList.remove("hidden");
  if (window.revealIn) window.revealIn(tierResults, true);
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

function findMatches() {
  const selectedId = Number(comboSelect.value);
  if (!selectedId) {
    setStatus("దయచేసి మీ రాశి-నక్షత్రం ఎంచుకోండి.", true);
    comboSelect.focus();
    return;
  }
  setStatus("");
  const side = selectedSide();
  renderRankings(buildRankings(side, selectedId), side, selectedId);
}

function applyQueryParams() {
  const params = new URLSearchParams(location.search);
  const side = params.get("side");
  const id = Number(params.get("id"));
  if (side === "girl" || side === "boy") {
    document.getElementById(side === "boy" ? "side-boy" : "side-girl").checked = true;
    updateSideCopy();
  }
  if (id >= 1 && id <= 36) {
    comboSelect.value = String(id);
    return true;
  }
  return false;
}

function initialize() {
  comboSelect.replaceChildren(new Option("— రాశి-నక్షత్రం ఎంచుకోండి —", ""));
  combinations.forEach((combo) => {
    comboSelect.add(new Option(`${combo.rasi} - ${combo.star}`, combo.id));
  });
  comboSelect.disabled = false;
  findButton.disabled = false;
  setStatus("రాశి-నక్షత్రం ఎంచుకుని జోడీలు చూడండి.");
  if (applyQueryParams()) findMatches();
}

document.querySelectorAll('input[name="side"]').forEach((input) => input.addEventListener("change", updateSideCopy));
findButton.addEventListener("click", findMatches);

document.getElementById("change-selection").addEventListener("click", () => {
  document.querySelector(".match-finder").scrollIntoView({ behavior: "smooth", block: "center" });
  comboSelect.focus({ preventScroll: true });
});

initialize();
