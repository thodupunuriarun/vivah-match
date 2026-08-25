const comboSelect = document.getElementById("person-combo");
const findButton = document.getElementById("find-matches");
const statusText = document.getElementById("finder-status");
const results = document.getElementById("results");
const tierResults = document.getElementById("tier-results");
const comboLabel = document.getElementById("combo-label");
const finderHelp = document.getElementById("finder-help");

const TIERS = [
  { key: "best", min: 33, title: "అత్యుత్తమ జోడీలు", english: "BEST MATCHES", icon: "✦" },
  { key: "very-good", min: 24, title: "చాలా మంచి జోడీలు", english: "VERY GOOD MATCHES", icon: "◆" },
  { key: "compatible", min: 18, title: "అనుకూల జోడీలు", english: "COMPATIBLE MATCHES", icon: "✓" },
];

let db;
let combinations = [];

function selectedSide() {
  return document.querySelector('input[name="side"]:checked').value;
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("error", isError);
}

function cleanText(value) {
  return String(value).replace(/\u200d/g, "");
}

function queryMatch(nid) {
  const statement = db.prepare("SELECT mark FROM matching_point WHERE nid = ?");
  statement.bind([nid]);
  const row = statement.step() ? statement.getAsObject() : null;
  statement.free();
  return row;
}

function parseScores(mark) {
  const parts = mark.split(",");
  return {
    total: Number(parts[parts.length - 1].split("/")[0]),
    nadi: Number(parts[7].split("/")[0]),
  };
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
    const match = queryMatch(`${girlId}.${boyId}`);
    if (!match) return null;
    const scores = parseScores(match.mark);
    return { ...candidate, ...scores, girlId, boyId };
  }).filter((item) => item && item.total >= 18);

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

function tierFor(total) {
  return TIERS.find((tier) => total >= tier.min);
}

function matchCountLabel(count) {
  return `${count} ${count === 1 ? "జోడీ" : "జోడీలు"}`;
}

function createMatchCard(item) {
  const card = document.createElement("a");
  card.className = "match-card";
  card.href = `/?g=${item.girlId}&b=${item.boyId}`;
  card.setAttribute("aria-label", `${cleanText(item.rasi)} ${cleanText(item.star)}, ${item.total} పాయింట్లు, పూర్తి పొంతన చూడండి`);

  const rank = document.createElement("span");
  rank.className = "match-rank";
  rank.innerHTML = `<span>#<strong>${item.rank}</strong></span>`;

  const name = document.createElement("span");
  name.className = "match-name";
  const rasi = document.createElement("strong");
  rasi.textContent = cleanText(item.rasi);
  const star = document.createElement("span");
  star.textContent = cleanText(item.star);
  name.append(rasi, star);
  if (item.nadi === 0) {
    const warning = document.createElement("span");
    warning.className = "nadi-chip";
    warning.textContent = "నాడి దోషం";
    name.append(warning);
  }

  const score = document.createElement("span");
  score.className = "match-score";
  score.innerHTML = `<strong>${item.total}/36</strong>పూర్తి వివరాలు →`;
  card.append(rank, name, score);
  return card;
}

function renderRankings(ranked, side, selectedId) {
  tierResults.replaceChildren();
  const selected = combinations.find((combo) => combo.id === selectedId);
  document.getElementById("results-title").textContent = side === "boy" ? "వరుడికి అనుకూలమైన వధువు జోడీలు" : "వధువుకు అనుకూలమైన వరుడు జోడీలు";
  document.getElementById("results-subtitle").textContent = `${cleanText(selected.rasi)} · ${cleanText(selected.star)} — మొత్తం ${matchCountLabel(ranked.length)}`;

  if (!ranked.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "18 లేదా అంతకంటే ఎక్కువ స్కోరు ఉన్న జోడీలు కనబడలేదు. మరో రాశి-నక్షత్రం ఎంచుకుని ప్రయత్నించండి.";
    tierResults.append(empty);
  } else {
    TIERS.forEach((tier) => {
      const items = ranked.filter((item) => tierFor(item.total).key === tier.key);
      if (!items.length) return;

      const section = document.createElement("section");
      section.className = `match-tier ${tier.key}`;
      section.setAttribute("aria-labelledby", `tier-${tier.key}`);

      const head = document.createElement("div");
      head.className = "tier-head";
      head.innerHTML = `<span class="tier-icon" aria-hidden="true">${tier.icon}</span><div class="tier-copy"><h2 id="tier-${tier.key}">${tier.title}</h2><p>${tier.english}</p></div><span class="tier-count">${matchCountLabel(items.length)}</span>`;

      const list = document.createElement("div");
      list.className = "match-list";
      items.forEach((item) => list.append(createMatchCard(item)));
      section.append(head, list);
      tierResults.append(section);
    });
  }

  results.classList.remove("hidden");
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function initialize() {
  const SQL = await initSqlJs({ locateFile: (file) => `vendor/${file}` });
  const response = await fetch("data/telungu_thirumanam.db");
  if (!response.ok) throw new Error("Database download failed");
  db = new SQL.Database(new Uint8Array(await response.arrayBuffer()));

  const result = db.exec("SELECT id, rasi, star FROM rasi_star ORDER BY id");
  combinations = result[0].values.map(([id, rasi, star]) => ({ id, rasi, star }));
  comboSelect.replaceChildren(new Option("— రాశి-నక్షత్రం ఎంచుకోండి —", ""));
  combinations.forEach((combo) => {
    comboSelect.add(new Option(`${cleanText(combo.rasi)} - ${cleanText(combo.star)}`, combo.id));
  });
  comboSelect.disabled = false;
  findButton.disabled = false;
  setStatus("రాశి-నక్షత్రం ఎంచుకుని జోడీలు చూడండి.");
}

document.querySelectorAll('input[name="side"]').forEach((input) => input.addEventListener("change", updateSideCopy));
findButton.addEventListener("click", () => {
  const selectedId = Number(comboSelect.value);
  if (!selectedId) {
    setStatus("దయచేసి మీ రాశి-నక్షత్రం ఎంచుకోండి.", true);
    comboSelect.focus();
    return;
  }
  setStatus("");
  const side = selectedSide();
  renderRankings(buildRankings(side, selectedId), side, selectedId);
});

document.getElementById("change-selection").addEventListener("click", () => {
  document.querySelector(".match-finder").scrollIntoView({ behavior: "smooth", block: "center" });
  comboSelect.focus({ preventScroll: true });
});

initialize().catch(() => {
  setStatus("డేటా లోడ్ కాలేదు. పేజీని రిఫ్రెష్ చేసి మళ్ళీ ప్రయత్నించండి.", true);
  comboSelect.replaceChildren(new Option("డేటా అందుబాటులో లేదు", ""));
});
