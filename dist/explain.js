const KOOTAS = [
  { key:"varna", about:"అహం/స్వభావ స్థాయి — బ్రాహ్మణ, క్షత్రియ, వైశ్య, శూద్ర వర్ణ పోలిక.", good:"ఒకే స్థాయి లేదా వధువు కంటే వరుడు ఒక మెట్టు పైన — గౌరవం, సమాన ఆలోచన.", bad:"వరుడు తక్కువ వర్ణమైతే అహం ఘర్షణ, నిర్ణయాల్లో అసమానత." },
  { key:"vashya", about:"ఆకర్షణ/వశ్యత — ఒకరు మరొకరి మాట వినే గుణం.", good:"పరస్పర వశ్యత — సర్దుబాటు సులభం.", bad:"వశ్యత లేకపోతే పట్టుదల, మాట వినకపోవడం." },
  { key:"tara", about:"ఆరోగ్యం/ఆయుష్షు — జన్మ నక్షత్రాల తారా బలం.", good:"తారా బలం — ఆరోగ్యం, ప్రయాణ శుభం.", bad:"తక్కువైతే అనారోగ్య భయం, తరచు తారా దోష శాంతి సూచిస్తారు." },
  { key:"yoni", about:"దాంపత్య సుఖం/శారీరక అనుకూలత — జంతు యోని పోలిక.", good:"ఒకే యోని లేదా మిత్ర యోని — సాన్నిహిత్యం, సంతాన శుభం.", bad:"శత్రు యోని — మనస్పర్థలు, సర్దుబాటు కష్టం." },
  { key:"graha_maitri", about:"మానసిక స్నేహం — రాశ్యాధిపతుల మైత్రి.", good:"మిత్ర గ్రహాలు — ఆలోచనలు కలవడం, స్నేహం.", bad:"శత్రు గ్రహాలు — అభిప్రాయ భేదాలు, ఆర్థిక విషయాల్లో ఘర్షణ." },
  { key:"gana", about:"స్వభావం — దేవ, మనుష్య, రాక్షస గణ పోలిక.", good:"ఒకే గణం — స్వభావం కలవడం, ఇంట్లో శాంతి.", bad:"విరుద్ధ గణాలు — కోపం, జీవనశైలి తేడాలు." },
  { key:"bhakoot", about:"కుటుంబ/సంతాన అనుకూలత — రాశుల తత్వ పోలిక (చర/స్థిర/ద్విస్వభావ).", good:"రాశి కలిస్తే సంతానం, కుటుంబ వృద్ధి శుభం.", bad:"6-8 రాశి సంబంధం — దూరం, అపార్థాలు." },
  { key:"nadi", about:"సంతాన ఆరోగ్యం — ఆది/మధ్య/అంత్య నాడి. 0 వస్తే నాడి దోషం.", good:"వేరు నాడులు — సంతాన ఆరోగ్యానికి మంచిదని సంప్రదాయం.", bad:"0/8 నాడి దోషం — పరిహార పూజలు/శాంతి సూచిస్తారు; మిగతా కూటములు బాగుంటే సర్దుబాటు చెబుతారు." },
];

const OVERALL = {
  best: "ఉత్తమ పొంతన — 8 కూటముల్లో దాదాపు అన్నీ కలిశాయి. వివాహానికి చాలా అనుకూలం.",
  vgood: "చాలా మంచి పొంతన — చాలా కూటములు అనుకూలం. సాధారణంగా పెళ్లికి అనుకూలంగా చెబుతారు.",
  good: "మంచి పొంతన — పలు కూటములు అనుకూలం. సాధారణంగా పెళ్లికి అనుకూలంగా చెబుతారు.",
  fair: "సామాన్య పొంతన — కొన్ని కూటములు తక్కువ. సర్దుబాటు, పరిహారాలు, జాతక చక్ర పరిశీలన తర్వాత నిర్ణయం.",
  advice: "తక్కువ పొంతన — ఈ జోడీలో చాలా కూటములు అంతగా కలవలేదు. నిర్ణయానికి ముందు దోష పరిహారాలు, పూర్తి జాతక పరిశీలన గురించి జ్యోతిష్యులతో వివరంగా చర్చించడం మంచిది.",
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
  const match = Koota.match(g, b, { gPada: gp, bPada: bp });
  const tier = Koota.tier(match.total);

  document.getElementById("pair-tag").textContent = `వధువు: ${who(girl, gp)} · వరుడు: ${who(boy, bp)}`;

  scoreLine.textContent = "";
  const scoreSpan = el("span", null, `${fmt(match.total)}/${match.max}`);
  scoreSpan.style.color = tier.color;
  scoreLine.append(scoreSpan, document.createTextNode(` — ${tier.label}`));
  if (match.nadiDosha) scoreLine.append(" ", el("span", "ex-chip", "నాడి 0/8"));
  if (match.totalWithParihara > match.total) scoreLine.append(el("div", "ex-parihara", `దోష ${match.parihara.length > 1 ? "పరిహారాలతో" : "పరిహారంతో"}: ${fmt(match.totalWithParihara)}/${match.max} — కారణం కింద ఆ కూటమి వివరాల్లో ఉంది`));

  const wrap = document.getElementById("explain-list");
  wrap.textContent = "";
  match.kootas.forEach((v, i) => {
    const k = KOOTAS[i];
    const cls = v.score === v.max ? "good" : v.score > 0 ? "neutral" : "low";
    const verdict = cls === "good" ? "పూర్తిగా కలిసింది" : cls === "neutral" ? "కొంత కలిసింది" : v.parihara ? "సంప్రదాయ పరిహారం ఉంది" : "కలవలేదు";
    const effect = cls === "good" ? k.good : cls === "neutral" ? "పాక్షికంగా కలిసింది — కొంత సర్దుబాటుతో సరిపోతుంది. " + k.good : k.bad;

    const row = el("div", "ex-row");
    const head = el("div", "ex-head");
    const nameDiv = el("div", "ex-name", `${i + 1}. ${v.name} `);
    nameDiv.append(el("span", "ex-pts", `(${fmt(v.score)}/${v.max})`));
    const verdictSpan = el("span", "ex-verdict " + (cls === "low" && v.parihara ? "leaf" : cls), verdict);
    head.append(nameDiv, verdictSpan);
    row.append(head, el("div", "ex-about", k.about), el("div", "ex-effect", effect), el("div", "ex-detail", `${v.girl} · ${v.boy}`));
    if (v.parihara) row.append(el("div", "ex-ph", `దోష పరిహారం: ${v.parihara} — వర్తిస్తుందో లేదో పెద్దలు, జ్యోతిష్యులు నిర్ణయిస్తారు.`));

    const bar = el("div", "ex-bar");
    const fill = el("div");
    fill.style.width = `${v.score / v.max * 100}%`;
    fill.style.background = COLOR[cls];
    bar.append(fill);
    row.append(bar);
    wrap.append(row);
  });

  document.getElementById("overall-text").textContent = OVERALL[tier.key] + ` (మొత్తం ${fmt(match.total)}/${match.max})`;
}
init();
