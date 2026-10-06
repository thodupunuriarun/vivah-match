const KOOTAS = [
  { key:"varna", about:"అహం/స్వభావ స్థాయి — బ్రాహ్మణ, క్షత్రియ, వైశ్య, శూద్ర వర్ణ పోలిక.", good:"గౌరవం, సమాన ఆలోచన.", bad:"అహం ఘర్షణ, నిర్ణయాల్లో అసమానత." },
  { key:"vashya", about:"ఆకర్షణ/వశ్యత — ఒకరు మరొకరి మాట వినే గుణం.", good:"పరస్పర వశ్యత — సర్దుబాటు సులభం.", bad:"వశ్యత లేకపోతే పట్టుదల, మాట వినకపోవడం." },
  { key:"tara", about:"ఆరోగ్యం/ఆయుష్షు — జన్మ నక్షత్రాల తారా బలం.", good:"తారా బలం — ఆరోగ్యం, ప్రయాణ శుభం.", bad:"తక్కువైతే తారా బలం తక్కువని చెబుతారు." },
  { key:"yoni", about:"దాంపత్య సుఖం/శారీరక అనుకూలత — జంతు యోని పోలిక.", good:"సాన్నిహిత్యం, సంతాన శుభం.", bad:"మనస్పర్థలు, సర్దుబాటు కష్టం." },
  { key:"graha_maitri", about:"మానసిక స్నేహం — రాశ్యాధిపతుల మైత్రి.", good:"ఆలోచనలు కలవడం, స్నేహం.", bad:"అభిప్రాయ భేదాలు, ఆర్థిక విషయాల్లో ఘర్షణ." },
  { key:"gana", about:"స్వభావం — దేవ, మనుష్య, రాక్షస గణ పోలిక.", good:"స్వభావం కలవడం, ఇంట్లో శాంతి.", bad:"కోపం, జీవనశైలి తేడాలు." },
  { key:"bhakoot", about:"కుటుంబ/సంతాన అనుకూలత — రాశుల తత్వ పోలిక (చర/స్థిర/ద్విస్వభావ).", good:"సంతానం, కుటుంబ వృద్ధి శుభం.", bad:"దూరం, అపార్థాలు." },
  { key:"nadi", about:"సంతాన ఆరోగ్యం — ఆది/మధ్య/అంత్య నాడి. 0 వస్తే నాడి దోషం.", good:"వేరు నాడులు — సంతాన ఆరోగ్యానికి మంచిదని సంప్రదాయం.", bad:"0/8 నాడి దోషం — కొన్ని నక్షత్రాలకు ఈ దోషం వర్తించదని పంచాంగం చెబుతుంది." },
];

const OVERALL = {
  best: "ఉత్తమ పొంతన — 8 కూటముల్లో దాదాపు అన్నీ కలిశాయి. వివాహానికి చాలా అనుకూలం.",
  vgood: "చాలా మంచి పొంతన — చాలా కూటములు అనుకూలం. సాధారణంగా పెళ్లికి అనుకూలంగా చెబుతారు.",
  good: "మంచి పొంతన — పలు కూటములు అనుకూలం. సాధారణంగా పెళ్లికి అనుకూలంగా చెబుతారు.",
  fair: "సామాన్య పొంతన — కొన్ని కూటములు తక్కువ. పూర్తి జాతక చక్ర పరిశీలన తర్వాత నిర్ణయం.",
  advice: "తక్కువ పొంతన — ఈ జోడీలో చాలా కూటములు అంతగా కలవలేదు. నిర్ణయానికి ముందు పూర్తి జాతక పరిశీలన గురించి జ్యోతిష్యులతో వివరంగా చర్చించడం మంచిది.",
};

const fmt = (n) => Number.isInteger(n) ? String(n) : n.toFixed(1);
// bar fills (AA on card): full = leaf-green, partial = turmeric-brown, zero = calm brown (never red)
const COLOR = { good: "#047857", neutral: "#b45309", low: "#7A4A1E" };

