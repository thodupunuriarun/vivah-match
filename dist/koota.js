/* koota.js — Ashta-koota (36 guna) matching.
 * total = TTD panchangam 2025-26 p64 guna table; the 8 koota scores come from ROWS (a per-pair blend of
 * published sources that adds up to that total); labels come from the standard tables below.
 * Dosha-parihara notes follow TTD p66 and never change the total.
 * Browser: window.Koota.match(girlId, boyId), Koota.combo(id). Node: require('./koota.js').
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
    // Rasi distance counted from the girl's rasi to the boy's; 2/12, 5/9, 6/8 are dosha
    // (TTD p66 "ద్విర్ద్వాదశే వా నవపంచమే వా షష్టాష్టకే"; ROWS agree on all 1295 pairs).
    bhakoot: function (g, b) {
      return [RASI[g.r], RASI[b.r], [2, 12, 5, 9, 6, 8].indexOf(bhDist(g, b)) >= 0 ? 0 : 7];
    },
    // Same nadi = nadi dosha (0), otherwise 8.
    nadi: function (g, b) {
      return [NADI[g.n], NADI[b.n], NADI[g.n] === NADI[b.n] ? 0 : 8];
    }
  };

  // ---- Total: TTD panchangam 2025-26 p64 "వధూవర గుణమేళన చక్రము", TTD[girl-1][boy-1], integers as
  // printed (suspected misprints kept, e.g. [21][6] = 8). TTD prints no per-koota points; see ROWS.
  var TTD = [
    [28,33,28,18,21,22,26,17,18,22,31,27,21,26,17,11,9,13,22,26,22,19,26,15,13,27,24,26,24,21,21,15,16,14,24,26],
    [34,28,29,19,22,15,18,26,26,30,23,24,21,19,28,21,19,6,14,29,22,19,17,19,20,20,27,28,26,10,10,20,24,22,16,28],
    [27,27,28,17,9,15,19,20,21,25,26,23,17,21,22,15,15,18,27,15,19,16,20,26,24,19,14,15,10,25,25,27,19,17,19,11],
    [18,18,19,28,19,25,16,17,18,22,23,20,19,23,24,21,21,23,22,10,14,21,25,31,20,13,9,14,10,23,29,31,23,20,22,14],
    [23,23,10,19,28,36,27,23,23,27,26,13,12,26,28,25,26,20,19,15,9,16,30,24,14,20,11,17,18,20,26,24,30,27,26,19],
    [22,13,15,27,34,28,20,25,23,26,19,22,21,17,25,23,27,13,10,25,17,23,22,25,15,11,18,21,24,13,19,27,29,26,17,27],
    [27,18,21,18,25,20,28,33,31,19,10,15,24,20,28,30,34,21,14,27,19,14,11,13,23,18,24,20,25,12,13,21,23,27,17,27],
    [19,27,21,18,24,26,34,28,25,13,20,13,23,29,22,24,24,27,20,27,20,13,17,4,16,27,27,22,22,17,18,11,13,19,27,27],
    [19,26,22,19,23,24,32,24,28,16,23,16,22,27,21,23,24,25,18,27,21,13,20,5,13,26,27,27,23,17,18,11,17,19,27,28],
    [21,28,23,20,24,25,19,10,14,28,35,28,15,20,14,18,18,20,20,27,20,19,26,10,8,20,21,28,27,21,12,7,11,17,25,25],
    [30,21,26,23,24,17,10,18,21,35,28,30,18,14,23,26,27,12,11,26,21,20,19,22,17,11,22,26,25,13,4,14,18,24,18,27],
    [25,23,22,19,12,21,13,12,15,28,28,28,15,15,17,20,20,26,25,11,16,15,20,26,22,16,8,12,13,27,18,18,12,18,20,12],
    [21,21,17,18,11,19,22,22,21,16,18,16,28,30,26,16,16,22,25,11,17,24,26,34,24,21,11,5,4,18,24,25,18,17,18,12],
    [27,19,21,22,25,17,20,28,27,22,16,16,30,28,34,24,22,8,11,25,19,26,24,24,19,19,27,21,18,4,11,19,24,23,16,24],
    [18,27,22,23,27,25,28,21,21,16,25,18,26,34,28,18,16,14,17,26,17,24,32,19,10,27,28,22,20,11,18,12,16,15,26,24],
    [13,21,16,21,25,23,30,23,23,19,28,21,17,25,19,28,25,24,16,25,16,18,27,13,15,28,29,26,25,16,16,10,14,18,29,27],
    [11,20,16,21,26,26,33,23,23,19,28,21,17,22,17,26,28,27,19,26,17,19,26,12,14,26,27,23,24,19,19,7,14,19,27,27],
    [13,6,19,25,20,12,19,26,24,20,12,26,23,9,15,24,27,28,20,19,26,28,11,25,28,13,21,17,19,18,18,24,18,22,11,21],
    [22,15,28,23,20,12,13,20,18,20,12,26,25,10,17,17,20,21,28,27,34,24,7,21,28,13,21,25,27,26,20,26,20,15,4,13],
    [27,29,17,12,16,27,27,26,26,28,28,15,13,25,25,25,27,21,28,28,20,10,23,18,23,26,18,22,23,27,21,20,25,19,20,13],
    [22,22,20,15,10,8,19,21,21,22,21,19,17,19,18,17,18,27,34,18,28,18,17,21,28,21,13,17,17,32,26,26,22,16,13,5],
    [16,16,14,19,14,22,13,14,14,19,18,15,21,23,21,18,19,28,23,8,17,28,27,31,23,17,9,12,12,27,27,26,22,21,18,9],
    [24,14,19,24,27,20,11,16,21,26,18,21,24,20,29,26,27,12,7,22,17,28,28,31,16,14,22,25,26,12,12,22,24,24,18,27],
    [12,18,24,29,22,22,13,3,6,10,20,26,31,23,16,13,12,25,20,17,20,31,30,28,15,17,17,20,20,25,25,18,11,9,21,21],
    [12,20,24,19,13,14,21,15,12,8,17,24,25,19,9,13,13,27,27,21,27,24,26,16,28,27,25,15,15,21,25,21,11,17,25,27],
    [27,20,19,13,20,12,18,26,26,23,13,17,21,19,27,27,26,11,11,26,19,18,18,19,27,28,34,24,23,8,15,22,29,32,23,32],
    [25,27,14,8,11,18,24,26,26,23,24,9,11,27,28,28,27,20,20,19,12,11,25,19,25,34,28,18,15,15,22,22,28,31,32,23],
    [28,29,16,14,17,22,20,22,22,27,28,13,6,22,23,26,25,17,24,23,16,14,28,22,16,25,19,28,25,25,17,17,23,30,32,23],
    [27,26,13,10,17,26,23,21,23,28,26,15,17,18,20,23,25,18,25,23,16,14,28,23,17,25,15,24,28,30,20,18,23,32,31,24],
    [20,10,26,23,20,12,8,17,17,22,13,28,18,5,12,16,18,16,24,26,30,28,14,28,21,9,16,25,21,28,18,23,21,26,15,22],
    [20,11,26,30,27,19,10,19,19,14,5,20,25,11,19,17,21,18,19,22,25,28,12,26,29,16,13,18,21,20,28,33,28,18,7,14],
    [15,21,28,32,25,25,18,10,10,7,15,20,26,20,13,11,8,26,26,19,26,26,21,19,22,23,23,18,18,25,33,28,19,9,17,16],
    [18,25,20,24,31,31,24,17,17,13,20,14,19,25,17,15,17,18,19,28,21,21,27,12,15,30,29,24,25,20,27,19,28,18,23,20],
    [14,21,16,19,26,26,25,18,18,18,25,18,16,22,14,16,18,19,12,20,14,21,27,11,15,31,30,28,30,25,17,7,16,28,33,30],
    [24,15,18,21,25,17,16,25,27,26,19,20,17,15,25,27,26,9,3,19,12,19,20,22,24,22,31,29,29,14,6,16,21,33,28,34],
    [25,24,11,14,17,26,25,24,25,24,27,13,12,22,22,24,26,20,13,11,5,12,27,22,27,30,21,19,22,22,14,16,18,29,33,28]
  ];

  // ---- Per-koota scores, ROWS[girl-1] = 36 pairs x 8 chars (varna..nadi), each char = points x 2 in
  // base 36 ("3" = 1.5, "g" = 8). Built per pair from published tables (PyJHora, prisri, astrosage,
  // astroyogi, kiran, nithra, this engine's standard tables): the most common value per koota, changed
  // as little as possible so the 8 add up to the TTD total, every value one of the standard ashtakoota
  // values (graha maitri may be 0.5), nadi and bhakoot always the standard ones. So the same attribute
  // pair (e.g. deva + manushya gana) can score differently in different pairs.
  // "........" = no fit: girl 31 (ధనిష్ట 3-4) x boy 27 (ఉత్తరాషాఢ 1), TTD prints 13 but its rasi 7 +
  // nadi 8 already make 15. That pair shows the standard rows (24.5) and results note the difference.
  var ROWS = [
    "2468ace02464aaeg0464a2eg0264620g04066a0g01366c0g02341ceg02341ae002341ce022068ce02134aceg226482eg2066a20g2066ac0g2136ac0002341c0002301c000232120g013262eg01306ceg013262eg2206a20g2138ac0g2466a2002264a2002466aa0g2134ac0g04341aeg00321ceg023412eg023412eg023812e002321ae02202ac002134ac0g2264ac0g",
    "2464aceg2468ace02466a0eg0466600g01366c0g04068c0002361ae002341ceg02341ceg21348ceg2206ace0213480eg2066a20g2068ac002268ac0g02642c0g02361a0g02361000013262e001366ceg013460eg2262a00g2406ac002134a20g2264a00g2466ac002464ac0g04640ceg02361aeg023010e0023010e0023410eg02301ceg2130ac0g2206ac002268ac0g",
    "2136a2eg2066a0eg2468ace002686c00046260000434120g023210eg023212eg023412eg213482eg220882eg2134ace02136ac002066a20g2466a00g0166100g0166100g02321c0g01326ceg020662e001326ce02134ac002136a20g2264ac0g2134ac0g2460a00g2466a000046600e0006000e002321ceg02321ceg02361ceg023210eg2132a00g2136a00g2206a200",
    "2134820g2066600g24686c002468ace02462a0e00134a2eg0132a00g2132a00g0134a20g223412eg223810eg22361ce021360ce0206602eg246600eg2266a00g2266a00g2132ac0g0132ac0g0206a2000132ac0021328ce0213482eg2404aceg22341c0g2260000g246420002466a0002260a0002132ac0g0132aceg2134aceg0132a0eg223210eg223610eg223610e0",
    "24066c0g21366c0g246260002462a0e02468ace02468aceg2268aa0g0134ac0g2132ac0g22341ceg22341aeg223212e0213202e021340ceg20660ceg2262ac0g2264ac0g2264a00g0264a00g2132ac000134a000240462e022646aeg213462eg2234100g22341c0g22600c002460ac002264ac002264a00g0264a0eg0134a0eg0134aceg22341ceg22321ceg22361ae0",
    "24361c0g24046a000434120g2136a2eg2068aceg2468ace02268ac000264ac0g2132ac0g22321ceg22341ce0223412eg213402eg21320ce021320ceg2132ac0g2266ac0g2264a2000262a0002262ac0g0134a00g220462eg24066ce0213482eg2234120g20341c0024301a0g0130ac0g2062ac0g2264a2000264a2e00266a0eg0134aaeg22341aeg22321ae022341ceg",
    "22341ceg21061ce0223410eg0134a20g2208ac0g2268ac002468ace02464aaeg2134aceg21322c0g20042c002134220g213282eg20048ce021328aeg2132aceg2464aceg2464a2e02464a2002464ac0g2134a20g2034120g20341c002034100g243412eg21340ce021300ceg01308c0g22648c0g22648200246482002466800g21348c0g22341ceg20321ce020361ceg",
    "22341ce022341ceg223212eg2132a20g2134ac0g2264ac0g2464aceg2468ace02464aae020642c0021362a0g2006200g213280eg21328ceg21348ce02136ace00464aae02462a0eg2462a00g2464ac0g2462a00g2062000g22301a0g22301000243810e022341ceg24321ceg21328c0g21348a0g0262800g0462800g046480002464820020622ce020361ceg20361ceg",
    "22341ce022341aeg223412eg2134a20g2132ac0g2134ac0g0462aceg2462aae02468ace022682c0020646c0g2138200g213080eg21308aeg21348ae02134ace02136ace02132a2eg2132a20g2464ac0g2462a20g2062000g20640c0g20321200240402e024321aeg24341aeg22688c0g22068c0g2132820g2132a20g2064820024628c0020622ce020640ceg20381ceg",
    "01348ce001348aeg013480eg023410eg02321aeg02321ceg01342c0g00622a0000682c002468ace02466aceg2138a2eg0200a20g0200ac0g0204ac0001342ce001342ce0013222eg003412eg00642ceg006220eg2262820g22668c0g213680000006820001328a0g01348a0g04361ceg04341ceg043212eg0032120g0064220000622c0024628c0024648a0g04648c0g",
    "01368ceg02068ce0013882eg023812eg02321aeg02321ce002042c0001322c0g02642c0g2466aceg2468ace02466a2eg0134a20g0402ac000206ac0g01362aeg01362ceg013222e0003212e000361ceg006222eg2462820g22688c002466820g0134820g02008c0001368a0g02361aeg04301ceg043212e0003212000036120g00620c0g24628a0g24668a0024668c0g",
    "026480eg013480eg01368ce002046ce0023212e0023412eg0132220g0004220g0138200g2138a2eg2464a0eg2468ace00260ac000130a00g0404a00g013420eg013420eg01342ceg00341ceg003410e000321ce02132ac002266800g22668c0g00628c0g0134800g01348000023410e0043410e004341ceg00341c0g00341c0g0034100g0462800g2464800g24648000",
    "2066a20g2066a20g2136ac0001360ce0013202e0013202eg013082eg013280eg013062eg2200a20g2132a20g2260ac002468ace02468a0eg2134a2eg0134800g0006820g01348c0g00341ceg003212e000341ce02064ace02134a2eg2266aceg2062ac0g2066a20g2136a000013600000134000001340c0g00321ceg00341ceg000600eg2204a00g2134a00g2064a200",
    "2068ac0g2266ac002066a20g006602eg01340ceg01360ae000068ce001328ceg00608aeg2060aa0g2406aa002130a00g2468a0eg2468ace02464aceg00668c0g00648a0g00068200000602e000640aeg003410eg2064a0eg2138aae00134a0eg2062a20g2068ac002068ac0g00626c0g01340c0g01340000000602e0003410eg00321ceg0134ac0g2404ac002064aa0g",
    "2068aa002068ac0g2466a00g046600eg00660ceg01360aeg00628aeg01348ce000648ae02064aa002066aa0g2404a00g2134a2eg2464aceg2468ace00068ac0000668c000130800g003010eg00660aeg003010eg2060a0eg2066aaeg2066a0e02134a0002068ac0g2268ac0g00646c0g04640a0g0132000g003210eg003610e000321ce02132ac002138ac0g2404ac0g",
    "22381a0021641c0g2166100g2266a00g2262ac0g2132ac0g0262aaeg2404ace00264aae021342ce021362ceg213420eg2134800g20668c0g2068ac002468ace02464aae02130a2eg0130a20g2406ac0g0130a20g203010eg22361aeg203610e0243412e021641ceg24640ceg2264ac0g22648c0g2132800g0132820g240680000132ac0020341ce022381ceg22341ceg",
    "22006c0022361a0g2166100g2266a00g2264ac0g2264ac0g2462aceg0136ace02404ace021342ce021362ceg213420eg2006820g21348a0g20668c002466aae02468ace02462a0eg0462a00g2138ac0g0402a20g203210eg20341ceg203410e0243410e021340ceg21641aeg22628a0g20648c0g2262820g0462820g0130820024028c0020361ce020361ceg20361ceg",
    "2232100g2232120022321c0g2136ac0g2264a00g2264a0000464a0e00462a0eg0132a2eg213220eg200422e021322ceg21348c0g213480002130800g2130a2eg2462a0eg2468ace00468ac000462a00g2138ac0g20381ceg203210e020321ceg24341ceg243210e0223410eg2134800g2262820g22668c0024648c0004628c0g0462800g203612eg203012e0203412eg",
    "213260eg213262e021326ceg2132ac0g2264a00g0264a2002464a0002462a00g2132a20g203212eg203212e020341ceg00341ceg200400e0003010eg2130a20g0462a20g2468ac002468ace02462a0eg2068aceg21386c0g2202620021326c0g24341ceg243210e0243210eg2134a0eg2262a2eg2266ace02466ac002462ac0g2462a00g2036120g223010002032120g",
    "21306ceg21366aeg213662e02136a2002134ac002266ac0g2464ac0g2464aa0g2462ac0g20642ceg22361ceg223612e0213402e021340aeg20060ceg2406ac0g2068ac0g2462a20g2462a2eg2468ace02462a2e02262620021348c0g2134820g243412eg21340ceg21340ce02204ace02134ace02262a2eg2462a20g2460a20g2462aa0g20620c0g20361c0g22361c00",
    "220262eg213260eg21326ce02132ac002134a0000000000g2134a20g2462a20g2462a20g206222eg206202eg20361ce021320ce0213200eg213000eg2130a20g2402a20g2068ac0g2068aceg2062a2e02468ace022686c002062620g21326c0g24341ceg243210eg243210e02134a0e02132a2e02136aceg2462ac0g2462ac0g2466a00g2064220g2060200g20321200",
    "0202a20g0132a00g0132ac0001326ce0020462e0020462eg0034120g0262200g0262020g2262820g2262800g2132ac000006ace00132a0eg013080eg023010eg003212eg02381ceg01386c0g0062620002686c002468ace02462a0eg2134aceg0206ac0g0132a20g0134a000023410e0023212e002361ceg02361ceg02620ceg026420eg2264a20g2260a00g2202a200",
    "0136ac0g0204ac000136a20g013482eg02046ceg02066ce002341c0000301c0g02660c0g22668c0g22668c002266820g0132a2eg0004ace00006aceg00361ceg02361ceg023212e00204620001348c0g0262620g2462a2eg2468ace02468a2eg0130a20g0204ac000204ac0g02341aeg02341ceg023212e0023212e0023612eg00620aeg2262aa0g2266aa002266ac0g",
    "0266a0000134a20g0136ac0g02068ceg013460eg020462eg0034120g0230100000361200220682002264820g22668c0g0064aceg0132a0eg0006a2e0023610e0003412e002321ceg01326c0g0134820g01326c0g2134aceg2468a0eg2468ace00260ac000134a00g0204a20g023410eg023410eg02321ceg02321ceg00361ce0023210e02132a0002266a00g2264a20g",
    "2264a0002264a00g2134ac0g02341c0g0234100g0234120g043410eg043810e0040402e0200482002132820g20648c0g2064ac0g2062a20g2132a000043410e0043410e004341ceg04341ceg043410eg04341ceg2206ac0g2264ac0g2260ac002468ace02462a0eg2132a2eg0132620g0204620g01346c0g00026ceg01348ce0040220e02132a2e02134a0eg2064a2eg",
    "2466aa0g2466ac002460a00g0460000g04341c0g04341c0004341ae002341ceg04341aeg21368a0g21308c002134800g2066a20g2068ac002068ac0g01641ceg04341aeg023210e0023210e004341aeg023210eg2132a20g2264ac002134a20g2462a0eg2468ace02464aceg04646c0g01386c0g01346200013462e0013460eg01348ceg2136aceg2134ace02136aceg",
    "0464aa0g2464ac0g2466a0000464200002602c0004301c0g04301aeg04321ceg04341aeg21348c0g21368c0g213480002136a0002068ac0g2268ac0g04640ceg04640aeg043210eg043210eg04341ce0043210e02134a2002264aa0g2404a20g2132a2eg2464aceg2468ace004686c0002666a000134600g013460eg013460eg01346ceg2134aceg2136aceg2134ace0",
    "24341ceg24640ceg246600e02466a0002460ac002130ac0g21308a0g21328c0g21348a0g22341ceg22361ceg223410e02136000022660c0g20646c0g22668c0g22648c0g2134800g0134a0eg2134ace00134a0e0243410e024341ceg243410eg2132620g24646c0g24686c002468ace02266aae02134a0eg0134a00g0134a00g0134ac0g21348ceg22648ceg22646ce0",
    "22341ceg22321ceg226002e02260a0002264aa002264ac0g00648c0g01348a0g01368c0g24341ceg24301ceg243610e022648c0021340a0g22640a0g20648a0g22648c0g2062820g0062a2eg2134ace00132a2e0243212e024341ceg243412eg2134620g21388c0g22626c002262ace02468ace02466a2eg0264a20g0136a00g0134ac0g24646ceg04646ceg04666ce0",
    "223210eg220020e022321ceg2132ac0g2264a00g2264a000026422000262800g2132820g243212eg243210e024341ceg21320c0g213400002132000g2132800g2062820g22628c002262ace00262a2eg2132aceg22361ceg243212e022361ceg21326c0g220482002134600g2134a0eg240402eg2468ace00068ac000062ac0g0268a00g213862eg240262e0213062eg",
    "223210eg223010e022321ceg2132aceg2264a0eg0264a2e0240482002462800g0462820g2034120g2032120020361c0g21320ceg200402e0213200eg2132820g2464820g24648c002464ac002464a20g0462ac0g22361ceg203212e022321ceg21328ceg213462e0........2134a00g2264a20g2268ac002468ace02462aceg2138a2eg2138600g213260002130600g",
    "223810e0223410eg22361ceg2136aceg0136a0eg0262a0eg2466020g2064800024048200206402002036120g20361c0g21340ceg213400eg213600e0240682002130820024648c0g2462ac0g2460a00g2462ac0g20620ceg223212eg20361ce021348ce0213460eg213460eg2134a00g0136a00g2262ac0g2462aceg2468ace02462a0e0206262002134620g2134600g",
    "22321ce022301ceg223210eg2132a0eg2134aceg2134aceg04648a0g24628c0024628c0020642c0020622c0g2234100g200600eg21320ceg21320ce02132ac0024628c000462800g0462a00g2466ac0g2464a00g226200eg22622aeg223210e0240460e021366ceg21346ceg2134ac0g2136ac0g2138a00g2138a0eg2462a0e02468ace022686c0020646c0g21306c0g",
    "0132ac000130ac0g0132a00g023210eg02341ceg02341ceg00341ceg00622ce000622ce024648c0024628c0g0462800g0204a00g0204ac0g0132ac0000321ce000361ce0003212eg0032120g00662a0g0062220g2462a20g2466aa0g2262a0000132a0e00136aceg0134aceg01346ceg0404aceg013862eg0138600g0062600000686c002468ace02462aceg0460aaeg",
    "2134ac0g0134ac000136a00g023610eg02321ceg02321ce000321ce000341ceg00642ceg24648c0g24668c002464800g0134a00g0404ac000138ac0g00381ceg00361ceg003010e00030120000361c0g0060200g2460a00g2466ac002466a00g0134a0eg0134ace00136aceg01348ceg02646aeg040262e0013260000134620g00626c0g2462aceg2468ace02464aceg",
    "0264ac0g0138aa0g0136a200023612e002341ae002341ceg00341ceg00341aeg00341ceg2134ac0g24668c0g246482000264a2000204ac0g0204ac0g00341aeg00361ceg003412eg0034120g00361c00003412002262a2002464ac0g2464a20g0264a2eg0136aaeg0204ace002046ce001368ce0013082eg0130620g0134620g01306a0g2400aceg2464aaeg2468ace0"
  ];
  // Totals that replace TTD's printed value, "girl,boy": total. Empty = TTD as printed. If an older
  // edition confirms 31x27 is a misprint, set { "31,27": 23 } (rows stay standard, so the note stays).
  var TOTAL_FIX = {};

  // ---- Dosha parihara, TTD panchangam 2025-26 p66 (వివాహ ప్రకరణము) only. Information only: never
  // changes the total. Each rule returns {reason, restored} (restored = the row's missing points) or null.
  // Elders/astrologers decide whether a parihara applies.
  function mutualFriends(la, lb) { return la === lb || (rel(la, lb) === "F" && rel(lb, la) === "F"); }
  // "ఏకనాడీ దోషములేని నక్షత్రములు": ఉ.భా, రేవతి, రోహిణి, మృగశిర, ఆర్ద్ర, శ్రవణ, పుష్యమి, విశాఖ.
  // ponytail: applied only when both stars are in the list; TTD does not say whether one is enough.
  var NADI_OK = [25, 26, 3, 4, 5, 21, 7, 15];
  // "వధూవరులకొకే నక్షత్రమైననూ వివాహము చేయదగిన నక్షత్రములు": రోహిణి, ఆర్ద్ర, మఘ, విశాఖ, పుష్య, శ్రవణం, రేవతి, ఉ.భా.
  var SAME_STAR_OK = [3, 5, 9, 15, 7, 21, 26, 25];
  var PARIHARA = {
    nadi: function (g, b, s) {
      if (s.nadi > 0) return null;
      var r = g.n === b.n && SAME_STAR_OK.indexOf(g.n) >= 0 ? "ఇద్దరిదీ ఒకే నక్షత్రం — ఈ నక్షత్రానికి ఒకే నక్షత్రమైనా వివాహం చేయవచ్చు"
        : NADI_OK.indexOf(g.n) >= 0 && NADI_OK.indexOf(b.n) >= 0 ? "ఇద్దరి నక్షత్రాలూ ఏకనాడీ దోషం లేని నక్షత్రాల జాబితాలో ఉన్నాయి" : null;
      return r && { reason: r, restored: 8 };
    },
    // "ద్విర్ద్వాదశే వా నవపంచమే వా షష్టాష్టకే … ఏకాధిపత్యే పృథయోస్సుహృత్త్వే పాణిగ్రహో మంగళమాతనోతి".
    bhakoot: function (g, b, s) {
      if (s.bhakoot > 0) return null;
      var la = LORD[g.r], lb = LORD[b.r];
      if (!mutualFriends(la, lb)) return null;
      return { reason: la === lb ? "ఇద్దరి రాశులకూ అధిపతి ఒకే గ్రహం" : "ఇద్దరి రాశ్యధిపతులు పరస్పర మిత్రులు", restored: 7 };
    },
    // "రాక్షస వధువునకును, మానుష వరునకు వివాహము చేయవచ్చునను ప్రమాణములు".
    gana: function (g, b, s) {
      if (s.gana > 1 || GANA[g.n] !== R || GANA[b.n] !== M) return null;
      return { reason: "వధువు రాక్షస గణం, వరుడు మనుష్య గణం — ఈ జోడీకి వివాహం చేయవచ్చని ప్రమాణం ఉంది", restored: 6 - s.gana };
    }
  };

  // total = TTD p64 table (or TOTAL_FIX); kootas = ROWS scores with standard labels. Parihara is
  // judged on the shown scores.
  function match(girlId, boyId) {
    var g = get(girlId), b = get(boyId), s = {};
    var row = ROWS[girlId - 1].substr((boyId - 1) * 8, 8);
    var kootas = KOOTAS.map(function (k, i) {
      var v = SCORE[k[0]](g, b);
      if (row[i] !== ".") v[2] = parseInt(row[i], 36) / 2;
      s[k[0]] = v[2];
      return { key: k[0], name: k[1], girl: v[0], boy: v[1], score: v[2], max: k[2] };
    });
    var p = {}, parihara = [];
    ["nadi", "bhakoot", "gana"].forEach(function (key) {
      var r = PARIHARA[key](g, b, s);
      if (!r) return;
      p[key] = r;
      parihara.push({ key: key, reason: r.reason, restored: r.restored });
    });
    kootas.forEach(function (k) { if (p[k.key]) k.parihara = p[k.key].reason; });
    var fix = TOTAL_FIX[girlId + "," + boyId];
    return { kootas: kootas, total: fix != null ? fix : TTD[girlId - 1][boyId - 1], max: 36, nadiDosha: s.nadi === 0, parihara: parihara };
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
