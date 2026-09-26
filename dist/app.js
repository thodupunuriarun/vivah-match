const $ = (id) => document.getElementById(id);
const K = window.Koota;

const MATCH_LABEL = "పొంతన చూడండి";
const BUSY_LABEL = "లెక్కిస్తోంది…";
const ROLE = { girl: "వధువు", boy: "వరుడు" };

// Per-koota copy. about = explain.js "about"; ask = what to raise with the family astrologer.
const INFO = {
  varna: { short: "వర్ణం", tag: "స్వభావ స్థాయి", about: "అహం/స్వభావ స్థాయి — బ్రాహ్మణ, క్షత్రియ, వైశ్య, శూద్ర వర్ణ పోలిక.", ask: "వర్ణ భేదానికి పూర్తి జాతకంలో ఎంత ప్రాధాన్యం ఉంది?" },
  vashya: { short: "వశ్యం", tag: "ఆకర్షణ, మాట వినే గుణం", about: "ఆకర్షణ/వశ్యత — ఒకరు మరొకరి మాట వినే గుణం.", ask: "ఇద్దరి జాతకాల్లో పరస్పర అనుకూలత ఇంకెక్కడైనా కనిపిస్తుందా?" },
  tara: { short: "తార", tag: "ఆరోగ్యం, ఆయుష్షు", about: "ఆరోగ్యం/ఆయుష్షు — జన్మ నక్షత్రాల తారా బలం.", ask: "తారా బలం కోసం ఏవైనా శాంతి సూచిస్తారా?" },
  yoni: { short: "యోని", tag: "దాంపత్య అనుకూలత", about: "దాంపత్య సుఖం/శారీరక అనుకూలత — జంతు యోని పోలిక.", ask: "యోని పోలికకు పూర్తి జాతకంలో సర్దుబాటు ఉందా?" },
  graha_maitri: { short: "గ్రహమైత్రి", tag: "మానసిక స్నేహం", about: "మానసిక స్నేహం — రాశ్యాధిపతుల మైత్రి.", ask: "నవాంశలో రాశ్యాధిపతుల మైత్రి ఎలా ఉంది?" },
  gana: { short: "గణం", tag: "స్వభావం", about: "స్వభావం — దేవ, మనుష్య, రాక్షస గణ పోలిక.", ask: "గణ భేదానికి ఇతర కూటముల బలం సరిపోతుందా?" },
  bhakoot: { short: "రాశి", tag: "కుటుంబ, సంతాన అనుకూలత", about: "కుటుంబ/సంతాన అనుకూలత — రాశుల తత్వ పోలిక (చర/స్థిర/ద్విస్వభావ).", ask: "రాశ్యాధిపతుల మైత్రితో ఈ రాశి దోషం సడలుతుందా?" },
  nadi: { short: "నాడి", tag: "సంతాన ఆరోగ్యం", about: "సంతాన ఆరోగ్యం — ఆది/మధ్య/అంత్య నాడి పోలిక.", ask: "ఈ జోడీకి నాడి పరిహారం వర్తిస్తుందా?" },
};
const SUBLINE = {
  best: "అన్ని విధాలా చక్కగా కలిసింది",
  vgood: "చాలా కూటములు చక్కగా కలిశాయి",
  good: "సాధారణంగా అనుకూలంగా చెబుతారు",
  fair: "సర్దుబాటుతో సాధ్యం",
  advice: "ఈ జోడీలో చాలా కూటములు అంతగా కలవలేదు — నిర్ణయానికి ముందు జ్యోతిష్యులతో వివరంగా చర్చించడం మంచిది.",
};
// Totals/scores can be x.5: one decimal only when fractional ("34.5", "28").
const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
// Plain explanation of each parihara for the "ఎందుకు?" box (no fear words).
const PARIHARA_WHY = {
  nadi: "ఇద్దరిదీ ఒకే నాడి అయినా, ఈ నక్షత్ర-రాశి పొందికలో సంప్రదాయం ఈ నియమాన్ని సడలిస్తుంది.",
  bhakoot: "రాశుల దూరానికి 0 వచ్చినా, రాశ్యధిపతులు ఒకరే లేదా మిత్రులైతే ఆ నియమం సడలుతుందని పెద్దలు చెబుతారు.",
  graha_maitri: "అధిపతుల మైత్రి తక్కువగా ఉన్నా, రాశికూటం అనుకూలంగా ఉన్నప్పుడు ఇది సడలుతుందని సంప్రదాయం చెబుతుంది.",
  gana: "గణాలు వేరైనా, రాశ్యధిపతులు లేదా నవాంశ అధిపతులు ఒకరే లేదా మిత్రులైతే, లేదా వధువు నక్షత్రం కొన్ని ప్రత్యేక నక్షత్రాలలో ఉంటే ఈ నియమం సడలుతుందని సంప్రదాయం చెబుతుంది.",
};
const C_FULL = "#047857", C_PART = "#b45309", C_ZERO = "#7A4A1E";
const scoreColor = (k) => (k.score === k.max ? C_FULL : k.score > 0 ? C_PART : C_ZERO);
const statusText = (k) => (k.score > 0 ? "కొంత కలిసింది" : "ఈ కూటమికి 0 వచ్చింది · జ్యోతిష్యులతో చర్చించండి");
// Parihara summary, only when it raises the total:
//   items = ["నాడి 0/8 — దోష పరిహారం: <reason>", ...], total = "ఈ పరిహారాలతో: 30/36",
//   short = "నాడి, గ్రహమైత్రి దోష పరిహారాలతో: 30/36" (one line for tight spots).
// Commonly suggested shanti for a 0-score dosha that has no parihara.
const SHANTI = { nadi: "మహా మృత్యుంజయ జపం", bhakoot: "నవగ్రహ శాంతి", gana: "గణ దోష శాంతి" };
const hasShanti = (k) => SHANTI[k.key] && k.score === 0 && !k.parihara;
const PH_NAME = { nadi: "నాడి", bhakoot: "రాశి", graha_maitri: "గ్రహమైత్రి", gana: "గణ" };
function pariharaInfo(d) {
  if (!(d.totalWithParihara > d.total)) return null;
  const ps = d.parihara.filter((p) => p.restored > 0);
  const many = ps.length > 1, tw = `${fmt(d.totalWithParihara)}/36`;
  const items = ps.map((p) => {
    const k = d.kootas.find((x) => x.key === p.key);
    return `${INFO[p.key].short} ${fmt(k.score)}/${k.max} — దోష పరిహారం: ${p.reason}`;
  });
  return { items, total: `ఈ ${many ? "పరిహారాలతో" : "పరిహారంతో"}: ${tw}`,
    short: `${ps.map((p) => PH_NAME[p.key]).join(", ")} దోష ${many ? "పరిహారాలతో" : "పరిహారంతో"}: ${tw}` };
}

