import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

from agent import run_agent, risk_score_tool, care_playbook_tool
from database import init_db, log_feedback, get_all_feedback

app = FastAPI(title="MaternaWatch AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://*.netlify.app", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()


class ChatRequest(BaseModel):
    message: str


class ScoreRequest(BaseModel):
    patient_name: str


class PlanRequest(BaseModel):
    patient_name: str


class FeedbackRequest(BaseModel):
    patient_name: str
    action: str
    rating: str
    correction: str = ""


@app.get("/")
def health_check():
    return {"status": "ok", "service": "MaternaWatch AI"}


@app.post("/api/chat")
def chat(req: ChatRequest):
    try:
        result = run_agent(req.message)
        return {"answer": result["answer"], "tool_used": result["tool_used"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/score")
def score(req: ScoreRequest):
    try:
        result = risk_score_tool.invoke({"patient_name": req.patient_name})
        return {"result": result, "tool_used": "risk_score_tool"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/plan")
def plan(req: PlanRequest):
    try:
        result = care_playbook_tool.invoke({"patient_name": req.patient_name})
        return {"result": result, "tool_used": "care_playbook_tool"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/feedback")
def submit_feedback(req: FeedbackRequest):
    try:
        log_feedback(req.patient_name, req.action, req.rating, req.correction)
        return {"status": "logged"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/feedback")
def fetch_feedback():
    try:
        return get_all_feedback()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
