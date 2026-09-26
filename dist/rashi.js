// Rashi calc from DOB - client-side, same logic as test_rasi.py (skyfield + Lahiri)
// Uses the Meeus ch. 47 moon longitude + Lahiri ayanamsa, maps to DB 36 combos via sql.js DB
const RASI_TELUGU = ["మేషం","వృషభం","మిధునం","కర్కాటకం","సింహం","కన్య","తుల","వృశ్చికం","ధనుస్సు","మకరం","కుంభం","మినం"];
const NAK_TELUGU = ["అశ్విని","భరణి","కృత్తిక","రోహిణి","మృగశిర","ఆరుద్ర","పునర్వసు","పుష్యమి","ఆశ్లేష","మఖ","పుబ్బ","ఉత్తర","హస్త","చిత్త","స్వాతి","విశాఖ","అనూరాధ","జ్యేష్ఠ","మూల","పూర్వాషాఢ","ఉత్తరాషాఢ","శ్రవణం","ధనిష్ట","శతభిషం","పూర్వాభాద్ర","ఉత్తరాభాద్ర","రేవతి"];

function lahiriAyanamsa(jd){
  const years = (jd - 2451545.0)/365.25;
  return 23.85 + years * 0.013969;
}

// Main periodic terms of the moon's longitude, Meeus "Astronomical Algorithms" ch. 47 (table 47.A):
// [D, M, M', F, coefficient in 1e-6 degrees]. Terms with M are scaled by E (E^2 for 2M).
const MOON_LON_TERMS = [
  [0,0,1,0, 6288774], [2,0,-1,0, 1274027], [2,0,0,0, 658314], [0,0,2,0, 213618],
  [0,1,0,0, -185116], [0,0,0,2, -114332], [2,0,-2,0, 58793], [2,-1,-1,0, 57066],
  [2,0,1,0, 53322], [2,-1,0,0, 45758], [0,1,-1,0, -40923], [1,0,0,0, -34720],
  [0,1,1,0, -30383], [2,0,0,-2, 15327], [0,0,1,2, -12528], [0,0,1,-2, 10980],
  [4,0,-1,0, 10675], [0,0,3,0, 10034], [4,0,-2,0, 8548], [2,1,-1,0, -7888],
  [2,1,0,0, -6766], [1,0,-1,0, -5163], [1,1,0,0, 4987], [2,-1,1,0, 4036],
];

// Moon's geocentric ecliptic longitude (tropical, mean equinox of date), Meeus ch. 47.
// jd is treated as TT (the ~1 min UT/TT difference moves the moon < 0.01°). Accurate to ~0.05°.
// Returns degrees 0-360
function moonTropicalLon(jd){
  const T = (jd - 2451545.0) / 36525; // Julian centuries from J2000
  const toRad = Math.PI/180;
  // Mean elements (degrees)
  const Lp = 218.3164477 + 481267.88123421*T - 0.0015786*T*T + T*T*T/538841 - T*T*T*T/65194000; // mean longitude
  const D  = 297.8501921 + 445267.1114034*T - 0.0018819*T*T + T*T*T/545868 - T*T*T*T/113065000;  // mean elongation
  const M  = 357.5291092 + 35999.0502909*T - 0.0001536*T*T + T*T*T/24490000;                      // sun's mean anomaly
  const Mp = 134.9633964 + 477198.8675055*T + 0.0087414*T*T + T*T*T/69699 - T*T*T*T/14712000;    // moon's mean anomaly
  const F  = 93.2720950 + 483202.0175233*T - 0.0036539*T*T - T*T*T/3526000 + T*T*T*T/863310000;  // argument of latitude
  const E = 1 - 0.002516*T - 0.0000074*T*T; // earth-orbit eccentricity factor
  let sum = 0;
  for (const [cd, cm, cmp, cf, c] of MOON_LON_TERMS) {
    const e = cm === 0 ? 1 : (Math.abs(cm) === 1 ? E : E*E);
    sum += c * e * Math.sin((cd*D + cm*M + cmp*Mp + cf*F) * toRad);
  }
  // Additive terms: Venus (A1), Jupiter (A2), flattening of the earth (L' - F)
  const A1 = 119.75 + 131.849*T, A2 = 53.09 + 479264.290*T;
  sum += 3958*Math.sin(A1*toRad) + 1962*Math.sin((Lp - F)*toRad) + 318*Math.sin(A2*toRad);
  const l = Lp + sum/1e6;
  return (l % 360 + 360) % 360;
}