const RASIS = [];
for (let i = 1; i <= 36; i++) { const r = K.combo(i).rasi; if (!RASIS.includes(r)) RASIS.push(r); }

const rasiText = (r) => r.replace(/ం$/, "") + " రాశి";
function padaText(p) {
  if (p === "1,2,3,4") return "అన్ని పాదాలు";
  const a = p.split(",");
  return a.length === 1 ? `${a[0]}వ పాదం` : `${a.join(", ")} పాదాలు`;
}
const comboLabel = (c) => `${c.rasi} — ${c.nakshatra}${c.padas === "1,2,3,4" ? "" : ` (${padaText(c.padas)})`}`;

// "This pair" sentence for each koota (plain Telugu, no fear words).
function reason(k) {
  const g = k.girl, b = k.boy, full = k.score === k.max, zero = k.score === 0;
  switch (k.key) {
    case "varna":
      return `వధువు ${g}, వరుడు ${b} వర్ణం. ` + (full ? "సంప్రదాయ నియమం ప్రకారం సరిపోయింది." : "వరుడి వర్ణం వధువుతో సమానం లేదా పై స్థాయిలో ఉండాలనేది నియమం; ఇక్కడ అలా లేదు.");
    case "vashya":
      return `వధువు ${g}, వరుడు ${b} వర్గం. ` + (full ? "ఒకే వర్గం — పరస్పర వశ్యత ఉంది." : zero ? "ఈ వర్గాల మధ్య వశ్యత తక్కువగా లెక్కిస్తారు." : "వేర్వేరు వర్గాలు అయినా కొంత అనుకూలత ఉంది.");
    case "tara":
      return `వధువు నక్షత్రం నుంచి వరుడిది ${g}, వరుడి నుంచి వధువుది ${b}. ` + (full ? "రెండు వైపులా శుభ తారలు." : zero ? "రెండు వైపులా శుభ తార రాలేదు." : "ఒక వైపు శుభ తార వచ్చింది.");
    case "yoni":
      return `వధువు ${g} యోని, వరుడు ${b} యోని. ` + (full ? "ఒకే యోని — పూర్తి అనుకూలత." : k.score >= 2 ? "స్నేహపూర్వక యోనులుగా చెబుతారు." : zero ? "సంప్రదాయంలో ఈ రెండు యోనులను విరోధంగా చెబుతారు." : "సాధారణ పోలిక.");
    case "graha_maitri": {
      const gl = g.replace(/\(.*\)/, ""), bl = b.replace(/\(.*\)/, "");
      return `రాశ్యాధిపతులు: వధువుకు ${gl}, వరుడికి ${bl}. ` + (full ? "అధిపతులు మిత్రులు లేదా ఒకరే — మంచి స్నేహం." : k.score >= 3 ? "స్నేహం లేదా సమ భావం — మంచి పోలిక." : zero ? "అధిపతులను పరస్పరం శత్రువులుగా చెబుతారు." : "కొంత దూరం ఉన్న సంబంధం.");
    }
    case "gana":
      return `వధువు ${g} గణం, వరుడు ${b} గణం. ` + (full ? "స్వభావాలు కలుస్తాయని చెబుతారు." : "సంప్రదాయంలో ఈ గణాల జోడీకి తక్కువ గుణాలు ఇస్తారు.");
    case "bhakoot": {
      const gi = RASIS.indexOf(g), bi = RASIS.indexOf(b);
      const d = gi < 0 || bi < 0 ? 0 : ((bi - gi + 12) % 12) + 1;
      const name = { 2: "ద్వి-ద్వాదశం", 12: "ద్వి-ద్వాదశం", 5: "నవ-పంచమం", 9: "నవ-పంచమం", 6: "షష్టాష్టకం", 8: "షష్టాష్టకం" }[d];
      const pos = d ? ` వధువు రాశి నుంచి వరుడి రాశి ${d}వ స్థానం.` : "";
      return `వధువు ${g}, వరుడు ${b}.${pos} ` + (full ? "ఈ దూరం శుభంగా చెబుతారు." : `దీన్ని ${name || "రాశి దోషం"} అంటారు. రాశ్యాధిపతులు మిత్రులైతే చాలామంది పెద్దలు ఇది సడలిస్తారు.`);
    }
    case "nadi":
      return `వధువు ${g} నాడి, వరుడు ${b} నాడి. ` + (full ? "వేర్వేరు నాడులు — పూర్తి గుణాలు." : "ఇద్దరిదీ ఒకే నాడి — దీన్నే నాడి దోషం అంటారు. కొన్ని సందర్భాల్లో పెద్దలు మినహాయింపు చెబుతారు.");
  }
  return "";
}

let lastData = null;
let lastBlob = null;

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

// ---------- form ----------
function setMatchBusy(on) {
  const btn = $("match-btn");
  const label = btn.querySelector(".cta-label");
  btn.disabled = !!on;
  if (on) btn.setAttribute("aria-busy", "true");
  else btn.removeAttribute("aria-busy");
  label.textContent = on ? BUSY_LABEL : MATCH_LABEL;
}

const personMode = (p) => (window.getPersonMode ? window.getPersonMode(p) : "known");
const personComboId = (p) => (window.getPersonComboId ? window.getPersonComboId(p) : $(`${p}-combo`).value);

