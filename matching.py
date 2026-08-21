"""Vivah Matching engine - Telugu marriage compatibility lookup.

The full 36-guna matching matrix ships as a SQLite database
(telungu_thirumanam.db) containing every precomputed result:

  rasi_star        36 rows - valid Rasi + Nakshatra(pada group) combos
  girl / boy     1296 rows - per-pair koota attribute values (p1..p8)
  matching_point 1296 rows - per-pair scores "p1/max,...,total/36" + verdict

Every lookup key ("nid") has the form  "<bride_id>.<groom_id>"  where the ids
are rasi_star ids (1..36).

Koota column mapping:
    p1 Varna  p2 Vashya  p3 Tara  p4 Yoni
    p5 GrahaMaitri  p6 Gana  p7 Rasi(Bhakoot)  p8 Nadi
"""

from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import List

DB_PATH = Path(__file__).with_name("telungu_thirumanam.db")

KOOTA_NAMES: List[str] = [
    "వర్ణకూటము",
    "వశ్య కూటము",
    "తారాకూటము",
    "యోనికూటము",
    "గ్రహమైత్రి",
    "గణకూటం",
    "రాశికూటం",
    "నాడి కూటం",
]

_conn: sqlite3.Connection | None = None


def _db() -> sqlite3.Connection:
    global _conn
    if _conn is None:
        _conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        _conn.row_factory = sqlite3.Row
    return _conn


@dataclass
class Combo:
    id: int
    rasi: str
    star: str

    @property
    def label(self) -> str:
        return f"{self.rasi} - {self.star}"


@dataclass
class KootaResult:
    name: str
    girl_value: str
    boy_value: str
    points: int
    max_points: int


@dataclass
class MatchReport:
    system: str
    bride_rasi: str
    bride_nak: str
    bride_pada: str
    groom_rasi: str
    groom_nak: str
    groom_pada: str
    total: int
    max_total: int
    verdict: str
    kootas: List[KootaResult]


def get_combos() -> List[Combo]:
    rows = _db().execute("SELECT id, rasi, star FROM rasi_star ORDER BY id").fetchall()
    return [Combo(id=r["id"], rasi=r["rasi"], star=r["star"]) for r in rows]


def match(girl_id: int, boy_id: int) -> MatchReport:
    nid = f"{girl_id}.{boy_id}"
    db = _db()

    girl = db.execute(
        "SELECT Raasi, Naksatram, Padamu, p1,p2,p3,p4,p5,p6,p7,p8 "
        "FROM girl WHERE nid=?", (nid,)
    ).fetchone()
    boy = db.execute(
        "SELECT Raasi, Naksatram, Padamu, p1,p2,p3,p4,p5,p6,p7,p8 "
        "FROM boy WHERE nid=?", (nid,)
    ).fetchone()
    mp = db.execute(
        "SELECT mark, match FROM matching_point WHERE nid=?", (nid,)
    ).fetchone()

    if girl is None or boy is None or mp is None:
        raise ValueError(f"Unknown combination: bride={girl_id}, groom={boy_id}")

    parts = mp["mark"].split(",")
    per_koota = parts[:8]                 # "pts/max" x8
    total_s, max_s = parts[8].split("/")  # "28/36"

    kootas = []
    for i, chunk in enumerate(per_koota):
        pts, mx = chunk.split("/")
        kootas.append(KootaResult(
            name=KOOTA_NAMES[i],
            girl_value=str(girl[f"p{i + 1}"]),
            boy_value=str(boy[f"p{i + 1}"]),
            points=int(pts),
            max_points=int(mx),
        ))

    return MatchReport(
        system="Telugu Vivaha Porutham",
        bride_rasi=girl["Raasi"],
        bride_nak=girl["Naksatram"],
        bride_pada=girl["Padamu"],
        groom_rasi=boy["Raasi"],
        groom_nak=boy["Naksatram"],
        groom_pada=boy["Padamu"],
        total=int(total_s),
        max_total=int(max_s),
        verdict=mp["match"],
        kootas=kootas,
    )
