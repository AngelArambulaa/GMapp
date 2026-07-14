from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.all import Exercise, User
from app.schemas.schemas import ExerciseOut, ExerciseCreate
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/exercises", tags=["exercises"])

@router.get("", response_model=List[ExerciseOut])
def list_exercises(
    search: Optional[str] = Query(None),
    muscle_group: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    q = db.query(Exercise)
    if search:
        q = q.filter(Exercise.name.ilike(f"%{search}%"))
    if muscle_group:
        q = q.filter(Exercise.muscle_group == muscle_group)
    return q.order_by(Exercise.name).all()

@router.post("", response_model=ExerciseOut, status_code=201)
def create_exercise(
    payload: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exercise = Exercise(**payload.model_dump(), created_by=current_user.id)
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise