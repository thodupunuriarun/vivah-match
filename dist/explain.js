const KOOTAS = [
  { key:"p1", max:1, name:"వర్ణకూటము", about:"అహం/స్వభావ స్థాయి — బ్రాహ్మణ, క్షత్రియ, వైశ్య, శూద్ర వర్ణ పోలిక.", good:"ఒకే స్థాయి లేదా వధువు కంటే వరుడు ఒక మెట్టు పైన — గౌరవం, సమాన ఆలోచన.", bad:"వరుడు తక్కువ వర్ణమైతే అహం ఘర్షణ, నిర్ణయాల్లో అసమానత." },
  { key:"p2", max:2, name:"వశ్య కూటము", about:"ఆకర్షణ/వశ్యత — ఒకరు మరొకరి మాట వినే గుణం.", good:"పరస్పర వశ్యత — సర్దుబాటు సులభం.", bad:"వశ్యత లేకపోతే పట్టుదల, మాట వినకపోవడం." },
  { key:"p3", max:3, name:"తారాకూటము", about:"ఆరోగ్యం/ఆయుష్షు — జన్మ నక్షత్రాల తారా బలం.", good:"తారా బలం — ఆరోగ్యం, ప్రయాణ శుభం.", bad:"తక్కువైతే అనారోగ్య భయం, తరచు తారా దోష శాంతి సూచిస్తారు." },
  { key:"p4", max:4, name:"యోనికూటము", about:"దాంపత్య సుఖం/శారీరక అనుకూలత — జంతు యోని పోలిక.", good:"ఒకే యోని లేదా మిత్ర యోని — సాన్నిహిత్యం, సంతాన శుభం.", bad:"శత్రు యోని — మనస్పర్థలు, సర్దుబాటు కష్టం." },
  { key:"p5", max:5, name:"గ్రహమైత్రి", about:"మానసిక స్నేహం — రాశ్యాధిపతుల మైత్రి.", good:"మిత్ర గ్రహాలు — ఆలోచనలు కలవడం, స్నేహం.", bad:"శత్రు గ్రహాలు — అభిప్రాయ భేదాలు, ఆర్థిక విషయాల్లో ఘర్షణ." },
  { key:"p6", max:6, name:"గణకూటం", about:"స్వభావం — దేవ, మనుష్య, రాక్షస గణ పోలిక.", good:"ఒకే గణం — స్వభావం కలవడం, ఇంట్లో శాంతి.", bad:"విరుద్ధ గణాలు — కోపం, జీవనశైలి తేడాలు." },
  { key:"p7", max:7, name:"రాశికూటం", about:"కుటుంబ/సంతాన అనుకూలత — రాశుల తత్వ పోలిక (చర/స్థిర/ద్విస్వభావ).", good:"రాశి కలిస్తే సంతానం, కుటుంబ వృద్ధి శుభం.", bad:"6-8 రాశి సంబంధం — దూరం, అపార్థాలు." },
  { key:"p8", max:8, name:"నాడి కూటం", about:"సంతాన ఆరోగ్యం — ఆది/మధ్య/అంత్య నాడి. 0 వస్తే నాడి దోషం.", good:"వేరు నాడులు — సంతాన ఆరోగ్యానికి మంచిదని సంప్రదాయం.", bad:"0/8 నాడి దోషం — పరిహార పూజలు/శాంతి సూచిస్తారు; మిగతా కూటములు బాగుంటే సర్దుబాటు చెబుతారు." },
];

function qs(name){ return new URLSearchParams(location.search).get(name); }