// Index 0-107 of the pada (3°20' arc) holding sidLon. Rasi, nakshatra, pada and the DB combo
// are all derived from this one number, so they can never disagree at a boundary.
function padaIndex(sidLon){
  if (!Number.isFinite(sidLon)) return NaN;
  return Math.min(107, Math.max(0, Math.floor(sidLon * 108 / 360)));
}

function toRasiNak(sidLon){
  const p = padaIndex(sidLon);
  const rasiIdx = Math.floor(p/9);  // 9 padas per rasi
  const nakIdx = Math.floor(p/4);   // 4 padas per nakshatra
  const pada = p % 4 + 1;
  return {rasiIdx, rasiTel: RASI_TELUGU[rasiIdx], nakIdx, nakTel: NAK_TELUGU[nakIdx], pada, sidLon};
}

function jdFromDate(dateStr, timeStr){
  // date YYYY-MM-DD, time HH:MM AM/PM or 24h, IST -> JD UTC
  const [y,m,d] = dateStr.split("-").map(Number);
  // Parse time with AM/PM support
  let hh, mm;
  timeStr = timeStr.trim();
  const ampm = timeStr.toLowerCase().includes("pm") ? "PM" : timeStr.toLowerCase().includes("am") ? "AM" : null;
  const timeClean = timeStr.replace(/\s*(AM|PM|am|pm)/, "").trim();
  const parts = timeClean.split(":").map(Number);
  hh = parts[0]; mm = parts[1] || 0;
  if(ampm){
    if(ampm === "PM" && hh !== 12) hh += 12;
    if(ampm === "AM" && hh === 12) hh = 0;
  }
  // IST to UTC: -5h30m
  let hhUtc = hh - 5 - 30/60;
  let day = d;
  let month = m;
  let year = y;
  // Handle day overflow due to timezone (simple)
  let dt = new Date(Date.UTC(year, month-1, day, hh, mm));
  dt = new Date(dt.getTime() - (5*3600+30*60)*1000);
  // Compute JD from UTC datetime
  const Y = dt.getUTCFullYear();
  const M = dt.getUTCMonth()+1;
  const D = dt.getUTCDate() + dt.getUTCHours()/24 + dt.getUTCMinutes()/1440 + dt.getUTCSeconds()/86400;
  let A = Math.floor(Y/100);
  let B = 2 - A + Math.floor(A/4);
  let jd = Math.floor(365.25*(Y+4716)) + Math.floor(30.6001*(M+1)) + D + B - 1524.5;
  // Adjust for Jan/Feb
  if(M <= 2){ /* already handled by Date.UTC method above, but use Date method simpler */
  }
  // Simpler: use Date.UTC to get JD
  // JD = (ms since 1970)/86400000 + 2440587.5
  const ms = Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), dt.getUTCHours(), dt.getUTCMinutes(), dt.getUTCSeconds());
  const jd2 = ms/86400000 + 2440587.5;
  return jd2;
}

function getTimeStr(prefix){
  const h = document.getElementById(prefix+"-hour");
  const m = document.getElementById(prefix+"-min");
  const a = document.getElementById(prefix+"-ampm");
  if(h && m && a){
    if(!h.value || !m.value) return "";
    const hh = String(h.value).padStart(2,"0");
    const mm = String(m.value).padStart(2,"0");
    return `${hh}:${mm} ${a.value}`;
  }
  const t = document.getElementById(prefix+"-time");
  return t ? t.value.trim() : "";
}
window.getTimeStr = getTimeStr;
// The 36 DB combos (rasi_star.id 1..36) are the zodiac cut at every rasi (30°) and every
// nakshatra (13°20') boundary, in order: 12 + 27 cuts, 3 of which coincide (0°, 120°, 240°).
// Mapping the sidereal longitude straight to that segment avoids spelling differences
// between NAK_TELUGU and the DB (e.g. "అనూరాధ" vs "అనురాధ").
// Cuts are kept as exact pada indexes (rasi = every 9 padas, nakshatra = every 4), and
// comboIdForLon uses the same padaIndex() as toRasiNak(), so both always agree.
const COMBO_CUTS = (() => {
  const s = new Set();
  for (let i = 0; i < 12; i++) s.add(i * 9);
  for (let i = 0; i < 27; i++) s.add(i * 4);
  return [...s].sort((a, b) => a - b);
})();

