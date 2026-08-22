const $ = (id) => document.getElementById(id);

const KOOTA_NAMES = [
  "వర్ణకూటము",
  "వశ్య కూటము",
  "తారాకూటము",
  "యోనికూటము",
  "గ్రహమైత్రి",
  "గణకూటం",
  "రాశికూటం",
  "నాడి కూటం",
];

let db = null;
let lastData = null;

function showView(id, push) {
  document.querySelectorAll(".view").forEach((v) => {
    v.classList.add("hidden");
    v.classList.remove("active");
  });
  const el = $(id);
  el.classList.remove("hidden");
  void el.offsetWidth;
  el.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (push === false) return;
  if (id === "view-result" && lastData) {
    const qs = new URLSearchParams({
      g: String(lastData.girl_id ?? $("girl-combo").value),
      b: String(lastData.boy_id ?? $("boy-combo").value),
    });
    if (lastData.girl_name) qs.set("gn", lastData.girl_name);
    if (lastData.boy_name) qs.set("bn", lastData.boy_name);
    history.pushState(null, "", "/results?" + qs.toString());
  } else if (id === "view-input") {
    if (location.pathname === "/results") history.pushState(null, "", "/");
  }
}

function restoreFromUrl() {
  const params = new URLSearchParams(location.search);
  if (!params.has("g") || !params.has("b")) return null;
  if (location.pathname !== "/results" && location.pathname !== "/" && location.pathname !== "/index.html") return null;
  return {
    g: +params.get("g"),
    b: +params.get("b"),
    gn: params.get("gn") || "",
    bn: params.get("bn") || "",
  };
}

function ratioClass(points, max) {
  if (points === max) return "good";
  if (points > 0) return "neutral";
  return "bad";
}

function scoreColor(total, maxTotal) {
  // 4-tier: bad <18 red, normal 18-23 yellow, favourable 24-32 light green, best 33-36 dark green
  if (total >= 33) return "#047857"; // best - dark green
  if (total >= 24) return "#22c55e"; // favourable - light green
  if (total >= 18) return "#eab308"; // normal - yellow/amber
  return "#dc2626"; // bad - red
}

async function init() {
  const SQL = await initSqlJs({ locateFile: (f) => `vendor/${f}` });
  const buf = await (await fetch("data/telungu_thirumanam.db")).arrayBuffer();
  db = new SQL.Database(new Uint8Array(buf));
  window.db = db; // expose for rashi.js

  const res = db.exec("SELECT id, rasi, star FROM rasi_star ORDER BY id");
  const rows = res[0].values;

  ["girl", "boy"].forEach((p) => {
    const sel = $(`${p}-combo`);
    sel.add(new Option("— రాశి-నక్షత్రం ఎంచుకోండి —", ""));
    rows.forEach(([id, rasi, star]) => {
      sel.add(new Option(`${rasi} - ${star.replace(/\u200d/g, "")}`, id));
    });
  });

  $("match-btn").addEventListener("click", () => match());
  $("back-btn").addEventListener("click", () => showView("view-input"));

  const q = restoreFromUrl();
  if (q) {
    $("girl-combo").value = String(q.g);
    $("boy-combo").value = String(q.b);
    $("girl-name").value = q.gn;
    $("boy-name").value = q.bn;
    await match(true);
  }

  window.addEventListener("popstate", () => {
    const r = restoreFromUrl();
    if (r) {
      $("girl-combo").value = String(r.g);
      $("boy-combo").value = String(r.b);
      $("girl-name").value = r.gn;
      $("boy-name").value = r.bn;
      match(true);
    } else {
      showView("view-input", false);
    }
  });
}

function queryOne(sql, params) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return row;
}

function computeMatch(girlId, boyId, girlName, boyName) {
  const g = queryOne("SELECT * FROM girl WHERE nid = ?", [`${girlId}.${boyId}`]);
  const b = queryOne("SELECT * FROM boy WHERE nid = ?", [`${girlId}.${boyId}`]);
  const mp = queryOne("SELECT mark, match FROM matching_point WHERE nid = ?", [
    `${girlId}.${boyId}`,
  ]);
  if (!g || !b || !mp) throw new Error("Lookup failed");

  const parts = mp.mark.split(",");
  const totalPart = parts[parts.length - 1];
  const [total, maxTotal] = totalPart.split("/").map(Number);
  const kootas = parts.slice(0, 8).map((seg, i) => {
    const [pts, max] = seg.split("/").map(Number);
    return {
      name: KOOTA_NAMES[i],
      girl_value: g[`p${i + 1}`],
      boy_value: b[`p${i + 1}`],
      points: pts,
      max_points: max,
    };
  });

  return {
    girl_name: girlName,
    boy_name: boyName,
    bride_rasi: g.Raasi,
    bride_nak: g.Naksatram.replace(/\u200d/g, ""),
    bride_pada: g.Padamu,
    groom_rasi: b.Raasi,
    groom_nak: b.Naksatram.replace(/\u200d/g, ""),
    groom_pada: b.Padamu,
    kootas,
    total,
    max_total: maxTotal,
    verdict: mp.match,
  };
}

