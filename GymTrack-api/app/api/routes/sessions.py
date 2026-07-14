from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.all import WorkoutSession, SetLog, User
from app.schemas.schemas import SessionCreate, SessionOut, SetCreate, SetOut
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/sessions", tags=["sessions"])

@router.get("", response_model=List[SessionOut])
def list_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(WorkoutSession)
        .filter(WorkoutSession.athlete_id == current_user.id)
        .order_by(WorkoutSession.date.desc())
        .limit(50)
        .all()
    )

@router.post("", response_model=SessionOut, status_code=201)
def create_session(payload: SessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = WorkoutSession(athlete_id=current_user.id, routine_id=payload.routine_id, notes=payload.notes)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.athlete_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")
    return session

@router.post("/{session_id}/sets", response_model=SetOut, status_code=201)
def log_set(session_id: str, payload: SetCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.athlete_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")
    set_log = SetLog(session_id=session_id, **payload.dict())

    db.add(set_log)
    db.commit()
    db.refresh(set_log)
    return set_log

@router.delete("/{session_id}/sets/{set_id}", status_code=204)
def delete_set(session_id: str, set_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.athlete_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")
    s = db.query(SetLog).filter(SetLog.id == set_id, SetLog.session_id == session_id).first()
    if not s:
        raise HTTPException(404, "Set not found")
    db.delete(s)
    db.commit()

@router.patch("/{session_id}/complete", response_model=SessionOut)
def complete_session(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.athlete_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")
    session.status = "completed"
    db.commit()
    db.refresh(session)
    return session

@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.athlete_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(404, "Session not found")
    db.delete(session)
    db.commit()