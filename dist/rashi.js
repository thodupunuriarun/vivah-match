// Rashi calc from DOB - client-side, same logic as test_rasi.py (skyfield + Lahiri)
// Uses simple Meeus moon approximation (via SunCalc) + ayanamsa, maps to DB 36 combos via sql.js DB
const RASI_TELUGU = ["మేషం","వృషభం","మిధునం","కర్కాటకం","సింహం","కన్య","తుల","వృశ్చికం","ధనుస్సు","మకరం","కుంభం","మినం"];
const NAK_TELUGU = ["అశ్విని","భరణి","కృత్తిక","రోహిణి","మృగశిర","ఆరుద్ర","పునర్వసు","పుష్యమి","ఆశ్లేష","మఖ","పుబ్బ","ఉత్తర","హస్త","చిత్త","స్వాతి","విశాఖ","అనూరాధ","జ్యేష్ఠ","మూల","పూర్వాషాఢ","ఉత్తరాషాఢ","శ్రవణం","ధనిష్ట","శతభిషం","పూర్వాభాద్ర","ఉత్తరాభాద్ర","రేవతి"];

function lahiriAyanamsa(jd){
  const years = (jd - 2451545.0)/365.25;
  return 23.85 + years * 0.013969;
}

// Simple moon ecliptic longitude (tropical) - adapted from SunCalc / Meeus
// Returns degrees 0-360
function moonTropicalLon(jd){
  const d = jd - 2451545.0;
  // Mean elements
  const L = (218.316 + 13.176396*d) % 360; // mean longitude
  const M = (134.963 + 13.064993*d) % 360; // mean anomaly
  const F = (93.272 + 13.229350*d) % 360; // argument of latitude
  const D = (297.850 + 12.190749*d) % 360; // mean elongation
  const N = (125.044 - 0.052954*d) % 360; // longitude of ascending node
  const toRad = Math.PI/180;
  // Periodic terms (simplified, ~0.5 deg accuracy)
  let l = L
    + 6.289 * Math.sin(M*toRad)
    - 1.274 * Math.sin((2*D - M)*toRad)
    - 0.658 * Math.sin(2*D*toRad)
    - 0.214 * Math.sin(2*M*toRad)
    - 0.110 * Math.sin(D*toRad);
  // Evection etc already included partly
  // Correct for node
  // l = l - 0.16 * Math.sin(N*toRad); // small
  return (l % 360 + 360) % 360;
}

function toRasiNak(sidLon){
  const rasiIdx = Math.floor(sidLon/30);
  const nakIdx = Math.floor(sidLon/(360/27));
  const pada = Math.floor((sidLon % (360/27)) / (360/27/4)) + 1;
  return {rasiIdx, rasiTel: RASI_TELUGU[rasiIdx], nakIdx, nakTel: NAK_TELUGU[nakIdx], pada, sidLon};
}

function findDbId(rasiTel, nakTel, pada){
  if(!window.db) return null;
  try{
    const rows = window.db.exec("SELECT id, rasi, star FROM rasi_star ORDER BY id")[0].values;
    for(const [id, rasi, star] of rows){
      const cleanStar = star.replace(/\u200d/g,"");
      if(rasi.trim() === rasiTel && cleanStar.includes(nakTel)){
        if(cleanStar.includes("పాదము")){
          const nums = (cleanStar.match(/\d/g) || []);
          if(nums.includes(String(pada))) return {id, rasi, star: cleanStar};
          continue;
        } else {
          return {id, rasi, star: cleanStar};
        }
      }
    }
    for(const [id, rasi, star] of rows){
      if(rasi.trim() === rasiTel) return {id, rasi, star: star.replace(/\u200d/g,"")};
    }
  }catch(e){ console.error(e); }
  return null;
}