async function match(skipPush) {
  const btn = $("match-btn");
  btn.disabled = true;
  btn.textContent = "పొంతన…";

  try {
    // helper for strict 12h picker
    const getTime = (prefix)=>{
      if(window.getTimeStr) return window.getTimeStr(prefix);
      const h=document.getElementById(prefix+"-hour"), m=document.getElementById(prefix+"-min"), a=document.getElementById(prefix+"-ampm");
      if(h&&m&&a) return (h.value && m.value) ? `${h.value}:${m.value} ${a.value}` : "";
      const t=document.getElementById(prefix+"-time"); return t ? t.value.trim() : "";
    };
    // If dob filled but rasi not selected, auto calc first
    for(const prefix of ["girl","boy"]){
      const dateEl = document.getElementById(prefix+"-date");
      const time = getTime(prefix);
      const sel = document.getElementById(prefix+"-combo");
      if(dateEl && dateEl.value && time && !sel.value){
        // try auto calc
        if(window.calcForPerson) await window.calcForPerson(prefix);
      }
    }
    // Validation: at least one of date/time OR rasi per person, names optional (strict HH:MM AM/PM)
    const girlOk = $("girl-combo").value || ($("girl-date").value && getTime("girl"));
    const boyOk = $("boy-combo").value || ($("boy-date").value && getTime("boy"));
    if(!girlOk){
      alert("దయచేసి వధువుకు పుట్టిన తేదీ/సమయం లేదా రాశి-నక్షత్రం ఏదో ఒకటి ఇవ్వండి");
      return;
    }
    if(!boyOk){
      alert("దయచేసి వరుడికి పుట్టిన తేదీ/సమయం లేదా రాశి-నక్షత్రం ఏదో ఒకటి ఇవ్వండి");
      return;
    }
    if(!$("girl-combo").value || !$("boy-combo").value){
      alert("రాశి లెక్కించబడలేదు — దయచేసి 'రాశి కనుగొనండి' నొక్కండి లేదా రాశి-నక్షత్రం ఎంచుకోండి");
      return;
    }
    const data = computeMatch(
      +$("girl-combo").value,
      +$("boy-combo").value,
      $("girl-name").value.trim(),
      $("boy-name").value.trim()
    );
    data.girl_id = +$("girl-combo").value;
    data.boy_id = +$("boy-combo").value;
    lastData = data;
    render(data, skipPush);
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "పొంతన చూడండి →";
  }
}