function fillCombos() {
  ["girl", "boy"].forEach((p) => {
    const sel = $(`${p}-combo`);
    sel.length = 0;
    sel.add(new Option("— రాశి-నక్షత్రం ఎంచుకోండి —", ""));
    for (let i = 1; i <= 36; i++) sel.add(new Option(comboLabel(K.combo(i)), String(i)));
  });
}

function restoreCombos(q) {
  ["girl", "boy"].forEach((p) => { if (window.setPersonMode) window.setPersonMode(p, "known"); });
  $("girl-combo").value = String(q.g);
  $("boy-combo").value = String(q.b);
  $("girl-name").value = q.gn;
  $("boy-name").value = q.bn;
}

// ---------- URLs: ids in the query, names only in the #fragment (never sent to the server) ----------
function resultPath(g, b, gn, bn, gp, bp) {
  const h = new URLSearchParams();
  if (gn) h.set("gn", gn);
  if (bn) h.set("bn", bn);
  const hs = h.toString();
  return `/results?g=${g}&b=${b}${gp ? `&gp=${gp}` : ""}${bp ? `&bp=${bp}` : ""}${hs ? "#" + hs : ""}`;
}

function restoreFromUrl() {
  const q = new URLSearchParams(location.search);
  const p = location.pathname;
  if (!q.has("g") || !q.has("b") || (p !== "/results" && p !== "/" && p !== "/index.html")) return null;
  const g = +q.get("g"), b = +q.get("b");
  if (!(g >= 1 && g <= 36 && b >= 1 && b <= 36) || g % 1 || b % 1) return null;
  const h = new URLSearchParams(location.hash.slice(1));
  const clip = (s) => (s || "").trim().slice(0, 40);
  const gn = clip(h.get("gn") || q.get("gn")), bn = clip(h.get("bn") || q.get("bn"));
  // Exact pada (from the birth-details finder): 1..4 and one of the combo's padas, else ignored.
  const pada = (key, id) => { const v = q.get(key); return /^[1-4]$/.test(v || "") && K.combo(id).padas.split(",").includes(v) ? +v : undefined; };
  const gp = pada("gp", g), bp = pada("bp", b);
  // Old links carried names in the query: move them to the fragment.
  if (q.has("gn") || q.has("bn")) history.replaceState(null, "", resultPath(g, b, gn, bn, gp, bp));
  return { g, b, gn, bn, gp, bp };
}

function showView(id, push) {
  document.querySelectorAll(".view").forEach((v) => { v.classList.add("hidden"); v.classList.remove("active"); });
  const v = $(id);
  v.classList.remove("hidden");
  void v.offsetWidth;
  v.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (push === false) return;
  if (id === "view-result" && lastData) {
    history.pushState(null, "", resultPath(lastData.g, lastData.b, lastData.gn, lastData.bn, lastData.gp, lastData.bp));
  } else if (id === "view-input" && location.pathname === "/results") {
    history.pushState(null, "", "/");
  }
}

function getTime(prefix) {
  if (window.getTimeStr) return window.getTimeStr(prefix);
  const h = $(prefix + "-hour"), m = $(prefix + "-min"), a = $(prefix + "-ampm");
  return h && m && a && h.value && m.value ? `${h.value}:${m.value} ${a.value}` : "";
}

// Calm inline message under the match button (replaces alert()).
function setMatchMsg(t) {
  const m = $("match-msg");
  m.textContent = t || "";
  m.hidden = !t;
}

async function match(skipPush) {
  const btn = $("match-btn");
  if (btn.getAttribute("aria-busy") === "true") return;
  setMatchMsg("");
  setMatchBusy(true);
  try {
    const ROLE_TO = { girl: "వధువుకు", boy: "వరుడికి" };
    for (const prefix of ["girl", "boy"]) {
      const mode = personMode(prefix);
      const hasBirth = !!($(prefix + "-date").value && getTime(prefix));
      if (mode === "birth" && hasBirth && !personComboId(prefix) && window.calcForPerson) {
        await window.calcForPerson(prefix);
      }
      if (personComboId(prefix)) continue;
      if (mode === "birth" && hasBirth) {
        setMatchMsg(`${ROLE[prefix]} రాశి ఇంకా కనుగొనలేదు — 'రాశి-నక్షత్రం కనుగొనండి' నొక్కండి, లేదా 'నక్షత్రం తెలుసు' లో ఎంచుకోండి.`);
      } else {
        setMatchMsg(`${ROLE_TO[prefix]} రాశి-నక్షత్రం ఎంచుకోండి, లేదా పుట్టిన తేదీ, సమయం ఇవ్వండి.`);
      }
      const target = mode === "birth"
        ? ($(prefix + "-date").value ? $(prefix + "-hour") : $(prefix + "-date"))
        : $(prefix + "-combo");
      if (target) target.focus();
      return;
    }
    const pp = (p) => (window.getPersonPada ? window.getPersonPada(p) : undefined);
    const d = computeMatch(+personComboId("girl"), +personComboId("boy"), $("girl-name").value.trim(), $("boy-name").value.trim(), pp("girl"), pp("boy"));
    render(d, skipPush);
  } catch (err) {
    console.error(err);
    setMatchMsg("ఫలితం చూపించలేకపోయాం — ఒకసారి మళ్ళీ నొక్కండి.");
  } finally {
    setMatchBusy(false);
  }
}

// gp/bp: exact pada 1..4 when known (birth-details finder or URL), else undefined = whole combo.
function computeMatch(g, b, gn, bn, gp, bp) {
  const m = K.match(g, b, { gPada: gp, bPada: bp });
  const nadiParihara = m.parihara.some((p) => p.key === "nadi");
  return { g, b, gn, bn, gp, bp, girl: K.combo(g), boy: K.combo(b), kootas: m.kootas, total: m.total, nadiDosha: m.nadiDosha,
    nadiParihara, parihara: m.parihara, totalWithParihara: m.totalWithParihara, tier: K.tier(m.total) };
}

// ---------- render ----------
function dots(k) {
  const w = el("span", "pt-dots");
  w.setAttribute("aria-hidden", "true");
  const c = scoreColor(k);
  for (let i = 0; i < k.max; i++) {
    const dot = el("i", i < k.score ? "on" : "");
    if (i + 1 <= k.score) dot.style.background = c;
    else if (i < k.score) dot.style.background = `linear-gradient(90deg,${c} 50%,transparent 50%)`;
    w.appendChild(dot);
  }
  return w;
}

