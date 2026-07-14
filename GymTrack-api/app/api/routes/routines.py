from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.all import Routine, RoutineExercise, RoutineAssignment, User, WorkoutSession
from app.schemas.schemas import RoutineCreate, RoutineOut, AssignRoutineRequest
from app.core.dependencies import get_current_user, require_coach

router = APIRouter(prefix="/routines", tags=["routines"])

@router.get("", response_model=List[RoutineOut])
def list_routines(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == "coach":
        return db.query(Routine).filter(Routine.coach_id == current_user.id).all()

    # Athlete: own routines + assigned routines
    own = db.query(Routine).filter(Routine.coach_id == current_user.id).all()
    assignments = db.query(RoutineAssignment).filter(
        RoutineAssignment.athlete_id == current_user.id,
        RoutineAssignment.active == 1,
    ).all()
    assigned = [a.routine for a in assignments]

    seen = set()
    result = []
    for r in own + assigned:
        if r.id not in seen:
            seen.add(r.id)
            result.append(r)
    return result

@router.post("", response_model=RoutineOut, status_code=201)
def create_routine(
    payload: RoutineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # ← any role can create
):
    routine = Routine(
        coach_id=current_user.id,
        name=payload.name,
        description=payload.description,
        days_per_week=payload.days_per_week,
    )
    db.add(routine)
    db.flush()
    for ex in payload.exercises:
        db.add(RoutineExercise(routine_id=routine.id, **ex.dict()))

    db.commit()
    db.refresh(routine)
    return routine

@router.get("/{routine_id}", response_model=RoutineOut)
def get_routine(routine_id: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    routine = db.query(Routine).filter(Routine.id == routine_id).first()
    if not routine:
        raise HTTPException(404, "Routine not found")
    return routine

@router.put("/{routine_id}", response_model=RoutineOut)
def update_routine(
    routine_id: str,
    payload: RoutineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    routine = db.query(Routine).filter(
        Routine.id == routine_id,
        Routine.coach_id == current_user.id,
    ).first()
    if not routine:
        raise HTTPException(404, "Routine not found or not yours")
    routine.name = payload.name
    routine.description = payload.description
    routine.days_per_week = payload.days_per_week
    db.query(RoutineExercise).filter(RoutineExercise.routine_id == routine_id).delete()
    for ex in payload.exercises:
        db.add(RoutineExercise(routine_id=routine.id, **ex.dict()))

    db.commit()
    db.refresh(routine)
    return routine
@router.delete("/{routine_id}", status_code=204)
def delete_routine(
    routine_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    routine = db.query(Routine).filter(
        Routine.id == routine_id,
        Routine.coach_id == current_user.id,
    ).first()
    if not routine:
        raise HTTPException(404, "Routine not found or not yours")

    # Unlink sessions instead of deleting them
    # so workout history is preserved
    db.query(WorkoutSession).filter(
        WorkoutSession.routine_id == routine_id
    ).update({"routine_id": None})

    # Deactivate any assignments
    db.query(RoutineAssignment).filter(
        RoutineAssignment.routine_id == routine_id
    ).update({"active": 0})

    db.delete(routine)
    db.commit()

@router.post("/{routine_id}/assign", status_code=201)
def assign_routine(
    routine_id: str,
    payload: AssignRoutineRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_coach),
):
    routine = db.query(Routine).filter(
        Routine.id == routine_id,
        Routine.coach_id == current_user.id,
    ).first()
    if not routine:
        raise HTTPException(404, "Routine not found")
    athlete = db.query(User).filter(User.id == payload.athlete_id, User.role == "athlete").first()
    if not athlete:
        raise HTTPException(404, "Athlete not found")
    db.query(RoutineAssignment).filter(
        RoutineAssignment.routine_id == routine_id,
        RoutineAssignment.athlete_id == payload.athlete_id,
    ).update({"active": 0})
    db.add(RoutineAssignment(routine_id=routine_id, athlete_id=payload.athlete_id))
    db.commit()
    return {"message": "Routine assigned successfully"}