function render(d, skipPush) {
  const color = scoreColor(d.total, d.max_total);

  animateScore(d.total, d.max_total, color);

  const v = $("verdict");
  v.textContent = d.verdict;
  v.style.color = color;
  v.classList.remove("pop");
  void v.offsetWidth;
  v.classList.add("pop");

  const brideName = d.girl_name ? `${d.girl_name} · ` : "";
  const groomName = d.boy_name ? `${d.boy_name} · ` : "";
  const bp = d.bride_pada==="1,2,3,4"?"":` (${d.bride_pada} పాదం)`;
  const gp = d.groom_pada==="1,2,3,4"?"":` (${d.groom_pada} పాదం)`;
  $("pair-line").textContent = `వధువు: ${brideName}${d.bride_rasi} - ${d.bride_nak}${bp} · వరుడు: ${groomName}${d.groom_rasi} - ${d.groom_nak}${gp}`;

  const wrap = $("kootas");
  wrap.innerHTML = "";
  d.kootas.forEach((k, i) => {
    const cls = ratioClass(k.points, k.max_points);
    const div = document.createElement("div");
    div.className = "koota";

    const top = document.createElement("div");
    top.className = "k-top";

    const name = document.createElement("span");
    name.className = "k-name";
    name.textContent = k.name;

    const vals = document.createElement("span");
    vals.className = "k-vals";
    vals.textContent = `${k.girl_value} · ${k.boy_value}`;

    const pts = document.createElement("span");
    pts.className = `k-pts ${cls}`;
    pts.textContent = `${k.points}/${k.max_points}`;

    top.append(name, vals, pts);

    const bar = document.createElement("div");
    bar.className = "k-bar";
    const fill = document.createElement("div");
    fill.className = `k-fill ${cls}`;
    bar.appendChild(fill);

    div.append(top, bar);
    wrap.appendChild(div);

    setTimeout(() => {
      fill.style.width = `${(k.points / k.max_points) * 100}%`;
    }, 120 + i * 70);
  });

  $("total-pts").textContent = `${d.total}/${d.max_total}`;

  // Nadi Dosha highlight
  const nadi = d.kootas[7];
  let alertEl = document.getElementById("nadi-alert");
  if (alertEl) alertEl.remove();
  // remove previous highlight
  document.querySelectorAll(".koota.nadi-bad").forEach(el=>el.classList.remove("nadi-bad"));
  if (nadi.points === 0) {
    // highlight last koota row
    const lastKoota = wrap.lastElementChild;
    if (lastKoota) lastKoota.classList.add("nadi-bad");
    // create alert banner
    const alert = document.createElement("div");
    alert.id = "nadi-alert";
    alert.className = "nadi-alert";
    alert.innerHTML = `<div class="ico">⚠️</div><div style="flex:1"><strong style="color:#991b1b">నాడి దోషం ఉంది — 0/8</strong><div style="font-size:.86rem;color:#7f1d1d;line-height:1.6">ఒకే నాడి కావడం వల్ల ఇది వచ్చింది. పరిహారాలు, జాతక చక్ర పరిశీలన అవసరం. <a href="/nadi-dosha.html">నాడి దోషం పేజీ చూడండి →</a></div></div>`;
    // insert after total-row
    const totalRow = document.querySelector(".total-row");
    if (totalRow) totalRow.insertAdjacentElement("afterend", alert);
  }

  const adv = document.getElementById("advanced-btn");
  if (adv) {
    const qs = new URLSearchParams({ g: String(d.girl_id), b: String(d.boy_id) });
    if (d.girl_name) qs.set("gn", d.girl_name);
    if (d.boy_name) qs.set("bn", d.boy_name);
    adv.href = "/explain.html?" + qs.toString();
  }

  showView("view-result", skipPush ? false : undefined);
  setTimeout(() => {
    if (d.total >= 24 && window.celebrate) window.celebrate(d.total >= 33);
  }, 400);
}