function renderHero(d) {
  const t = d.tier;
  $("pt-gname").textContent = d.gn || d.girl.nakshatra;
  $("pt-bname").textContent = d.bn || d.boy.nakshatra;
  [["g", d.girl, d.gp], ["b", d.boy, d.bp]].forEach(([s, c, p]) => {
    $(`pt-${s}rasi`).textContent = rasiText(c.rasi);
    $(`pt-${s}nak`).textContent = c.nakshatra + " నక్షత్రం";
    $(`pt-${s}pada`).textContent = padaText(p ? String(p) : c.padas);
  });
  const v = $("verdict");
  v.textContent = t.label;
  v.style.color = t.color;
  $("pt-subline").textContent = SUBLINE[t.key];
  // Dosha wording only when a dosha exists.
  const chip = $("pt-chip");
  // A nadi dosha with a parihara is listed (with its reason) in the parihara list instead.
  chip.parentElement.hidden = !d.nadiDosha || d.nadiParihara;
  chip.textContent = "నాడి 0/8";
  chip.classList.add("is-nadi");
  const ph = $("pt-parihara"), pi = pariharaInfo(d);
  ph.replaceChildren();
  ph.hidden = !pi;
  if (pi) {
    const ul = el("ul");
    pi.items.forEach((t) => ul.appendChild(el("li", "", t)));
    ph.append(ul, el("p", "pt-ph-total", pi.total));
  }
  const sh = $("pt-shanti"), shs = d.kootas.filter(hasShanti);
  sh.replaceChildren();
  sh.hidden = !shs.length;
  if (shs.length) {
    sh.append("సూచించే శాంతి: ");
    shs.forEach((k, i) => sh.append(i ? " · " : "", el("span", "", `${INFO[k.key].short} — ${SHANTI[k.key]}`)));
    sh.append(el("small", "", "జ్యోతిష్యులను సంప్రదించి చేయించుకోండి"));
  }
  $("score").classList.toggle("is-dec", !Number.isInteger(d.total));

  const tiles = $("pt-tiles");
  tiles.replaceChildren();
  d.kootas.forEach((k) => {
    const tile = el("div", "pt-tile");
    const top = el("span", "pt-tile-top");
    const sc = el("span", "", `${fmt(k.score)}/${k.max}`);
    sc.style.color = scoreColor(k);
    top.append(el("b", "", INFO[k.key].short), sc);
    tile.append(top, dots(k));
    if (k.parihara) tile.appendChild(el("span", "pt-tile-ph", "పరిహారం ఉంది"));
    tiles.appendChild(tile);
  });
  animateScore(d.total);
}

