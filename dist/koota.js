/* koota.js — rule-based Ashta-koota (36 guna) matching, reproducing onlinejyotish.com Star Match
 * (raw scores), plus separate dosha-parihara notes that never change the raw score.
 * No data tables per pair: everything is computed from per-nakshatra / per-rasi attributes below.
 * Browser: window.Koota.match(girlId, boyId[, {gPada, bPada}]), Koota.combo(id). Node: require('./koota.js').
 * Combo ids 1..36 = rasi/nakshatra-pada segments in zodiac order (same ids as rashi.js comboIdForLon).
 */
(function () {
  "use strict";

  var RASI = ["మేషం", "వృషభం", "మిథునం", "కర్కాటకం", "సింహం", "కన్య", "తుల", "వృశ్చికం", "ధనుస్సు", "మకరం", "కుంభం", "మీనం"];
  var NAK = ["అశ్విని", "భరణి", "కృత్తిక", "రోహిణి", "మృగశిర", "ఆరుద్ర", "పునర్వసు", "పుష్యమి", "ఆశ్లేష", "మఖ", "పుబ్బ", "ఉత్తర",
    "హస్తా", "చిత్తా", "స్వాతి", "విశాఖ", "అనురాధ", "జ్యేష్ట", "మూల", "పూర్వషాఢ", "ఉత్తరాషాఢ", "శ్రవణం", "ధనిష్టా",
    "శతభిషం", "పూర్వభాద్ర", "ఉత్తరాభాద్ర", "రేవతి"];

  // ---- per-rasi attributes
  var BR = "బ్రాహ్మణ", KS = "క్షత్రియ", VA = "వైశ్య", SH = "శూద్ర";
  // Varna: fire=Kshatriya, water=Brahmana, earth=Shudra, air=Vaishya (Telugu-blog mapping; North-Indian
  // tables swap earth/air). Matches onlinejyotish.com on all checked pairs.
  var VARNA = [KS, SH, VA, BR, KS, SH, VA, BR, KS, SH, VA, BR];
  var VARNA_RANK = {}; VARNA_RANK[SH] = 0; VARNA_RANK[VA] = 1; VARNA_RANK[KS] = 2; VARNA_RANK[BR] = 3;

  var CH = "చతుష్పాద", MA = "మానవ", JA = "జలచర", VN = "వనచర", KE = "కీటక";
  // Vashya group by whole rasi, as onlinejyotish.com does: Dhanu = manava, Makara = jalachara.
  // Longitude-based tables split Dhanu/Makara at 15 degrees; a combo id carries no longitude.
  var VASHYA = [CH, CH, MA, JA, VN, MA, MA, KE, MA, JA, MA, JA];

  var MARS = "కుజ", VEN = "శుక్ర", MER = "బుధ", MOON = "చంద్ర", SUN = "రవి", JUP = "గురు", SAT = "శని";
  var LORD = [MARS, VEN, MER, MOON, SUN, MER, VEN, MARS, JUP, SAT, SAT, JUP];
  // Naisargika (natural) friendship: [friends, neutrals]; anything else is an enemy.
  var FRIEND = {};
  FRIEND[SUN] = [[MOON, MARS, JUP], [MER]];
  FRIEND[MOON] = [[SUN, MER], [MARS, JUP, VEN, SAT]];
  FRIEND[MARS] = [[SUN, MOON, JUP], [VEN, SAT]];
  FRIEND[MER] = [[SUN, VEN], [MARS, JUP, SAT]];
  FRIEND[JUP] = [[SUN, MOON, MARS], [SAT]];
  FRIEND[VEN] = [[MER, SAT], [MARS, JUP]];
  FRIEND[SAT] = [[MER, VEN], [JUP]];
  var REL_TEL = { F: "మిత్ర", N: "సమ", E: "శత్రు" };

  // ---- per-nakshatra attributes (index = NAK index)
  var D = "దేవ", M = "మనుష్య", R = "రాక్షస";
  var GANA = [D, M, R, M, D, M, D, D, R, R, M, M, D, R, D, R, D, R, R, M, M, D, R, R, M, M, D];
  var HORSE = "గుర్రం", ELE = "గజము", GOAT = "మేక", SNAKE = "పాము", DOG = "కుక్క", CAT = "పిల్లి", RAT = "ఎలుక",
    COW = "ఆవు", BUF = "దున్న", TIGER = "పులి", DEER = "లేడి", MONK = "కోతి", MONG = "ముంగీస", LION = "సింహము";
  var YONI = [HORSE, ELE, GOAT, SNAKE, SNAKE, DOG, CAT, GOAT, CAT, RAT, RAT, COW, BUF, TIGER, BUF, TIGER, DEER, DEER,
    DOG, MONK, MONG, MONK, LION, HORSE, LION, COW, ELE];
  var ADI = "ఆది", MAD = "మధ్య", ANT = "అంత్య";
  var NADI = [ADI, MAD, ANT, ANT, MAD, ADI, ADI, MAD, ANT, ANT, MAD, ADI, ADI, MAD, ANT, ANT, MAD, ADI, ADI, MAD, ANT,
    ANT, MAD, ADI, ADI, MAD, ANT];

  // Standard 14-animal yoni table (0 = enemy .. 4 = same animal); symmetric.
  var YONI_ORDER = [HORSE, ELE, GOAT, SNAKE, DOG, CAT, RAT, COW, BUF, TIGER, DEER, MONK, MONG, LION];
  var YONI_TABLE = [
    [4, 2, 2, 3, 2, 2, 2, 1, 0, 1, 3, 3, 2, 1],
    [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 0],
    [2, 3, 4, 2, 1, 2, 1, 3, 3, 1, 2, 0, 3, 1],
    [3, 3, 2, 4, 2, 1, 1, 1, 1, 2, 2, 2, 0, 2],
    [2, 2, 1, 2, 4, 2, 1, 2, 2, 1, 0, 2, 1, 1],
    [2, 2, 2, 1, 2, 4, 0, 2, 2, 1, 3, 3, 2, 1],
    [2, 2, 1, 1, 1, 0, 4, 2, 2, 2, 2, 2, 1, 2],
    [1, 2, 3, 1, 2, 2, 2, 4, 3, 0, 3, 2, 2, 1],
    [0, 3, 3, 1, 2, 2, 2, 3, 4, 1, 2, 2, 2, 1],
    [1, 1, 1, 2, 1, 1, 2, 0, 1, 4, 1, 1, 2, 1],
    [3, 2, 2, 2, 0, 3, 2, 3, 2, 1, 4, 2, 2, 1],
    [3, 3, 0, 2, 2, 3, 2, 2, 2, 1, 2, 4, 3, 2],
    [2, 2, 3, 0, 1, 2, 1, 2, 2, 2, 2, 3, 4, 2],
    [1, 0, 1, 2, 1, 1, 2, 1, 1, 1, 1, 2, 2, 4]];

  // Vashya points, rows = bride group, cols = groom group, order CH MA JA VN KE.
  // Source: saravali.github.io/astrology/koota_vashya.html (Maitreya table, "Bride" rows).
  var VASHYA_ORDER = [CH, MA, JA, VN, KE];
  var VASHYA_TABLE = [
    [2, 0, 0, 0.5, 0],
    [1, 2, 1, 0.5, 1],
    [0.5, 1, 2, 1, 1],
    [0, 0, 0, 2, 0],
    [1, 1, 1, 0, 2]];
  // Gana points, rows = bride, cols = groom, order D M R (manushya bride + deva groom = 5).
  // Source: saravali.github.io/astrology/koota_gana.html; same as PyJHora gana_array.
  var GANA_ORDER = [D, M, R];
  var GANA_TABLE = [[6, 6, 0], [5, 6, 0], [1, 0, 6]];

  var TARA = ["జన్మతార", "సంపత్తార", "విపత్తార", "క్షేమతార", "ప్రత్యక్తార", "సాధనతార", "నైధనతార", "మిత్రతార", "పరమమిత్రతార"];

  var KOOTAS = [
    ["varna", "వర్ణకూటము", 1], ["vashya", "వశ్య కూటము", 2], ["tara", "తారాకూటము", 3], ["yoni", "యోనికూటము", 4],
    ["graha_maitri", "గ్రహమైత్రి", 5], ["gana", "గణకూటం", 6], ["bhakoot", "రాశికూటం", 7], ["nadi", "నాడి కూటం", 8]];

  // ---- 36 combos: 108 padas, cut at every rasi (9 padas) and nakshatra (4 padas) boundary.
  var COMBOS = [null];
  for (var r = 0; r < 12; r++) {
    for (var p = r * 9; p < r * 9 + 9;) {
      var n = Math.floor(p / 4), end = Math.min(n * 4 + 4, r * 9 + 9), padas = [];
      for (var x = p; x < end; x++) padas.push(x % 4 + 1);
      COMBOS.push({ r: r, n: n, padas: padas.join(","), p0: p, pe: end });
      p = end;
    }
  }

  function bhDist(g, b) { return (b.r - g.r + 12) % 12 + 1; }
  function rel(a, b) {
    return FRIEND[a][0].indexOf(b) >= 0 ? "F" : FRIEND[a][1].indexOf(b) >= 0 ? "N" : "E";
  }
  // 1..9: count from star a to star b, folded into the 9-tara cycle.
  function taraIdx(a, b) { return ((b - a + 27) % 27) % 9 + 1; }

  function get(id) {
    var c = COMBOS[id];
    if (!c || id < 1) throw new Error("combo id must be 1..36: " + id);
    return c;
  }

  function combo(id) {
    var c = get(id);
    return {
      id: id, rasi: RASI[c.r], nakshatra: NAK[c.n], padas: c.padas,
      varna: VARNA[c.r], vashya: VASHYA[c.r], yoni: YONI[c.n], lord: LORD[c.r],
      gana: GANA[c.n], nadi: NADI[c.n]
    };
  }

  // Each scorer gets (girl combo, boy combo) and returns [girlLabel, boyLabel, score].
  var SCORE = {
    // 1 if the boy's varna is equal or higher than the girl's.
    varna: function (g, b) {
      return [VARNA[g.r], VARNA[b.r], VARNA_RANK[VARNA[b.r]] >= VARNA_RANK[VARNA[g.r]] ? 1 : 0];
    },
    // Fractional bride x groom table above (0 / 0.5 / 1 / 2).
    vashya: function (g, b) {
      var a = VASHYA[g.r], c = VASHYA[b.r];
      return [a, c, VASHYA_TABLE[VASHYA_ORDER.indexOf(a)][VASHYA_ORDER.indexOf(c)]];
    },
    // Taras counted both ways; each direction that is not vipat/pratyak/naidhana (3, 5, 7) gives 1.5,
    // so 3 / 1.5 / 0. Source: saravali.github.io/astrology/koota_dina.html, PyJHora.
    tara: function (g, b) {
      var t1 = taraIdx(g.n, b.n), t2 = taraIdx(b.n, g.n), bad = [3, 5, 7];
      var s = (bad.indexOf(t1) < 0 ? 1.5 : 0) + (bad.indexOf(t2) < 0 ? 1.5 : 0);
      return [TARA[t1 - 1], TARA[t2 - 1], s];
    },
    yoni: function (g, b) {
      var a = YONI[g.n], c = YONI[b.n];
      return [a, c, YONI_TABLE[YONI_ORDER.indexOf(a)][YONI_ORDER.indexOf(c)]];
    },
    // Label = own lord (its relation towards the partner's lord). Same lord or mutual friends 5,
    // friend+neutral 4, both neutral 3, friend+enemy 2, neutral+enemy 1, mutual enemies 0
    // (onlinejyotish.com, 33 checked lord pairs).
    graha_maitri: function (g, b) {
      var la = LORD[g.r], lb = LORD[b.r];
      if (la === lb) return [la, lb, 5];
      var ra = rel(la, lb), rb = rel(lb, la), k = [ra, rb].sort().join("");
      var s = { FF: 5, FN: 4, NN: 3, EF: 2, EN: 1, EE: 0 }[k];
      return [la + "(" + REL_TEL[ra] + ")", lb + "(" + REL_TEL[rb] + ")", s];
    },
    // Directional bride x groom table above.
    gana: function (g, b) {
      var a = GANA[g.n], c = GANA[b.n];
      return [a, c, GANA_TABLE[GANA_ORDER.indexOf(a)][GANA_ORDER.indexOf(c)]];
    },
    // Rasi distance counted from the girl's rasi to the boy's; 2, 12, 9, 6, 8 are dosha. The boy 5th from
    // the girl is favourable (onlinejyotish.com, Purva Kalamritam 3.67); the boy 9th is dosha.
    bhakoot: function (g, b) {
      return [RASI[g.r], RASI[b.r], [2, 12, 9, 6, 8].indexOf(bhDist(g, b)) >= 0 ? 0 : 7];
    },
    // Same nadi = nadi dosha (0), otherwise 8.
    nadi: function (g, b) {
      return [NADI[g.n], NADI[b.n], NADI[g.n] === NADI[b.n] ? 0 : 8];
    }
  };

  // ---- Dosha parihara (cancellations). Information only: the raw score is never changed.
  // Each rule returns {reason, restored} (restored = points added in totalWithParihara) or null.
  // Rules reproduce onlinejyotish.com Star Match on 138 checked submissions (scratchpad qa/engine/oj-check.cjs).
  // Elders/astrologers decide whether a parihara applies.
  function mutualFriends(la, lb) { return la === lb || (rel(la, lb) === "F" && rel(lb, la) === "F"); }
  // Navamsha sign = absolute pada index mod 12. onlinejyotish.com uses the exact pada's navamsha, but a
  // combo spans up to 4 padas: without a known pada the rule must hold for every pada of both combos.
  function padaRange(c, pada) {
    if (pada == null) return [c.p0, c.pe];
    var x = c.n * 4 + pada - 1;
    if (x < c.p0 || x >= c.pe) throw new Error("pada " + pada + " is not in this combo (" + c.padas + ")");
    return [x, x + 1];
  }
  function amsaFriends(gr, br) {
    for (var x = gr[0]; x < gr[1]; x++)
      for (var y = br[0]; y < br[1]; y++) if (!mutualFriends(LORD[x % 12], LORD[y % 12])) return false;
    return true;
  }
  // Seven-star exception lists per nadi (onlinejyotish.com quotes the Panchangam verses).
  var NADI_OK = {};
  NADI_OK[ADI] = [0, 5, 6, 11, 18, 23, 24]; // Ashwini, Ardra, Punarvasu, U.Phalguni, Mula, Shatabhisha, P.Bhadra
  NADI_OK[MAD] = [4, 7, 10, 13, 16, 19, 22]; // Mrigasira, Pushya, P.Phalguni, Chitra, Anuradha, P.Ashadha, Dhanishta
  NADI_OK[ANT] = [2, 3, 8, 9, 15, 20, 21]; // Krittika, Rohini, Ashlesha, Magha, Vishakha, U.Ashadha, Shravana
  // Rakshasa-gana bride stars with no gana dosha (onlinejyotish.com; all 9 rakshasa stars checked).
  var GANA_OK_GIRL = [8, 13, 15, 18, 23]; // Ashlesha, Chitra, Vishakha, Mula, Shatabhisha
  var PARIHARA = {
    // Nadi dosha is cancelled for the same nakshatra (any padas), the same rasi with different
    // nakshatras, or when both stars are in their nadi's exception list.
    nadi: function (g, b, s) {
      if (s.nadi > 0) return null;
      var ok = NADI_OK[NADI[g.n]];
      var r = g.n === b.n ? "ఇద్దరిదీ ఒకే నక్షత్రం"
        : g.r === b.r ? "ఇద్దరిదీ ఒకే రాశి, వేర్వేరు నక్షత్రాలు"
        : ok.indexOf(g.n) >= 0 && ok.indexOf(b.n) >= 0 ? "ఇద్దరి నక్షత్రాలూ నాడి దోషం వర్తించని నక్షత్రాల జాబితాలో ఉన్నాయి" : null;
      return r && { reason: r, restored: 8 };
    },
    // Bhakoot dosha is cancelled when both rasi lords are the same planet or mutual friends; for
    // 2/12 and 6/8 the (raw) nadis must also differ, a nadi parihara does not count.
    bhakoot: function (g, b, s) {
      if (s.bhakoot > 0 || (bhDist(g, b) !== 9 && s.nadi === 0)) return null;
      var la = LORD[g.r], lb = LORD[b.r];
      if (!mutualFriends(la, lb)) return null;
      return { reason: la === lb ? "ఇద్దరి రాశులకూ అధిపతి ఒకే గ్రహం" : "ఇద్దరి రాశ్యధిపతులు పరస్పర మిత్రులు", restored: 7 };
    },
    // An enemy lord (score 0..2) is excused up to 5 when the rasi koota itself is clean (raw bhakoot 7).
    graha_maitri: function (g, b, s) {
      if (s.graha_maitri > 2 || s.bhakoot !== 7) return null;
      return { reason: "రాశి కూటమి (భకూట) పూర్తిగా కలిసింది", restored: 5 - s.graha_maitri };
    },
    // Gana dosha (score 0/1) is excused for the bride stars above, or when the rasi lords or the
    // navamsha lords are the same planet or mutual friends (see amsaFriends for the pada caveat).
    gana: function (g, b, s, p, o) {
      if (s.gana > 1) return null;
      var r = GANA_OK_GIRL.indexOf(g.n) >= 0 ? "వధువు నక్షత్రానికి గణ దోషం వర్తించదు"
        : mutualFriends(LORD[g.r], LORD[b.r]) ? "ఇద్దరి రాశ్యధిపతులు ఒకరే లేదా పరస్పర మిత్రులు"
        : amsaFriends(o.g, o.b) ? "ఇద్దరి నవాంశాధిపతులు ఒకరే లేదా పరస్పర మిత్రులు" : null;
      return r && { reason: r, restored: 6 - s.gana };
    }
  };

  // opts (optional): {gPada, bPada} = exact pada 1..4 of the girl/boy when known (only the gana
  // navamsha parihara depends on it). Without it that parihara needs every pada of both combos.
  function match(girlId, boyId, opts) {
    var g = get(girlId), b = get(boyId), total = 0, s = {}, op = opts || {};
    var o = { g: padaRange(g, op.gPada), b: padaRange(b, op.bPada) }; // pada ranges, validated up front
    var kootas = KOOTAS.map(function (k) {
      var v = SCORE[k[0]](g, b);
      total += v[2]; s[k[0]] = v[2];
      return { key: k[0], name: k[1], girl: v[0], boy: v[1], score: v[2], max: k[2] };
    });
    var p = {}, parihara = [], extra = 0;
    ["nadi", "bhakoot", "graha_maitri", "gana"].forEach(function (key) {
      var r = PARIHARA[key](g, b, s, p, o);
      if (!r) return;
      p[key] = r;
      parihara.push({ key: key, reason: r.reason, restored: r.restored });
      extra += r.restored;
    });
    kootas.forEach(function (k) { if (p[k.key]) k.parihara = p[k.key].reason; });
    return { kootas: kootas, total: total, max: 36, nadiDosha: s.nadi === 0, parihara: parihara,
      totalWithParihara: total + extra };
  }

  // Five score levels, no negative wording. color = AA text colour on cream/white.
  var TIERS = [
    { min: 33, key: "best", label: "ఉత్తమ పొంతన", color: "#8E1330" },
    { min: 28, key: "vgood", label: "చాలా మంచి పొంతన", color: "#047857" },
    { min: 24, key: "good", label: "మంచి పొంతన", color: "#15803d" },
    { min: 18, key: "fair", label: "సామాన్య పొంతన", color: "#b45309" },
    { min: 0, key: "advice", label: "తక్కువ పొంతన", color: "#7A4A1E" }
  ];
  function tier(total) {
    for (var i = 0; i < TIERS.length; i++) if (total >= TIERS[i].min) return TIERS[i];
  }

  var Koota = { match: match, combo: combo, tier: tier, TIERS: TIERS };
  if (typeof module !== "undefined" && module.exports) module.exports = Koota;
  if (typeof window !== "undefined") window.Koota = Koota;
})();