function animateScore(total, maxTotal, color) {
  const el = $("score");
  const ring = $("ring");
  const duration = 950;
  let start = null;

  function step(ts) {
    if (!start) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const cur = Math.round(total * eased);
    el.textContent = `${cur}/${maxTotal}`;
    ring.style.background =
      `conic-gradient(${color} ${total * eased * 10}deg, #f3f4f6 ${total * eased * 10}deg)`;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function makeImage(d) {
  const font = (w, s) => `${w} ${s}px "Noto Sans Telugu", sans-serif`;
  await Promise.all([
    document.fonts.load(font(800, 54)),
    document.fonts.load(font(700, 36)),
    document.fonts.load(font(600, 30)),
    document.fonts.load(font(400, 27)),
    document.fonts.ready,
  ]);

  const W = 1080;
  const pad = 48;
  const rowH = 78;
  const H = 250 + 170 + 90 + d.kootas.length * rowH + 80 + 110 + 130;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const color = scoreColor(d.total, d.max_total);

  ctx.fillStyle = "#fafafa";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#ffffff";
  rr(ctx, 32, 32, W - 64, H - 64, 32);
  ctx.fill();
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 2;
  rr(ctx, 32, 32, W - 64, H - 64, 32);
  ctx.stroke();

  const grad = ctx.createLinearGradient(64, 64, W - 64, 214);
  grad.addColorStop(0, "#e11d48");
  grad.addColorStop(1, "#9f1239");
  ctx.fillStyle = grad;
  rr(ctx, 64, 64, W - 128, 150, 20);
  ctx.fill();

  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = font(800, 52);
  ctx.fillText("వివాహ మ్యాచింగ్", W / 2, 122);
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.font = font(400, 26);
  ctx.fillText("తెలుగు వివాహ పొంతన · 36 గుణాల పద్ధతి", W / 2, 172);

  const ringX = pad + 76;
  const ringY = 320;
  ctx.beginPath();
  ctx.arc(ringX, ringY, 62, 0, Math.PI * 2);
  ctx.strokeStyle = "#f3f4f6";
  ctx.lineWidth = 16;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ringX, ringY, 62, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (d.total / d.max_total));
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.fillStyle = "#111827";
  ctx.font = font(800, 34);
  ctx.fillText(`${d.total}/${d.max_total}`, ringX, ringY + 2);

  ctx.textAlign = "left";
  ctx.fillStyle = color;
  ctx.font = font(700, 37);
  wrapText(ctx, d.verdict, W - pad * 2 - 210).forEach((ln, i) =>
    ctx.fillText(ln, pad + 180, 288 + i * 48)
  );

  ctx.fillStyle = "#6b7280";
  ctx.font = font(400, 26);
  const brideName = d.girl_name ? `${d.girl_name} · ` : "";
  const groomName = d.boy_name ? `${d.boy_name} · ` : "";
  const bp2 = d.bride_pada==="1,2,3,4"?"":` (${d.bride_pada} పాదం)`;
  const gp2 = d.groom_pada==="1,2,3,4"?"":` (${d.groom_pada} పాదం)`;
  const pairText = `వధువు: ${brideName}${d.bride_rasi} - ${d.bride_nak}${bp2}   |   వరుడు: ${groomName}${d.groom_rasi} - ${d.groom_nak}${gp2}`;
  wrapText(ctx, pairText, W - pad * 2).forEach((ln, i) =>
    ctx.fillText(ln, pad, 420 + i * 40)
  );

  let y = 500;
  d.kootas.forEach((k) => {
    const cls = ratioClass(k.points, k.max_points);
    const c = cls === "good" ? "#059669" : cls === "neutral" ? "#d97706" : "#dc2626";

    ctx.fillStyle = "#111827";
    ctx.font = font(700, 29);
    ctx.fillText(k.name, pad, y);

    ctx.fillStyle = "#6b7280";
    ctx.font = font(400, 25);
    ctx.textAlign = "right";
    ctx.fillText(`${k.girl_value} · ${k.boy_value}`, W - pad - 90, y);

    ctx.fillStyle = c;
    ctx.font = font(800, 28);
    ctx.fillText(`${k.points}/${k.max_points}`, W - pad, y);
    ctx.textAlign = "left";

    ctx.fillStyle = "#f3f4f6";
    rr(ctx, pad, y + 22, W - pad * 2, 10, 5);
    ctx.fill();
    ctx.fillStyle = c;
    if (k.points > 0) {
      rr(ctx, pad, y + 22, (W - pad * 2) * (k.points / k.max_points), 10, 5);
      ctx.fill();
    }
    y += rowH;
  });

  y += 6;
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(W - pad, y);
  ctx.stroke();

  ctx.fillStyle = "#111827";
  ctx.font = font(800, 31);
  ctx.fillText("మొత్తం మార్కులు", pad, y + 42);
  ctx.textAlign = "right";
  ctx.fillStyle = "#9f1239";
  ctx.fillText(`${d.total}/${d.max_total}`, W - pad, y + 42);
  ctx.textAlign = "left";

  const bannerY = y + 78;
  const grad2 = ctx.createLinearGradient(pad, bannerY, W - pad, bannerY + 74);
  grad2.addColorStop(0, "#e11d48");
  grad2.addColorStop(1, "#9f1239");
  ctx.fillStyle = grad2;
  rr(ctx, pad, bannerY, W - pad * 2, 74, 16);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = font(700, 32);
  ctx.textAlign = "center";
  ctx.fillText(d.verdict, W / 2, bannerY + 38);

  ctx.fillStyle = "#9ca3af";
  ctx.font = font(400, 23);
  ctx.fillText(
    "✨ matchmyjathakam.com లో మీ పొంతన కూడా 30 సెకన్లలో చూడండి · ప్రాధమిక సమాచారం మాత్రమే",
    W / 2,
    H - 52
  );

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

function downloadBlob(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "vivaha-porutham.png";
  a.click();
  URL.revokeObjectURL(url);
}

async function shareResult() {
  if (!lastData) return;
  const btn = $("share-btn");
  btn.disabled = true;
  try {
    const blob = await makeImage(lastData);
    const file = new File([blob], "vivaha-porutham.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        const punchy = `✨ ${lastData.total}/${lastData.max_total} — ${lastData.verdict}
💖 ఈ పొంతన ఇక్కడ చూసాను — MatchMyJathakam.com లో 30 సెకన్లలో!`;
        await navigator.share({
          files: [file],
          title: "వివాహ పొంతన — Match My Jathakam",
          text: punchy,
        });
        return;
      } catch (e) {
        if (e.name === "AbortError") return;
      }
    }
    downloadBlob(blob);
  } finally {
    btn.disabled = false;
  }
}

async function downloadResult() {
  if (!lastData) return;
  const blob = await makeImage(lastData);
  downloadBlob(blob);
}



init();

$("share-btn").addEventListener("click", shareResult);
$("download-btn").addEventListener("click", downloadResult);