async function init(){
  const g = +qs("g"), b = +qs("b");
  const gn = qs("gn")||"", bn = qs("bn")||"";
  if(!g||!b){ document.getElementById("score-line").textContent="లింక్ తప్పు — హోమ్ నుండి మళ్లీ ప్రయత్నించండి."; return; }
  const SQL = await initSqlJs({ locateFile:f=>`vendor/${f}`});
  const buf = await (await fetch("data/telungu_thirumanam.db")).arrayBuffer();
  const db = new SQL.Database(new Uint8Array(buf));
  const get = (sql, p)=>{ const s=db.prepare(sql); s.bind(p); const r=s.step()?s.getAsObject():null; s.free(); return r; };
  const nid = `${g}.${b}`;
  const girl = get("SELECT * FROM girl WHERE nid=?",[nid]);
  const boy  = get("SELECT * FROM boy WHERE nid=?",[nid]);
  const mp   = get("SELECT mark, match FROM matching_point WHERE nid=?",[nid]);
  const rsG = get("SELECT rasi, star FROM rasi_star WHERE id=?",[g]);
  const rsB = get("SELECT rasi, star FROM rasi_star WHERE id=?",[b]);
  if(!girl||!boy||!mp){ document.getElementById("score-line").textContent="డేటా దొరకలేదు"; return; }
  const parts = mp.mark.split(",");
  const total = parts.pop();
  const pts = parts.map(s=>{ const [a,m]=s.split("/").map(Number); return {pts:a,max:m}; });
  const [tot, maxTot] = total.split("/").map(Number);
  const color = tot/maxTot>=0.69?"#059669":tot/maxTot>=0.5?"#d97706":"#dc2626";

  const bp = girl.Padamu==="1,2,3,4"?"":` (${girl.Padamu} పాదం)`;
  const gp = boy.Padamu==="1,2,3,4"?"":` (${boy.Padamu} పాదం)`;
  const pair = `వధువు: ${gn?gn+" · ":""}${girl.Raasi} - ${girl.Naksatram.replace(/\u200d/g,"")}${bp} · వరుడు: ${bn?bn+" · ":""}${boy.Raasi} - ${boy.Naksatram.replace(/\u200d/g,"")}${gp}`;
  document.getElementById("pair-tag").textContent = pair;
  document.getElementById("score-line").innerHTML = `<span style="color:${color}">${tot}/${maxTot}</span> — ${mp.match}`;
  document.getElementById("verdict-line").textContent = pair;

  const wrap = document.getElementById("explain-list");
  wrap.innerHTML="";
  KOOTAS.forEach((k,i)=>{
    const p = pts[i];
    const cls = p.pts===p.max?"good":p.pts>0?"neutral":"bad";
    const col = cls==="good"?"#059669":cls==="neutral"?"#d97706":"#dc2626";
    const verdict = p.pts===p.max?"అనుకూలంగా ఉన్నది":p.pts>0?"సామాన్యంగా ఉన్నది":"అనుకూలంగా లేదు";
    const effect = p.pts===p.max? k.good : p.pts>0? "పాక్షికంగా కలిసింది — కొంత సర్దుబాటుతో సరిపోతుంది. "+k.good : k.bad;
    const div = document.createElement("div");
    div.style.cssText="padding:16px 18px;border-bottom:1px solid #f3f4f6";
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div style="font-weight:800;color:#111827">${i+1}. ${k.name} <span style="font-weight:600;color:#9ca3af;font-size:0.8rem">(${p.pts}/${p.max})</span></div>
        <span style="font-weight:800;color:${col}">${verdict}</span>
      </div>
      <div style="margin-top:4px;color:#6b7280;font-size:0.85rem">${girl[k.key]} · ${boy[k.key]}</div>
      <div style="margin-top:6px;color:#374151;font-size:0.92rem"><strong>ఏమిటి:</strong> ${k.about}</div>
      <div style="margin-top:4px;color:#374151;font-size:0.92rem"><strong>ప్రభావం:</strong> ${effect}</div>
      <div style="margin-top:8px;height:7px;background:#f3f4f6;border-radius:99px;overflow:hidden"><div style="height:100%;width:${(p.pts/p.max*100)}%;background:${col};border-radius:99px"></div></div>
    `;
    wrap.appendChild(div);
  });

  const overall = tot>=33?"ఉత్తమ పొంతన — 8 కూటముల్లో దాదాపు అన్నీ కలిశాయి. వివాహానికి చాలా అనుకూలం.":tot>=24?"మంచి పొంతన — చాలా కూటములు అనుకూలం. సాధారణంగా పెళ్లికి అనుకూలంగా చెబుతారు.":tot>=18?"సామాన్య పొంతన — కొన్ని కూటములు తక్కువ. సర్దుబాటు, పరిహారాలు, జాతక చక్ర పరిశీలన తర్వాత నిర్ణయం.":"తక్కువ పొంతన — చాలా కూటములు కలవలేదు. దోష పరిహారాలు, మరో జాతక పరిశీలన, కుటుంబ పెద్దల సలహా అవసరం.";
  document.getElementById("overall-text").textContent = overall + ` (మొత్తం ${tot}/${maxTot})`;
}
init();