function qs(name){ return new URLSearchParams(location.search).get(name); }
function padaText(p){ const a = p.split(","); return a.length === 1 ? `${a[0]}వ పాదం` : `${a.join(", ")} పాదాలు`; }
// exact pada p (1..4) when known, else the combo padas (same wording as results page)
const who = (c, p) => `${c.rasi} · ${c.nakshatra}${p ? ` · ${p}వ పాదం` : c.padas === "1,2,3,4" ? "" : ` · ${padaText(c.padas)}`}`;
// Same rule as app.js: 1..4 and one of that combo's padas, else ignored.
const pada = (key, id) => { const v = qs(key); return /^[1-4]$/.test(v || "") && Koota.combo(id).padas.split(",").includes(v) ? +v : undefined; };
function el(tag, cls, text){ const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

function init(){
  const g = +qs("g"), b = +qs("b");
  const scoreLine = document.getElementById("score-line");
  if (!(g >= 1 && g <= 36 && b >= 1 && b <= 36)) {
    scoreLine.textContent = "ఈ జోడీ వివరాలు దొరకలేదు — మళ్లీ ఎంచుకోండి.";
    document.querySelectorAll(".ex-hide-empty").forEach((s) => { s.hidden = true; });
    return;
  }

  const gp = pada("gp", g), bp = pada("bp", b);
  document.getElementById("result-return-link").setAttribute("href", `/?g=${g}&b=${b}${gp ? `&gp=${gp}` : ""}${bp ? `&bp=${bp}` : ""}`);

  const girl = Koota.combo(g);
  const boy = Koota.combo(b);
  const match = Koota.match(g, b);
  const tier = Koota.tier(match.total);

  document.getElementById("pair-tag").textContent = `వధువు: ${who(girl, gp)} · వరుడు: ${who(boy, bp)}`;

  scoreLine.textContent = "";
  const scoreSpan = el("span", null, `${fmt(match.total)}/${match.max}`);
  scoreSpan.style.color = tier.color;
  scoreLine.append(scoreSpan, document.createTextNode(` — ${tier.label}`));
  if (match.nadiDosha) scoreLine.append(" ", el("span", "ex-chip", "నాడి 0/8"));
  scoreLine.append(el("div", "ex-src", "మొత్తం గుణాలు: తిరుమల తిరుపతి దేవస్థానం పంచాంగం (2025-26) గుణమేళన చక్రం ప్రకారం"));
  if (match.parihara.length) scoreLine.append(el("div", "ex-parihara", "TTD పంచాంగంలో మినహాయింపు ఉన్న దోషాలు కింద ఆ కూటమి వివరాల్లో ఉన్నాయి — వర్తిస్తుందో జ్యోతిష్యులు నిర్ణయిస్తారు"));

  const wrap = document.getElementById("explain-list");
  wrap.textContent = "";
  match.kootas.forEach((v, i) => {
    const k = KOOTAS[i];
    const cls = v.score === v.max ? "good" : v.score > 0 ? "neutral" : "low";
    const verdict = cls === "good" ? "పూర్తిగా కలిసింది" : cls === "neutral" ? "కొంత కలిసింది" : "కలవలేదు";
    const effect = cls === "good" ? k.good : cls === "neutral" ? "పాక్షికంగా కలిసింది — కొంత సర్దుబాటుతో సరిపోతుంది. " + k.good : k.bad;

    const row = el("div", "ex-row");
    const head = el("div", "ex-head");
    const nameDiv = el("div", "ex-name", `${i + 1}. ${v.name} `);
    nameDiv.append(el("span", "ex-pts", `(${fmt(v.score)}/${v.max})`));
    const verdictSpan = el("span", "ex-verdict " + cls, verdict);
    head.append(nameDiv, verdictSpan);
    row.append(head, el("div", "ex-about", k.about), el("div", "ex-effect", effect), el("div", "ex-detail", `${v.girl} · ${v.boy}`));
    if (v.parihara) row.append(el("div", "ex-ph", `TTD పంచాంగం మినహాయింపు: ${v.parihara} — వర్తిస్తుందో జ్యోతిష్యులు నిర్ణయిస్తారు.`));

    const bar = el("div", "ex-bar");
    const fill = el("div");
    fill.style.width = `${v.score / v.max * 100}%`;
    fill.style.background = COLOR[cls];
    bar.append(fill);
    row.append(bar);
    wrap.append(row);
  });

  // Rows (koota.js ROWS) add up to the TTD total for every pair but one (31x27, see koota.js).
  // Effect lines above are generic; the attributes are in ex-detail. Same note wording as app.js.
  const sum = match.kootas.reduce((a, k) => a + k.score, 0), fixed = match.kootas[6].score + match.kootas[7].score;
  if (sum !== match.total) wrap.append(el("p", "ex-src", fixed > match.total
    ? `తిరుమల తిరుపతి దేవస్థానం పంచాంగం గుణమేళన చక్రంలో ఈ జోడీకి ${match.total} గుణాలు ఉన్నాయి. కానీ రాశి, నాడి కూటములకే ${fmt(fixed)} వస్తాయి, కాబట్టి అది ముద్రణ పొరపాటు కావచ్చు. ఇక్కడ కూటముల గుణాలు సాధారణ అష్టకూట పద్ధతిలో చూపించాం (కలిపితే ${fmt(sum)}).`
    : `మొత్తం ${match.total} గుణాలు తిరుమల తిరుపతి దేవస్థానం పంచాంగం గుణమేళన చక్రం ప్రకారం. ఇక్కడ కూటముల గుణాలు సాధారణ అష్టకూట పద్ధతిలో చూపించాం (కలిపితే ${fmt(sum)}).`));
  document.getElementById("overall-text").textContent = OVERALL[tier.key] + ` (మొత్తం ${fmt(match.total)}/${match.max})`;
}
init();