function comboIdForLon(sidLon){
  const p = padaIndex(sidLon);
  if (COMBO_CUTS.length !== 36 || !Number.isFinite(p)) return null;
  let id = 0;
  for (let i = 0; i < COMBO_CUTS.length; i++) if (p >= COMBO_CUTS[i]) id = i + 1;
  return id || null;
}

function comboRow(id){
  const c = id && window.Koota ? window.Koota.combo(id) : null;
  return c ? { id: c.id, rasi: c.rasi, star: c.nakshatra } : null;
}

// ---------- per-person state: which input mode, and what the finder found ----------
const personState = {
  girl: { mode: "known", found: null },
  boy: { mode: "known", found: null },
};

function personCard(prefix){ return document.querySelector(`.pcard[data-person="${prefix}"]`); }

function setStatus(prefix, msg, tone){
  const el = document.getElementById(prefix + "-calc-status");
  if (!el) return;
  el.textContent = msg || "";
  el.style.color = tone === "err" ? "#8E1330" : "";
}

function setCalcLabel(btn, text){
  if (!btn) return;
  const label = btn.querySelector(".calc-label");
  if (label) label.textContent = text; else btn.textContent = text;
}

const CALC_LABEL = "రాశి-నక్షత్రం కనుగొనండి";

function setPersonMode(prefix, mode){
  const st = personState[prefix];
  const card = personCard(prefix);
  if (!st || !card || (mode !== "known" && mode !== "birth")) return;
  st.mode = mode;
  card.dataset.mode = mode;
  card.querySelectorAll(".mode-toggle button[data-mode]").forEach((b) => {
    b.setAttribute("aria-pressed", b.dataset.mode === mode ? "true" : "false");
  });
  card.querySelectorAll(".mode-panel[data-panel]").forEach((p) => {
    p.hidden = p.dataset.panel !== mode;
  });
}

function showFound(prefix){
  const st = personState[prefix];
  const btn = document.querySelector(`.calc-btn[data-for="${prefix}"]`);
  const row = document.getElementById(prefix + "-found");
  if (!row) return;
  if (st && st.found) {
    document.getElementById(prefix + "-found-main").textContent = `${st.found.rasi} · ${st.found.nak}`;
    document.getElementById(prefix + "-found-sub").textContent = `${st.found.pada}వ పాదం · మీ వివరాల నుండి`;
    row.hidden = false;
    if (btn) btn.hidden = true;
  } else {
    row.hidden = true;
    if (btn) btn.hidden = false;
  }
}

function resetFound(prefix, focusFinder){
  const st = personState[prefix];
  if (!st || !st.found) return;
  st.found = null;
  showFound(prefix);
  if (focusFinder) {
    const btn = document.querySelector(`.calc-btn[data-for="${prefix}"]`);
    if (btn) btn.focus();
  }
}

// Today as YYYY-MM-DD in the viewer's local time (the max for a birth date).
function localToday(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

const MIN_BIRTH_DATE = "1900-01-01";
const DATE_RANGE_MSG = "పుట్టిన తేదీ 1900 నుండి ఈరోజు వరకు మాత్రమే ఇవ్వండి";

// True for a real calendar date YYYY-MM-DD between 1900-01-01 and today.
function isBirthDateInRange(date){
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date || "");
  if (!m) return false;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  const t = new Date(Date.UTC(2000, mo - 1, d)); // leap year, so 02-29 passes the round-trip check
  t.setUTCFullYear(y);
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return false;
  return date >= MIN_BIRTH_DATE && date <= localToday();
}

