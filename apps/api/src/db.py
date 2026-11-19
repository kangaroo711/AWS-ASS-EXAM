import os, json
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import (create_engine, Column, Integer, String, Text, JSON,
                        DateTime, ForeignKey, func)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

load_dotenv()
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://aws_ssa:aws_ssa_pass@localhost:3307/aws_ssa?charset=utf8mb4",
)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False)
Base = declarative_base()

QUESTIONS_JSON = Path(__file__).resolve().parent.parent / "packages-shared-fallback.json"


class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True)
    domain = Column(String(64), nullable=False, index=True)
    question = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)
    answer = Column(Integer, nullable=False)
    explanations = Column(JSON, nullable=False)
    tip = Column(Text, nullable=True)


class AnswerLog(Base):
    __tablename__ = "answer_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_key = Column(String(64), nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    selected = Column(Integer, nullable=False)
    correct = Column(Integer, nullable=False)  # 1/0
    created_at = Column(DateTime, server_default=func.now(), index=True)
    question = relationship("Question")


def load_questions():
    """题库来源：优先读 shared 包的 questions.json（仓库内复制一份给 Python 用）。"""
    data_path = Path(__file__).resolve().parent / "questions.json"
    with open(data_path, encoding="utf-8") as f:
        return json.load(f)


def init_db():
    Base.metadata.create_all(engine)
    with SessionLocal() as s:
        count = s.query(Question).count()
        if count == 0:
            for q in load_questions():
                s.add(Question(**q))
            s.commit()
            print(f"seeded {len(load_questions())} questions")
        else:
            print(f"questions already exist: {count}, skip seed")