function animateScore(total) {
  const s = $("score");
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { s.textContent = fmt(total); return; }
  const t0 = performance.now();
  const step = (ts) => {
    const p = Math.min((ts - t0) / 900, 1);
    s.textContent = p < 1 ? Math.round(total * (1 - Math.pow(1 - p, 3))) : fmt(total);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function renderGlance(d) {
  const full = d.kootas.filter((k) => k.score === k.max);
  const zero = d.kootas.filter((k) => k.score === 0);
  const part = 8 - full.length - zero.length;
  let t = `8 కూటముల్లో ${full.length} పూర్తిగా${part ? `, ${part} కొంత` : ""} కలిశాయి`;
  if (zero.length) t += `; ${zero.map((k) => INFO[k.key].short).join(", ")}కు 0 వచ్చింది`;
  t += ".";
  $("glance-text").textContent = t;
  $("nadi-box").hidden = !d.nadiDosha;
  $("nadi-box").classList.toggle("is-parihara", d.nadiParihara);
  $("nadi-title").textContent = d.nadiParihara ? "నాడి 0/8 — దోష పరిహారం ఉంది" : "నాడి 0/8 — ఇద్దరిదీ ఒకే నాడి";
  $("nadi-text").textContent = d.nadiParihara
    ? `${d.kootas[7].parihara} — ఈ పొందికలో నాడి నియమం సడలుతుందని సంప్రదాయం చెబుతుంది. వర్తిస్తుందో లేదో పెద్దలు, జ్యోతిష్యులు నిర్ణయిస్తారు.`
    : "ఇద్దరిదీ ఒకే నాడి అయితే సంప్రదాయంలో 0 ఇస్తారు. చాలా కుటుంబాలు దీన్ని ముఖ్యంగా చూస్తాయి — ఈ జోడీకి పరిహారాలు వర్తిస్తాయో జ్యోతిష్యులను అడగండి.";
}

function renderKootas(d) {
  const wrap = $("kootas");
  wrap.replaceChildren();
  $("lg-girl").textContent = d.gn ? `వధువు · ${d.gn}` : "వధువు";
  $("lg-boy").textContent = d.bn ? `వరుడు · ${d.bn}` : "వరుడు";
  d.kootas.forEach((k, i) => {
    const info = INFO[k.key], c = scoreColor(k);
    const row = el("div", "k-row");
    const head = el("div", "k-head");
    const nm = el("span");
    nm.append(el("b", "", k.name), el("span", "k-tag", info.tag));
    const sc = el("span", "k-score", `${fmt(k.score)}/${k.max}`);
    sc.style.color = c;
    // Full score: a quiet check mark instead of repeating "పూర్తిగా కలిసింది" on every row.
    if (k.score === k.max) {
      const ok = el("span", "k-ok", "✓");
      ok.setAttribute("aria-hidden", "true");
      sc.prepend(ok, el("span", "vh", "పూర్తిగా కలిసింది: "));
    }
    head.append(nm, sc);

    const bar = el("div", "k-bar");
    const fill = el("span");
    fill.style.background = c;
    fill.style.width = "0";
    bar.appendChild(fill);
    setTimeout(() => { fill.style.transition = "width .6s"; fill.style.width = `${(k.score / k.max) * 100}%`; }, 100 + i * 60);

    const labels = el("div", "k-labels");
    [["#B3123A", k.girl], ["#3F5A16", k.boy]].forEach(([col, txt]) => {
      const s = el("span");
      const dot = el("i");
      dot.style.background = col;
      dot.setAttribute("aria-hidden", "true");
      s.append(dot, document.createTextNode(txt));
      labels.appendChild(s);
    });
    // A parihara replaces the status line; full-score rows have no status line.
    const status = k.parihara ? el("p", "k-parihara", `దోష పరిహారం: ${k.parihara}`)
      : k.score < k.max ? el("p", "k-status", statusText(k)) : null;
    if (status && !k.parihara) status.style.color = c;

    const det = el("details", "k-why");
    det.appendChild(el("summary", "", "ఎందుకు?"));
    const body = el("div", "k-why-body");
    const line = (label, text) => { const p = el("p"); p.append(el("b", "", label + " "), document.createTextNode(text)); return p; };
    body.append(line("ఏం చూస్తుంది:", info.about), line("ఈ జోడీలో:", reason(k)));
    if (k.parihara) body.appendChild(line("దోష పరిహారం:", `${k.parihara}. ${PARIHARA_WHY[k.key]} వర్తిస్తుందో లేదో పెద్దలు, జ్యోతిష్యులు నిర్ణయిస్తారు.`));
    if (hasShanti(k)) body.appendChild(line("సూచించే శాంతి:", `${SHANTI[k.key]} — జ్యోతిష్యులను సంప్రదించి చేయించుకోండి`));
    if (k.score < k.max) body.appendChild(line("జ్యోతిష్యుడిని అడగండి:", info.ask));
    if (k.key === "nadi" && d.nadiDosha) {
      const p = el("p");
      const a = el("a", "", "నాడి దోషం గురించి చదవండి");
      a.href = "/nadi-dosha";
      p.appendChild(a);
      body.appendChild(p);
    }
    det.appendChild(body);

    row.append(head, bar, labels);
    if (status) row.appendChild(status);
    row.appendChild(det);
    wrap.appendChild(row);
  });
  $("advanced-btn").href = `/explain?g=${d.g}&b=${d.b}${d.gp ? `&gp=${d.gp}` : ""}${d.bp ? `&bp=${d.bp}` : ""}`;
}

function renderNext(d) {
  const zero = d.kootas.filter((k) => k.score === 0 && k.key !== "nadi");
  let t;
  if (d.parihara.length) t = `${d.parihara.map((p) => INFO[p.key].short).join(", ")}కు సంప్రదాయ పరిహారం కనిపిస్తోంది. ఇది ఈ జోడీకి వర్తిస్తుందో లేదో పెద్దలు, జ్యోతిష్యులే నిర్ణయిస్తారు.`;
  else if (d.nadiDosha) t = "నాడి 0/8 వచ్చింది — ఈ జోడీకి నాడి పరిహారం వర్తిస్తుందా అని అడగండి.";
  else if (zero.length) t = `${zero.map((k) => INFO[k.key].short).join(", ")}కు 0 వచ్చింది — ${INFO[zero[0].key].ask}`;
  else t = "అన్ని కూటములకు గుణాలు వచ్చాయి — మంచి ముహూర్తం గురించి అడగండి.";
  $("step4").textContent = t;
}

function renderAlts(d) {
  const sides = [
    { key: "girl", tab: `${d.gn || "వధువు"}కు వరులు`, id: d.g, other: (x) => K.match(d.g, x, { gPada: d.gp }), link: (x) => resultPath(d.g, x, d.gn, "", d.gp), skip: d.b, side: "girl" },
    { key: "boy", tab: `${d.bn || "వరుడి"}కి వధువులు`, id: d.b, other: (x) => K.match(x, d.b, { bPada: d.bp }), link: (x) => resultPath(x, d.b, "", d.bn, undefined, d.bp), skip: d.g, side: "boy" },
  ];
  sides.forEach((s) => {
    $(`tab-${s.key}`).textContent = s.tab;
    const list = [];
    for (let x = 1; x <= 36; x++) if (x !== s.skip) list.push({ x, total: s.other(x).total });
    list.sort((a, b) => b.total - a.total || a.x - b.x);
    const panel = $(`alts-${s.key}`);
    const ol = panel.querySelector("ol");
    ol.replaceChildren();
    list.slice(0, 3).forEach((it, i) => {
      const c = K.combo(it.x), t = K.tier(it.total);
      const li = el("li");
      const a = el("a");
      a.href = s.link(it.x);
      const txt = el("span", "alt-text");
      txt.append(el("span", "alt-main", `${c.rasi} · ${c.nakshatra}`), el("span", "alt-sub", padaText(c.padas)));
      const sc = el("span", "alt-score");
      const n = el("b", "", `${fmt(it.total)}/36`);
      n.style.color = t.color;
      const lb = el("span", "", t.label);
      lb.style.color = t.color;
      sc.append(n, lb);
      a.append(el("span", "alt-rank", String(i + 1)), txt, sc);
      li.appendChild(a);
      ol.appendChild(li);
    });
    panel.querySelector(".r-all").href = `/best-matches?side=${s.side}&id=${s.id}`;
  });
  selectTab("girl", false);
}

function selectTab(key, focus) {
  ["girl", "boy"].forEach((k) => {
    const on = k === key, t = $(`tab-${k}`);
    t.setAttribute("aria-selected", on ? "true" : "false");
    t.tabIndex = on ? 0 : -1;
    $(`alts-${k}`).hidden = !on;
    if (on && focus) t.focus();
  });
}

// ---------- share ----------
function shareLink(d) {
  const names = !$("msg-names-row").hidden && $("msg-names").checked;
  return location.origin + resultPath(d.g, d.b, names ? d.gn : "", names ? d.bn : "", d.gp, d.bp);
}
function shareText(d) {
  const names = (d.gn || d.bn) && $("msg-names").checked;
  const title = names
    ? `${d.gn || "వధువు"} – ${d.bn || "వరుడు"} వివాహ పొంతన`
    : `${d.girl.nakshatra} – ${d.boy.nakshatra} వివాహ పొంతన`;
  let line = `36లో ${fmt(d.total)} గుణాలు · ${d.tier.label}`;
  const pi = pariharaInfo(d);
  if (pi) line += `\n${pi.items.join("\n")}\n${pi.total} — వివరాలు ఈ లింక్‌లో చూడండి`;
  return { title, line };
}
function renderShare(d) {
  $("msg-names-row").hidden = !(d.gn || d.bn);
  const t = shareText(d);
  $("msg-title").textContent = t.title;
  $("msg-line").textContent = t.line;
  $("msg-line").style.whiteSpace = "pre-line";
  $("msg-link").textContent = shareLink(d);
}

function render(d, skipPush) {
  lastData = d;
  lastBlob = null;
  $("url-msg").hidden = true;
  renderHero(d);
  renderShare(d);
  renderGlance(d);
  renderKootas(d);
  renderNext(d);
  renderAlts(d);
  showView("view-result", skipPush ? false : undefined);
  // Pre-draw the share card so the share tap still has user activation.
  makeImage(d).then((blob) => { if (lastData === d) lastBlob = blob; }).catch((e) => console.warn(e));
  if (d.tier.key === "best" && window.celebrate) setTimeout(() => window.celebrate(true), 400);
}

async function getBlob() {
  return lastBlob || (lastBlob = await makeImage(lastData));
}

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "vivaha-ponthana.png";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function shareWhatsApp() {
  if (!lastData) return;
  const t = shareText(lastData), link = shareLink(lastData);
  const text = `${t.title}\n${t.line}`;
  if (lastBlob && navigator.canShare) {
    const file = new File([lastBlob], "vivaha-ponthana.png", { type: "image/png" });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: `${text}\n${link}` });
        return;
      } catch (e) {
        if (e.name === "AbortError") return;
      }
    }
  }
  window.open("https://wa.me/?text=" + encodeURIComponent(`${text}\n${link}`), "_blank", "noopener");
}