async function geocodePlace(place){
  if(!place || !place.trim()) return null;
  try{
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1&accept-language=en`;
    const r = await fetch(url, {headers: {"Accept":"application/json"}});
    const data = await r.json();
    if(data && data[0]) return {lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name};
  }catch(e){ console.error("geocode failed",e); }
  return null;
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
async function calcForPerson(prefix){
  const dateEl = document.getElementById(prefix+"-date");
  const placeEl = document.getElementById(prefix+"-place");
  const statusEl = document.getElementById(prefix+"-calc-status");
  const sel = document.getElementById(prefix+"-combo");
  const btn = document.querySelector(`.calc-btn[data-for="${prefix}"]`);
  const date = dateEl.value;
  const time = getTimeStr(prefix);
  const place = placeEl.value.trim();
  if(!date || !time){
    statusEl.textContent = "దయచేసి తేదీ మరియు సమయం (గంట:నిమిషం AM/PM) ఇవ్వండి";
    statusEl.style.color = "#dc2626";
    return;
  }
  if(!window.db){
    statusEl.textContent = "డేటాబేస్ నేపథ్యంలో లోడ్ అవుతోంది…";
    statusEl.style.color = "#6b7280";
    // Wait in background and retry silently
    let tries = 0;
    const wait = setInterval(()=>{
      if(window.db){
        clearInterval(wait);
        statusEl.textContent = "";
        calcForPerson(prefix);
      } else if(++tries > 10){
        clearInterval(wait);
        statusEl.textContent = "డేటాబేస్ లోడ్ ఆలస్యం — పేజీని రిఫ్రెష్ చేయండి";
        statusEl.style.color = "#dc2626";
      }
    }, 600);
    return;
  }
  btn.disabled = true;
  btn.textContent = "వెతుకుతోంది…";
  statusEl.textContent = "";
  try{
    let lat=17.385, lon=78.4867;
    if(place){
      const geo = await geocodePlace(place);
      if(geo){ lat=geo.lat; lon=geo.lon; statusEl.textContent = `📍 ${geo.display.split(",").slice(0,2).join(",")} (${lat.toFixed(2)},${lon.toFixed(2)})`; statusEl.style.color="#059669"; }
      else { statusEl.textContent = `ప్రదేశం కనుగొనలేకపోయాం, Hyderabad తో లెక్కిస్తోంది`; statusEl.style.color="#d97706"; }
    }
    // Compute moon
    const jd = jdFromDate(date, time);
    const trop = moonTropicalLon(jd);
    const ayan = lahiriAyanamsa(jd);
    const sid = (trop - ayan + 360) % 360;
    const {rasiTel, nakTel, pada} = toRasiNak(sid);
    const db = findDbId(rasiTel, nakTel, pada);
    if(db){
      sel.value = String(db.id);
      sel.dispatchEvent(new Event('change'));
      statusEl.textContent = `✓ ${rasiTel} - ${nakTel} ${pada}వ పాదం → ${db.rasi} - ${db.star} (id ${db.id})`;
      statusEl.style.color = "#059669";
    } else {
      // Fallback: try rasi only match and still select
      const fallback = findDbId(rasiTel, nakTel, pada) || (()=>{ try{ const rows=window.db.exec("SELECT id, rasi, star FROM rasi_star WHERE rasi='"+rasiTel+"' ORDER BY id")[0].values; if(rows.length) return {id: rows[0][0], rasi: rows[0][1], star: rows[0][2]}; }catch(e){} return null; })();
      if(fallback && fallback.id){
        sel.value = String(fallback.id);
        sel.dispatchEvent(new Event('change'));
        statusEl.textContent = `✓ ${rasiTel} - ${nakTel} ${pada}వ పాదం → ${fallback.rasi} - ${fallback.star} (id ${fallback.id}) — దగ్గరి మ్యాచ్`;
        statusEl.style.color = "#059669";
      } else {
        statusEl.textContent = `→ ${rasiTel} - ${nakTel} ${pada}వ పాదం (DB లో సరిగ్గా కనుగొనలేకపోయాం)`;
        statusEl.style.color = "#d97706";
      }
    }
  }catch(e){
    console.error(e);
    statusEl.textContent = "లెక్కలో లోపం: " + e.message;
    statusEl.style.color = "#dc2626";
  }finally{
    btn.disabled = false;
    btn.textContent = "రాశి కనుగొనండి ✨";
  }
}

// Attach listeners
document.addEventListener("DOMContentLoaded", () => {
  // Disable calc buttons until DB ready - background load
  document.querySelectorAll(".calc-btn").forEach(btn=>{
    btn.disabled = true;
    btn.textContent = "లోడ్ అవుతోంది…";
    btn.addEventListener("click", ()=> calcForPerson(btn.dataset.for));
  });
  const checkDb = setInterval(()=>{
    if(window.db){
      document.querySelectorAll(".calc-btn").forEach(b=>{ b.disabled=false; b.textContent="రాశి కనుగొనండి ✨"; });
      clearInterval(checkDb);
    }
  }, 400);
  // Auto calc on date/time change if both present
  ["girl","boy"].forEach(prefix=>{
    const d=document.getElementById(prefix+"-date"), h=document.getElementById(prefix+"-hour"), mi=document.getElementById(prefix+"-min"), ap=document.getElementById(prefix+"-ampm");
    if(!d) return;
    const tryAuto = ()=>{ const t=getTimeStr(prefix); if(d.value && t) { /* optional auto */ } };
    d.addEventListener("change", tryAuto);
    if(h) h.addEventListener("change", tryAuto);
    if(mi) mi.addEventListener("change", tryAuto);
    if(ap) ap.addEventListener("change", tryAuto);
  });
});

// ---------- Place autocomplete (Nominatim, free, no key) ----------
function setupPlaceAutocomplete(prefix){
  const input = document.getElementById(prefix+"-place");
  const statusEl = document.getElementById(prefix+"-calc-status");
  if(!input) return;
  // Create suggestion box anchored to input (not whole card)
  const box = document.createElement("div");
  box.id = prefix+"-suggest";
  box.style.cssText = "position:absolute;left:0;right:0;top:calc(100% + 4px);background:#fff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 8px 24px -8px rgba(17,24,39,.15);z-index:30;max-height:180px;overflow:auto;display:none";
  // Wrap input in relative container so top:100% is just below input
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:relative";
  wrapper.className = "place-wrap";
  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);
  wrapper.appendChild(box);
  let timer=null, lastQuery="";
  let selectedLat=null, selectedLon=null;
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
        box.innerHTML = "";
        if(!data.length){ box.style.display="none"; return; }
        data.forEach(item=>{
          const div = document.createElement("div");
          div.textContent = item.display_name.split(",").slice(0,3).join(", ");
          div.style.cssText = "padding:8px 10px;font-size:.84rem;color:#374151;cursor:pointer;border-bottom:1px solid #f3f4f6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";
          div.addEventListener("mouseenter", ()=> div.style.background="#fdf8ee");
          div.addEventListener("mouseleave", ()=> div.style.background="#fff");
          div.addEventListener("click", ()=>{
            input.value = item.display_name.split(",")[0].trim();
            input.dataset.lat = item.lat;
            input.dataset.lon = item.lon;
            input.dataset.display = item.display_name;
            box.style.display="none";
            if(statusEl){ statusEl.textContent = `📍 ${item.display_name.split(",").slice(0,2).join(",")} (${parseFloat(item.lat).toFixed(2)},${parseFloat(item.lon).toFixed(2)})`; statusEl.style.color="#059669"; }
          });
          box.appendChild(div);
        });
        box.style.display="block";
      }catch(e){ console.error(e); box.style.display="none"; }
    }, 300);
  });
  document.addEventListener("click", (e)=>{
    if(!box.contains(e.target) && e.target !== input) box.style.display="none";
  });
  // Store lat/lon on input dataset for calcForPerson to use
  const origGeocode = window.geocodePlace;
  // Override geocodePlace to check dataset first
  window.geocodePlace = async function(place){
    // If input has dataset lat/lon and place matches display, use it
    if(input.dataset.lat && input.dataset.lon && input.value && input.dataset.display && input.dataset.display.includes(input.value)){
      return {lat: parseFloat(input.dataset.lat), lon: parseFloat(input.dataset.lon), display: input.dataset.display};
    }
    return await origGeocode(place);
  };
}

// Setup for both
document.addEventListener("DOMContentLoaded", ()=>{
  setupPlaceAutocomplete("girl");
  setupPlaceAutocomplete("boy");
});

// Expose for validation
window.calcForPerson = calcForPerson;
window.findDbId = findDbId;
