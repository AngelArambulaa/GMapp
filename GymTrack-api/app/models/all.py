import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from app.db.session import Base

def gen_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id               = Column(String(36),  primary_key=True, default=gen_uuid)
    name             = Column(String(100), nullable=False)
    email            = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password  = Column(String(255), nullable=False)
    role             = Column(Enum("athlete", "coach", name="user_role"), nullable=False)
    created_at       = Column(DateTime, default=datetime.utcnow)

    coached_athletes = relationship("CoachAthleteLink", foreign_keys="CoachAthleteLink.coach_id",   back_populates="coach")
    coaches          = relationship("CoachAthleteLink", foreign_keys="CoachAthleteLink.athlete_id", back_populates="athlete")
    routines_created = relationship("Routine",          back_populates="coach")
    sessions         = relationship("WorkoutSession",   back_populates="athlete")


class CoachAthleteLink(Base):
    __tablename__ = "coach_athlete_links"

    id         = Column(String(36), primary_key=True, default=gen_uuid)
    coach_id   = Column(String(36), ForeignKey("users.id"), nullable=False)
    athlete_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    coach   = relationship("User", foreign_keys=[coach_id],   back_populates="coached_athletes")
    athlete = relationship("User", foreign_keys=[athlete_id], back_populates="coaches")


class Exercise(Base):
    __tablename__ = "exercises"

    id            = Column(String(36), primary_key=True, default=gen_uuid)
    name          = Column(String(100), nullable=False)
    muscle_group  = Column(String(50))
    exercise_type = Column(Enum("strength", "cardio", "flexibility", name="exercise_type"), default="strength")
    description   = Column(Text)
    created_by    = Column(String(36), ForeignKey("users.id"), nullable=True)


class Routine(Base):
    __tablename__ = "routines"

    id            = Column(String(36), primary_key=True, default=gen_uuid)
    coach_id      = Column(String(36), ForeignKey("users.id"), nullable=False)
    name          = Column(String(100), nullable=False)
    description   = Column(Text)
    days_per_week = Column(Integer, default=3)
    created_at    = Column(DateTime, default=datetime.utcnow)

    coach       = relationship("User",              back_populates="routines_created")
    exercises   = relationship("RoutineExercise",   back_populates="routine", cascade="all, delete-orphan")
    assignments = relationship("RoutineAssignment", back_populates="routine")


class RoutineExercise(Base):
    __tablename__ = "routine_exercises"

    id           = Column(String(36), primary_key=True, default=gen_uuid)
    routine_id   = Column(String(36), ForeignKey("routines.id"),  nullable=False)
    exercise_id  = Column(String(36), ForeignKey("exercises.id"), nullable=False)
    sets         = Column(Integer, default=3)
    reps         = Column(Integer, default=10)
    rest_seconds = Column(Integer, default=60)
    order        = Column(Integer, default=0)
    notes        = Column(Text)

    routine  = relationship("Routine",  back_populates="exercises")
    exercise = relationship("Exercise")


class RoutineAssignment(Base):
    __tablename__ = "routine_assignments"

    id          = Column(String(36), primary_key=True, default=gen_uuid)
    routine_id  = Column(String(36), ForeignKey("routines.id"), nullable=False)
    athlete_id  = Column(String(36), ForeignKey("users.id"),    nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    active      = Column(Integer, default=1)

    routine = relationship("Routine", back_populates="assignments")
    athlete = relationship("User")


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id         = Column(String(36), primary_key=True, default=gen_uuid)
    athlete_id = Column(String(36), ForeignKey("users.id"),    nullable=False)
    routine_id = Column(String(36), ForeignKey("routines.id"), nullable=True)
    date       = Column(DateTime, default=datetime.utcnow)
    notes      = Column(Text)
    status     = Column(Enum("in_progress", "completed", name="session_status"), default="in_progress")

    athlete = relationship("User",    back_populates="sessions")
    routine = relationship("Routine")
    sets    = relationship("SetLog",  back_populates="session", cascade="all, delete-orphan")


class SetLog(Base):
    __tablename__ = "set_logs"

    id          = Column(String(36), primary_key=True, default=gen_uuid)
    session_id  = Column(String(36), ForeignKey("workout_sessions.id"), nullable=False)
    exercise_id = Column(String(36), ForeignKey("exercises.id"),        nullable=False)
    set_number  = Column(Integer, nullable=False)
    reps        = Column(Integer, nullable=False)
    weight_kg   = Column(Float,   nullable=True)
    rpe         = Column(Float,   nullable=True)
    logged_at   = Column(DateTime, default=datetime.utcnow)

    session  = relationship("WorkoutSession", back_populates="sets")
    exercise = relationship("Exercise")