async function copyLink() {
  if (!lastData) return;
  const link = shareLink(lastData);
  try {
    await navigator.clipboard.writeText(link);
  } catch (e) {
    const ta = el("textarea");
    ta.value = link;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  const lb = $("copy-label");
  lb.textContent = "కాపీ అయింది";
  setTimeout(() => { lb.textContent = "లింక్ కాపీ"; }, 2000);
}

// ---------- share card: 1080×1350 canvas redraw of the patrika hero ----------
const KALASAM = [
  ...[-64, 64, -31, 31].map((r, i) => ({ d: "M0 0 C-4.5 -5 -5.5 -15 0 -23 C5.5 -15 4.5 -5 0 0Z", f: i < 2 ? "#3F6212" : "#4D6B1F", rot: r })),
  { d: "M32 5.5 C35.5 8.5 38.5 12.5 38.5 17.5 C38.5 22 35.5 25 32 25 C28.5 25 25.5 22 25.5 17.5 C25.5 12.5 28.5 8.5 32 5.5Z", f: "#7A4A1E" },
  { d: "M25 26 V29 C25 32.5 12 34.5 12 44 C12 52 19 57 26 57 L23 61.5 H41 L38 57 C45 57 52 52 52 44 C52 34.5 39 32.5 39 29 V26 Z", f: "#C77A0A" },
  { d: "M17.5 40 C18.5 36.5 21.5 34.5 25 33.5 C21.5 36.5 20 40 20 45 C18.5 44 17.3 42 17.5 40Z", f: "#E3A63A" },
  { d: "M15.5 22.5 Q15.5 21 17 21 H47 Q48.5 21 48.5 22.5 L45 28 H19 Z", f: "#8E1330" },
  { d: "M35.4 43 A3.4 3.4 0 1 1 28.6 43 A3.4 3.4 0 1 1 35.4 43Z", f: "#8E1330" },
];

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function fitText(ctx, text, maxW, size, weightFamily) {
  let s = size;
  do { ctx.font = `${weightFamily.replace("{s}", s)}`; s -= 2; } while (ctx.measureText(text).width > maxW && s > 18);
}

// Greedy word wrap; a " — " always starts a new line when the text does not fit on one.
function wrapText(ctx, text, maxW, font) {
  ctx.font = font;
  if (ctx.measureText(text).width <= maxW) return [text];
  const out = [];
  text.split(/(?<= —) /).forEach((seg) => {
    let cur = "";
    seg.split(" ").forEach((w) => {
      const t = cur ? `${cur} ${w}` : w;
      if (cur && ctx.measureText(t).width > maxW) { out.push(cur); cur = w; } else cur = t;
    });
    out.push(cur);
  });
  return out;
}

async function makeImage(d) {
  const TXT = '"Noto Sans Telugu", sans-serif', DSP = '"Ramabhadra", "Noto Sans Telugu", sans-serif', NUM = '"Plus Jakarta Sans", sans-serif';
  await Promise.all([
    document.fonts.load(`400 52px ${DSP}`, "వివాహ"),
    document.fonts.load(`600 28px ${TXT}`, "వధువు"),
    document.fonts.load(`700 28px ${TXT}`, "వధువు"),
    document.fonts.load(`800 28px ${NUM}`, "36"),
  ]).catch(() => {});
  const W = 1080, H = 1350;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#FBF4E6";
  ctx.fillRect(0, 0, W, H);

  // card + band
  const X = 40, Y = 40, CW = W - 80, CH = H - 80;
  ctx.save();
  rr(ctx, X, Y, CW, CH, 36);
  ctx.fillStyle = "#FFFDF8";
  ctx.fill();
  ctx.clip();
  for (let x = X; x < X + CW; x += 28) {
    ctx.fillStyle = x < W / 2 ? "#8E1330" : "#3F5A16";
    ctx.fillRect(x, Y, 28, 28);
    ctx.fillStyle = "#D9B25F";
    ctx.beginPath(); ctx.moveTo(x, Y + 28); ctx.lineTo(x + 14, Y + 14); ctx.lineTo(x + 28, Y + 28); ctx.fill();
    ctx.fillRect(x, Y + 6, 28, 2.4);
  }
  ctx.restore();
  rr(ctx, X, Y, CW, CH, 36);
  ctx.lineWidth = 4; ctx.strokeStyle = "#E5CB8E"; ctx.stroke();
  // inner frame + corner ornaments
  const fx = X + 16, fy = Y + 44, fw = CW - 32, fh = CH - 60;
  rr(ctx, fx, fy, fw, fh, 20);
  ctx.lineWidth = 2; ctx.strokeStyle = "#EAD6A4"; ctx.stroke();
  [[fx + 6, fy + 6, 1, 1], [fx + fw - 6, fy + 6, -1, 1], [fx + 6, fy + fh - 6, 1, -1], [fx + fw - 6, fy + fh - 6, -1, -1]].forEach(([x, y, sx, sy]) => {
    ctx.save(); ctx.translate(x, y); ctx.scale(sx * 2, sy * 2);
    ctx.strokeStyle = "#D9B25F"; ctx.lineWidth = 1.5;
    ctx.stroke(new Path2D("M2 24 V8 A6 6 0 0 1 8 2 H24"));
    ctx.fillStyle = "#C77A0A"; ctx.beginPath(); ctx.arc(8, 8, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  const cx = W / 2;
  // kalasam 80px
  ctx.save(); ctx.translate(cx - 40, 100); ctx.scale(80 / 64, 80 / 64);
  KALASAM.forEach((p) => {
    ctx.save();
    if (p.rot != null) { ctx.translate(32, 24); ctx.rotate((p.rot * Math.PI) / 180); }
    ctx.fillStyle = p.f; ctx.fill(new Path2D(p.d));
    ctx.restore();
  });
  ctx.restore();

  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = `600 28px ${TXT}`; ctx.fillStyle = "#8E1330";
  const inv = "శ్రీరస్తు · శుభమస్తు · అవిఘ్నమస్తు";
  ctx.fillText(inv, cx, 212);
  const iw = ctx.measureText(inv).width / 2;
  ctx.fillStyle = "#C9A24A";
  ctx.fillRect(cx - iw - 76, 212, 56, 2); ctx.fillRect(cx + iw + 20, 212, 56, 2);
  ctx.font = `400 52px ${DSP}`; ctx.fillStyle = "#2A1A12";
  ctx.fillText("వివాహ పొంతన పత్రం", cx, 272);

  // people: boxes 300 wide, centred at 215 / 865, so they stay inside the gold frame (56..1024)
  const person = (x, role, dotC, name, nameC, c, pada, bg, bd) => {
    ctx.font = `600 28px ${TXT}`;
    const rw = ctx.measureText(role).width;
    ctx.fillStyle = dotC; ctx.beginPath(); ctx.arc(x - rw / 2 - 14, 346, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#5E4B3C"; ctx.fillText(role, x + 6, 346);
    fitText(ctx, name, 290, 52, `400 {s}px ${DSP}`);
    ctx.fillStyle = nameC; ctx.fillText(name, x, 404);
    rr(ctx, x - 150, 446, 300, 150, 20);
    ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = bd; ctx.stroke();
    ctx.fillStyle = "#2A1A12";
    const pt = padaText(pada ? String(pada) : c.padas);
    fitText(ctx, rasiText(c.rasi), 270, 30, `700 {s}px ${TXT}`); ctx.fillText(rasiText(c.rasi), x, 486);
    fitText(ctx, c.nakshatra + " నక్షత్రం", 270, 28, `400 {s}px ${TXT}`); ctx.fillText(c.nakshatra + " నక్షత్రం", x, 526);
    fitText(ctx, pt, 270, 28, `400 {s}px ${TXT}`); ctx.fillText(pt, x, 564);
  };
  person(215, "వధువు", "#B3123A", d.gn || d.girl.nakshatra, "#8E1330", d.girl, d.gp, "#F6DCE2", "#EBC3CD");
  person(W - 215, "వరుడు", "#3F5A16", d.bn || d.boy.nakshatra, "#3F5A16", d.boy, d.bp, "#E3EBD2", "#C9D8A8");

  // seal (112px design × 2.1)
  const S = 2.1, sy = 470;
  ctx.save(); ctx.translate(cx, sy); ctx.scale(S, S);
  ctx.fillStyle = "#D9B25F";
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    ctx.beginPath(); ctx.arc(Math.cos(a) * 49.28, Math.sin(a) * 49.28, 5.82, 0, Math.PI * 2); ctx.fill();
  }
  ctx.beginPath(); ctx.arc(0, 0, 49.28, 0, Math.PI * 2); ctx.fill();
  const gr = ctx.createRadialGradient(-9, -14, 0, 0, 0, 45.36);
  gr.addColorStop(0, "#A51A3B"); gr.addColorStop(1, "#7A0F29");
  ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, 45.36, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#E7C170"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, 40.88, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  // Inner ring is ~172px wide; decimals ("26.5") shrink to fit ~130px at the text's height.
  ctx.fillStyle = "#FFF6E5"; fitText(ctx, fmt(d.total), 130, 84, `400 {s}px ${DSP}`); ctx.fillText(fmt(d.total), cx, sy - 26);
  ctx.fillStyle = "#F3D98E"; ctx.font = `800 27px ${NUM}`; ctx.fillText("/ 36", cx, sy + 24);
  ctx.fillStyle = "#FFF6E5"; ctx.font = `600 26px ${TXT}`; ctx.fillText("గుణాలు", cx, sy + 60);

  // verdict + subline (the score itself is only in the seal)
  ctx.fillStyle = d.tier.color; ctx.font = `400 56px ${DSP}`; ctx.fillText(d.tier.label, cx, 652);
  ctx.fillStyle = "#5E4B3C";
  const sub = wrapText(ctx, SUBLINE[d.tier.key], 900, `500 30px ${TXT}`);
  sub.forEach((t, i) => ctx.fillText(t, cx, 706 + i * 40));
  let y = 734 + (sub.length - 1) * 40; // y tracks the bottom of what was drawn
  // Nadi chip only for a nadi dosha without parihara (a parihara is listed below with its reason).
  const pi = pariharaInfo(d);
  if (d.nadiDosha && !d.nadiParihara) {
    const chipT = "నాడి 0/8";
    ctx.font = `600 28px ${TXT}`;
    const cw = ctx.measureText(chipT).width + 48, x0 = cx - cw / 2;
    rr(ctx, x0, y, cw, 52, 26);
    ctx.fillStyle = "#FCEBC4"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#E9C77A"; ctx.stroke();
    ctx.fillStyle = "#6B3A00"; ctx.fillText(chipT, cx, y + 27);
    y += 52 + (pi ? 10 : 0);
  }
  if (pi) {
    // One line per dosha + the total while the tiles stay >= 72px tall; else the one-line
    // summary (the footer points to the site for the reasons).
    const LH = 38, fits = y + (pi.items.length + 1) * LH + 16 <= 1162 - 3 * 10 - 4 * 72;
    const lines = fits ? [...pi.items, pi.total] : [pi.short];
    ctx.fillStyle = "#3F5A16";
    lines.forEach((t, i) => {
      const last = i === lines.length - 1;
      fitText(ctx, t, 900, last ? 28 : 26, `${last ? 700 : 500} {s}px ${TXT}`);
      ctx.fillText(t, cx, y + LH / 2 + i * LH);
    });
    y += lines.length * LH;
  }

  // 8 tiles, 2 columns, from just below the last row down to the footer (no empty band)
  const top = y + 16, bottom = 1162, gx = 20, gy = 10, tw = 450, tx0 = (W - tw * 2 - gx) / 2;
  const th = Math.min(96, (bottom - top - 3 * gy) / 4);
  d.kootas.forEach((k, i) => {
    const x = tx0 + (i % 2) * (tw + gx), ty = top + Math.floor(i / 2) * (th + gy), c = scoreColor(k);
    rr(ctx, x, ty, tw, th, 22);
    ctx.fillStyle = "#FFFDF8"; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "#EFE4CF"; ctx.stroke();
    const ly = ty + th * 0.36, dy = ty + th - 22;
    ctx.textAlign = "left"; ctx.fillStyle = "#2A1A12"; ctx.font = `700 30px ${TXT}`;
    ctx.fillText(INFO[k.key].short, x + 24, ly);
    ctx.textAlign = "right"; ctx.fillStyle = c; ctx.font = `800 32px ${NUM}`;
    ctx.fillText(`${fmt(k.score)}/${k.max}`, x + tw - 24, ly);
    // A koota restored by a parihara says so on its own card.
    if (k.parihara) { ctx.fillStyle = "#4D6B1F"; ctx.font = `600 24px ${TXT}`; ctx.fillText("పరిహారం ఉంది", x + tw - 24, dy); }
    for (let j = 0; j < k.max; j++) {
      const dx = x + 32 + j * 24;
      ctx.beginPath(); ctx.arc(dx, dy, 8, 0, Math.PI * 2);
      if (j + 1 <= k.score) { ctx.fillStyle = c; ctx.fill(); continue; }
      ctx.lineWidth = 2.5; ctx.strokeStyle = "#A8977A"; ctx.stroke();
      if (j < k.score) { ctx.beginPath(); ctx.arc(dx, dy, 8, Math.PI / 2, Math.PI * 1.5); ctx.fillStyle = c; ctx.fill(); }
    }
  });

  // footer: kept clear of the tiles and of the corner ornaments (x < 110 / > 970)
  ctx.textAlign = "center";
  ctx.fillStyle = "#8E1330";
  const cta = pi ? "పరిహారాల వివరాలు matchmyjathakam.com లో చూడండి" : "మీ జోడీ పొంతన కూడా చూడండి — matchmyjathakam.com";
  fitText(ctx, cta, 780, 29, `700 {s}px ${TXT}`);
  ctx.fillText(cta, cx, 1204);
  ctx.fillStyle = "#5E4B3C";
  const note = "నక్షత్రాల ఆధారంగా అష్టకూట లెక్క మాత్రమే · జాతకం జ్యోతిష్యులతో చూపించండి";
  fitText(ctx, note, 760, 24, `400 {s}px ${TXT}`);
  ctx.fillText(note, cx, 1244);

  return new Promise((res) => cv.toBlob(res, "image/png"));
}
window.makeShareImage = () => lastData && getBlob();

// ---------- wiring ----------
fillCombos();
$("match-btn").addEventListener("click", () => match());
document.querySelectorAll("#view-input select, #view-input input").forEach((x) => x.addEventListener("change", () => setMatchMsg("")));
$("back-btn").addEventListener("click", () => showView("view-input"));
$("edit-btn").addEventListener("click", () => showView("view-input"));
$("new-btn").addEventListener("click", () => {
  ["girl", "boy"].forEach((p) => {
    if (window.setPersonMode) window.setPersonMode(p, "known");
    $(`${p}-combo`).value = "";
    $(`${p}-name`).value = "";
  });
  lastData = null;
  showView("view-input", false);
  history.pushState(null, "", "/");
});
$("wa-btn").addEventListener("click", shareWhatsApp);
$("copy-btn").addEventListener("click", copyLink);
$("download-btn").addEventListener("click", async () => { if (lastData) downloadBlob(await getBlob()); });
$("print-btn").addEventListener("click", () => window.print());
// Print shows every "ఎందుకు?" answer (closed <details> content doesn't print otherwise).
addEventListener("beforeprint", () => document.querySelectorAll(".k-why").forEach((x) => { x.open = true; }));
$("msg-names").addEventListener("change", () => lastData && renderShare(lastData));
["girl", "boy"].forEach((k) => $(`tab-${k}`).addEventListener("click", () => selectTab(k, false)));
$("tab-girl").parentElement.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
  selectTab($("tab-girl").getAttribute("aria-selected") === "true" ? "boy" : "girl", true);
});

function fromUrl() {
  const q = restoreFromUrl();
  if (q) {
    restoreCombos(q);
    render(computeMatch(q.g, q.b, q.gn, q.bn, q.gp, q.bp), true);
  } else {
    showView("view-input", false);
    // A result link that can't be read: say so above the form instead of failing silently.
    $("url-msg").hidden = !new URLSearchParams(location.search).has("g");
  }
}
window.addEventListener("popstate", fromUrl);
if (new URLSearchParams(location.search).has("g")) fromUrl();