// "12" is the one hour whose AM/PM choice is easy to get wrong: noon is సాయంత్రం, midnight ఉదయం.
function updateTwelveHint(prefix){
  const hour = document.getElementById(prefix + "-hour");
  const group = document.getElementById(prefix + "-time-group");
  if (!hour || !group) return;
  let hint = document.getElementById(prefix + "-twelve-hint");
  if (!hint) {
    hint = document.createElement("p");
    hint.id = prefix + "-twelve-hint";
    hint.className = "twelve-hint";
    hint.textContent = "మధ్యాహ్నం 12 అయితే సాయంత్రం ఎంచుకోండి · అర్ధరాత్రి 12 అయితే ఉదయం";
    hint.style.cssText = "margin:0;font:500 14px/1.5 var(--h-text, inherit);color:var(--h-muted, #5E4B3C)";
    group.insertAdjacentElement("afterend", hint);
    const ampm = document.getElementById(prefix + "-ampm");
    if (ampm) ampm.setAttribute("aria-describedby", hint.id);
  }
  hint.hidden = hour.value !== "12";
}

// Combo id the match should use for this person ("" when not known yet).
function getPersonComboId(prefix){
  const st = personState[prefix];
  if (st && st.mode === "birth") return st.found ? String(st.found.id) : "";
  const sel = document.getElementById(prefix + "-combo");
  return sel ? sel.value : "";
}

async function calcForPerson(prefix){
  const dateEl = document.getElementById(prefix+"-date");
  const sel = document.getElementById(prefix+"-combo");
  const btn = document.querySelector(`.calc-btn[data-for="${prefix}"]`);
  const st = personState[prefix];
  const date = dateEl ? dateEl.value : "";
  const time = getTimeStr(prefix);
  setStatus(prefix, "");
  if(!date || !time){
    setStatus(prefix, "దయచేసి పుట్టిన తేదీ, సమయం (గంట, నిమిషం) ఇవ్వండి", "err");
    return null;
  }
  if(!isBirthDateInRange(date)){
    setStatus(prefix, DATE_RANGE_MSG, "err");
    return null;
  }
  if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); setCalcLabel(btn, "వెతుకుతోంది…"); }
  try{
    // Birth time is taken as IST; the moon's sidereal longitude gives rasi, nakshatra and pada.
    const jd = jdFromDate(date, time);
    const trop = moonTropicalLon(jd);
    const ayan = lahiriAyanamsa(jd);
    const sid = (trop - ayan + 360) % 360;
    const {nakTel, pada} = toRasiNak(sid);
    const row = comboRow(comboIdForLon(sid));
    if(!row){
      setStatus(prefix, "రాశి-నక్షత్రం కనుగొనలేకపోయాం — 'నక్షత్రం తెలుసు' లో ఎంచుకోండి", "err");
      return null;
    }
    if (sel) {
      sel.value = String(row.id);
      sel.dispatchEvent(new Event("change"));
    }
    st.found = { id: row.id, rasi: row.rasi, nak: nakTel, pada };
    showFound(prefix);
    const change = document.querySelector(`.found-change[data-for="${prefix}"]`);
    if (change && btn && document.activeElement === btn) change.focus();
    return st.found;
  }catch(e){
    console.error(e);
    setStatus(prefix, "లెక్కలో లోపం — తేదీ, సమయం సరిచూసి మళ్ళీ ప్రయత్నించండి", "err");
    return null;
  }finally{
    if (btn) { btn.disabled = false; btn.removeAttribute("aria-busy"); setCalcLabel(btn, CALC_LABEL); }
  }
}

