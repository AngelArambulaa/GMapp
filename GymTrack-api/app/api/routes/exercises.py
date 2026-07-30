from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.all import Exercise, User, SetLog
from app.schemas.schemas import ExerciseOut, ExerciseCreate, ExerciseUsageStats
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.get("", response_model=List[ExerciseOut])
def list_exercises(
    search: Optional[str] = Query(None),
    muscle_group: Optional[str] = Query(None),
    include_archived: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(Exercise).filter(
        (Exercise.created_by == None) |
        (Exercise.created_by == current_user.id)
    )
    if not include_archived:
        q = q.filter(Exercise.archived == 0)
    if search:
        q = q.filter(Exercise.name.ilike(f"%{search}%"))
    if muscle_group:
        q = q.filter(Exercise.muscle_group == muscle_group)
    return q.order_by(Exercise.name).all()


@router.get("/{exercise_id}/usage", response_model=ExerciseUsageStats)
def get_exercise_usage(
    exercise_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns how many sets and sessions used this exercise."""
    exercise = db.query(Exercise).filter(
        Exercise.id == exercise_id,
        Exercise.created_by == current_user.id,
    ).first()
    if not exercise:
        raise HTTPException(404, "Exercise not found or not yours")

    all_sets = db.query(SetLog).filter(
        SetLog.exercise_id == exercise_id
    ).all()

    unique_sessions = len(set(s.session_id for s in all_sets))

    return ExerciseUsageStats(
        exercise_id=exercise_id,
        total_sets=len(all_sets),
        total_sessions=unique_sessions,
        can_delete=len(all_sets) == 0,
    )


@router.post("", response_model=ExerciseOut, status_code=201)
def create_exercise(
    payload: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Exercise).filter(
        Exercise.name.ilike(payload.name.strip()),
        (Exercise.created_by == None) |
        (Exercise.created_by == current_user.id)
    ).first()
    if existing:
        raise HTTPException(
            400,
            f"You already have an exercise named '{existing.name}'"
        )

    exercise = Exercise(
        name=payload.name.strip(),
        muscle_group=payload.muscle_group,
        exercise_type=payload.exercise_type,
        description=payload.description,
        created_by=current_user.id,
    )
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise


@router.put("/{exercise_id}", response_model=ExerciseOut)
def update_exercise(
    exercise_id: str,
    payload: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exercise = db.query(Exercise).filter(
        Exercise.id == exercise_id,
        Exercise.created_by == current_user.id,
    ).first()
    if not exercise:
        raise HTTPException(404, "Exercise not found or you can't edit it")

    existing = db.query(Exercise).filter(
        Exercise.name.ilike(payload.name.strip()),
        Exercise.id != exercise_id,
        (Exercise.created_by == None) |
        (Exercise.created_by == current_user.id)
    ).first()
    if existing:
        raise HTTPException(400, f"An exercise named '{existing.name}' already exists")

    exercise.name          = payload.name.strip()
    exercise.muscle_group  = payload.muscle_group
    exercise.exercise_type = payload.exercise_type
    exercise.description   = payload.description
    db.commit()
    db.refresh(exercise)
    return exercise


@router.patch("/{exercise_id}/archive", response_model=ExerciseOut)
def archive_exercise(
    exercise_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Hides the exercise from the picker but keeps all history."""
    exercise = db.query(Exercise).filter(
        Exercise.id == exercise_id,
        Exercise.created_by == current_user.id,
    ).first()
    if not exercise:
        raise HTTPException(404, "Exercise not found or not yours")
    exercise.archived = 1
    db.commit()
    db.refresh(exercise)
    return exercise


@router.patch("/{exercise_id}/unarchive", response_model=ExerciseOut)
def unarchive_exercise(
    exercise_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exercise = db.query(Exercise).filter(
        Exercise.id == exercise_id,
        Exercise.created_by == current_user.id,
    ).first()
    if not exercise:
        raise HTTPException(404, "Exercise not found or not yours")
    exercise.archived = 0
    db.commit()
    db.refresh(exercise)
    return exercise


@router.delete("/{exercise_id}", status_code=204)
def delete_exercise(
    exercise_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Only allowed if exercise has zero history."""
    exercise = db.query(Exercise).filter(
        Exercise.id == exercise_id,
        Exercise.created_by == current_user.id,
    ).first()
    if not exercise:
        raise HTTPException(404, "Exercise not found or not yours")

    has_sets = db.query(SetLog).filter(
        SetLog.exercise_id == exercise_id
    ).first()
    if has_sets:
        raise HTTPException(
            400,
            "This exercise has workout history. Archive it instead to preserve your data."
        )

    db.delete(exercise)
    db.commit()

# Force delete route for exercises with history
@router.delete("/{exercise_id}/force", status_code=204)
def force_delete_exercise(
    exercise_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Force delete — also removes all set logs for this exercise."""
    exercise = db.query(Exercise).filter(
        Exercise.id == exercise_id,
        Exercise.created_by == current_user.id,
    ).first()
    if not exercise:
        raise HTTPException(404, "Exercise not found or not yours")

    # Delete all set logs for this exercise first
    db.query(SetLog).filter(SetLog.exercise_id == exercise_id).delete()

    # Now safe to delete the exercise
    db.delete(exercise)
    db.commit()