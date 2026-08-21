"""Vivah Matching web app - FastAPI backend (Nithra Telugu engine port)."""

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

import matching

app = FastAPI(title="Vivah Matching", version="2.0.0")


class MatchRequest(BaseModel):
    girl_id: int = Field(ge=1, le=36, description="Bride combo id from rasi_star")
    boy_id: int = Field(ge=1, le=36, description="Groom combo id from rasi_star")
    girl_name: str = Field("", description="Optional bride name")
    boy_name: str = Field("", description="Optional groom name")


@app.get("/api/meta")
def meta():
    combos = matching.get_combos()
    return {
        "combos": [
            {"id": c.id, "rasi": c.rasi, "star": c.star, "label": c.label}
            for c in combos
        ]
    }


@app.post("/api/match")
def do_match(req: MatchRequest):
    try:
        report = matching.match(girl_id=req.girl_id, boy_id=req.boy_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "system": report.system,
        "girl_name": req.girl_name or None,
        "boy_name": req.boy_name or None,
        "bride_rasi": report.bride_rasi,
        "bride_nak": report.bride_nak,
        "bride_pada": report.bride_pada,
        "groom_rasi": report.groom_rasi,
        "groom_nak": report.groom_nak,
        "groom_pada": report.groom_pada,
        "total": report.total,
        "max_total": report.max_total,
        "verdict": report.verdict,
        "kootas": [
            {
                "name": k.name,
                "girl_value": k.girl_value,
                "boy_value": k.boy_value,
                "points": k.points,
                "max_points": k.max_points,
            }
            for k in report.kootas
        ],
    }


@app.get("/")
def index():
    return FileResponse("static/index.html")


app.mount("/static", StaticFiles(directory="static"), name="static")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