// Attach listeners
document.addEventListener("DOMContentLoaded", () => {
  // mode toggles: switching only shows/hides panels, so no typed data is lost
  document.querySelectorAll(".pcard[data-person]").forEach((card) => {
    const prefix = card.dataset.person;
    card.querySelectorAll(".mode-toggle button[data-mode]").forEach((b) => {
      b.addEventListener("click", () => setPersonMode(prefix, b.dataset.mode));
    });
  });
  document.querySelectorAll(".found-change").forEach((b) => {
    b.addEventListener("click", () => resetFound(b.dataset.for, true));
  });
  document.querySelectorAll(".calc-btn").forEach(btn=>{
    btn.addEventListener("click", ()=> calcForPerson(btn.dataset.for));
  });
  // A found result is stale once the birth date or time changes: back to the finder.
  ["girl","boy"].forEach(prefix=>{
    ["-date","-hour","-min","-ampm"].forEach(suffix=>{
      const el = document.getElementById(prefix+suffix);
      if (el) el.addEventListener("change", ()=> { resetFound(prefix, false); setStatus(prefix, ""); });
    });
    // Birth dates: 1900-01-01 .. today (the calc path checks this again)
    const dateEl = document.getElementById(prefix+"-date");
    if (dateEl) { dateEl.min = MIN_BIRTH_DATE; dateEl.max = localToday(); }
    const hourEl = document.getElementById(prefix+"-hour");
    if (hourEl) {
      hourEl.addEventListener("change", ()=> updateTwelveHint(prefix));
      updateTwelveHint(prefix);
    }
  });
});

// ---------- Place autocomplete (Nominatim, free, no key) ----------
function setupPlaceAutocomplete(prefix){
  const input = document.getElementById(prefix+"-place");
  if(!input) return;
  // Create suggestion box anchored to input (not whole card)
  const box = document.createElement("div");
  box.id = prefix+"-suggest";
  box.style.cssText = "position:absolute;left:0;right:0;top:calc(100% + 4px);background:#fff;border:1px solid #EADFC8;border-radius:12px;box-shadow:0 8px 24px -8px rgba(60,30,10,.2);z-index:30;max-height:220px;overflow:auto;display:none";
  // Wrap input in relative container so top:100% is just below input
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:relative";
  wrapper.className = "place-wrap";
  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);
  wrapper.appendChild(box);
  let timer=null, lastQuery="";
  input.addEventListener("input", ()=>{
    const q = input.value.trim();
    if(q.length < 3){ box.style.display="none"; return; }
    if(q === lastQuery) return;
    lastQuery = q;
    clearTimeout(timer);
    timer = setTimeout(async ()=>{
      try{
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=en&countrycodes=in`;
        const r = await fetch(url, {headers: {"Accept":"application/json"}});
        const data = await r.json();
        box.replaceChildren();
        if(!data.length){ box.style.display="none"; return; }
        data.forEach(item=>{
          const div = document.createElement("div");
          div.textContent = item.display_name.split(",").slice(0,3).join(", ");
          div.style.cssText = "display:flex;align-items:center;min-height:44px;padding:8px 12px;font-size:.9rem;color:#2A1A12;cursor:pointer;border-bottom:1px solid #F1E8D6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";
          div.addEventListener("mouseenter", ()=> div.style.background="#FBF4E6");
          div.addEventListener("mouseleave", ()=> div.style.background="#fff");
          div.addEventListener("click", ()=>{
            input.value = item.display_name.split(",")[0].trim();
            input.dataset.lat = item.lat;
            input.dataset.lon = item.lon;
            input.dataset.display = item.display_name;
            box.style.display="none";
          });
          box.appendChild(div);
        });
        box.style.display="block";
      }catch(e){ console.warn("place suggestions unavailable", e); box.style.display="none"; }
    }, 300);
  });
  document.addEventListener("click", (e)=>{
    if(!box.contains(e.target) && e.target !== input) box.style.display="none";
  });
}

// Setup for both
document.addEventListener("DOMContentLoaded", ()=>{
  setupPlaceAutocomplete("girl");
  setupPlaceAutocomplete("boy");
});

// Expose for validation / app.js
window.calcForPerson = calcForPerson;
window.setPersonMode = setPersonMode;
window.getPersonMode = (prefix) => (personState[prefix] ? personState[prefix].mode : "known");
window.getPersonComboId = getPersonComboId;
// Exact pada 1..4 found from birth details (undefined when the star was picked directly).
window.getPersonPada = (prefix) => {
  const st = personState[prefix];
  return st && st.mode === "birth" && st.found ? st.found.pada : undefined;
};
