from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from db import SessionLocal, Question, AnswerLog, init_db

app = FastAPI(title="AWS SSA Quiz API", version="1.0.0")


@app.on_event("startup")
def startup():
    init_db()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/questions")
def list_questions(domain: str | None = None, db: Session = Depends(get_db)):
    q = db.query(Question)
    if domain and domain != "全部":
        q = q.filter(Question.domain == domain)
    return [
        {
            "id": x.id, "domain": x.domain, "question": x.question,
            "options": x.options, "answer": x.answer,
            "explanations": x.explanations, "tip": x.tip,
        }
        for x in q.order_by(Question.id).all()
    ]


@app.get("/api/questions/domains")
def list_domains(db: Session = Depends(get_db)):
    return [r[0] for r in db.query(Question.domain).distinct().all()]


@app.post("/api/answers")
def record_answer(user_key: str, question_id: int, selected: int, db: Session = Depends(get_db)):
    question = db.get(Question, question_id)
    if not question:
        raise HTTPException(404, "question not found")
    if not 0 <= selected < len(question.options):
        raise HTTPException(400, "selected out of range")
    log = AnswerLog(user_key=user_key, question_id=question_id,
                    selected=selected, correct=int(selected == question.answer))
    db.add(log)
    db.commit()
    return {"correct": bool(log.correct)}


@app.get("/api/stats/{user_key}")
def stats(user_key: str, db: Session = Depends(get_db)):
    rows = (db.query(AnswerLog.question_id, AnswerLog.selected, AnswerLog.correct)
              .filter(AnswerLog.user_key == user_key).all())
    return {
        "answered": len(rows),
        "right": sum(r.correct for r in rows),
        "wrong_question_ids": [r.question_id for r in rows if not r.correct],
    }
