from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.db.session import get_db
from app.models.all import User, WorkoutSession, SetLog, Exercise, CoachAthleteLink
from app.schemas.schemas import ExerciseProgress, ProgressPoint, UserOut
from app.core.dependencies import get_current_user, require_coach

router = APIRouter(tags=["users & progress"])

@router.get("/athletes", response_model=List[UserOut])
def list_all_athletes(db: Session = Depends(get_db), _: User = Depends(require_coach)):
    return db.query(User).filter(User.role == "athlete").order_by(User.name).all()

@router.post("/athletes/{athlete_id}/link", status_code=201)
def link_athlete(athlete_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_coach)):
    athlete = db.query(User).filter(User.id == athlete_id, User.role == "athlete").first()
    if not athlete:
        raise HTTPException(404, "Athlete not found")
    exists = db.query(CoachAthleteLink).filter(
        CoachAthleteLink.coach_id == current_user.id,
        CoachAthleteLink.athlete_id == athlete_id,
    ).first()
    if exists:
        return {"message": "Already linked"}
    db.add(CoachAthleteLink(coach_id=current_user.id, athlete_id=athlete_id))
    db.commit()
    return {"message": "Athlete linked"}

@router.delete("/athletes/{athlete_id}/link", status_code=204)
def unlink_athlete(athlete_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_coach)):
    db.query(CoachAthleteLink).filter(
        CoachAthleteLink.coach_id == current_user.id,
        CoachAthleteLink.athlete_id == athlete_id,
    ).delete()
    db.commit()

@router.get("/coach/athletes", response_model=List[UserOut])
def my_athletes(db: Session = Depends(get_db), current_user: User = Depends(require_coach)):
    links = db.query(CoachAthleteLink).filter(CoachAthleteLink.coach_id == current_user.id).all()
    return [link.athlete for link in links]

@router.get("/progress/{athlete_id}", response_model=List[ExerciseProgress])
def get_progress(
    athlete_id: str,
    exercise_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "athlete" and current_user.id != athlete_id:
        raise HTTPException(403, "Access denied")
    if current_user.role == "coach":
        linked = db.query(CoachAthleteLink).filter(
            CoachAthleteLink.coach_id == current_user.id,
            CoachAthleteLink.athlete_id == athlete_id,
        ).first()
        if not linked:
            raise HTTPException(403, "This athlete is not linked to you")

    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.athlete_id == athlete_id,
        WorkoutSession.status == "completed",
    ).all()
    session_ids = [s.id for s in sessions]
    if not session_ids:
        return []

    q = db.query(SetLog).filter(SetLog.session_id.in_(session_ids))
    if exercise_id:
        q = q.filter(SetLog.exercise_id == exercise_id)
    all_sets = q.all()
    if not all_sets:
        return []

    session_date = {s.id: s.date for s in sessions}
    exercise_map: dict = {}
    for s in all_sets:
        exercise_map.setdefault(s.exercise_id, []).append(s)

    result = []
    for ex_id, sets in exercise_map.items():
        exercise = db.query(Exercise).filter(Exercise.id == ex_id).first()
        if not exercise:
            continue

        day_map: dict = {}
        for s in sets:
            date_key = session_date[s.session_id].date()
            day_map.setdefault(date_key, []).append(s)

        data_points = []
        for date, day_sets in sorted(day_map.items()):

            # Max weight across all sets that day (ignore 0/null)
            weighted_sets = [s for s in day_sets if s.weight_kg and s.weight_kg > 0]

            if weighted_sets:
                max_weight = max(s.weight_kg for s in weighted_sets)
                # Reps done at that specific max weight
                max_weight_reps = max(
                    s.reps for s in weighted_sets
                    if s.weight_kg == max_weight
                )
            else:
                # No weight logged that day — still record it
                # but max_weight stays 0 and we track best reps
                max_weight = 0
                max_weight_reps = max(s.reps for s in day_sets)

            volume    = sum((s.weight_kg or 0) * s.reps for s in day_sets)
            total_sets = len(day_sets)

            data_points.append(ProgressPoint(
                date=datetime.combine(date, datetime.min.time()),
                max_weight=max_weight,
                max_weight_reps=max_weight_reps,
                total_volume=round(volume, 2),
                total_sets=total_sets,
            ))

        result.append(ExerciseProgress(exercise=exercise, data_points=data_points))

    return result

@router.get("/personal-best/{exercise_id}")
def get_personal_best(
    exercise_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the best set ever logged for a given exercise by the current user."""
    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.athlete_id == current_user.id,
        WorkoutSession.status == "completed",
    ).all()
    session_ids = [s.id for s in sessions]
    if not session_ids:
        return {"best_weight": None, "best_reps": None, "last_sets": []}

    all_sets = db.query(SetLog).filter(
        SetLog.session_id.in_(session_ids),
        SetLog.exercise_id == exercise_id,
    ).order_by(SetLog.logged_at.desc()).all()

    if not all_sets:
        return {"best_weight": None, "best_reps": None, "last_sets": []}

    best_weight = max((s.weight_kg for s in all_sets if s.weight_kg), default=None)

    # Get the last session's sets for this exercise
    last_session_id = all_sets[0].session_id
    last_sets = [s for s in all_sets if s.session_id == last_session_id]

    return {
        "best_weight": best_weight,
        "best_reps":   max(s.reps for s in all_sets),
        "last_sets": [
            {
                "set_number": s.set_number,
                "reps":       s.reps,
                "weight_kg":  s.weight_kg,
                "rpe":        s.rpe,
            }
            for s in sorted(last_sets, key=lambda x: x.set_number)
        ],
    }