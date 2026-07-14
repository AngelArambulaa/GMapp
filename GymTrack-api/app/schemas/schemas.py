from __future__ import annotations
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        orm_mode = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ExerciseOut(BaseModel):
    id: str
    name: str
    muscle_group: Optional[str]
    exercise_type: str
    description: Optional[str]

    class Config:
        orm_mode = True

class ExerciseCreate(BaseModel):
    name: str
    muscle_group: Optional[str] = None
    exercise_type: str = "strength"
    description: Optional[str] = None


class RoutineExerciseIn(BaseModel):
    exercise_id: str
    sets: int = 3
    reps: int = 10
    rest_seconds: int = 60
    order: int = 0
    notes: Optional[str] = None

class RoutineExerciseOut(BaseModel):
    id: str
    exercise_id: str
    exercise: ExerciseOut
    sets: int
    reps: int
    rest_seconds: int
    order: int
    notes: Optional[str]

    class Config:
        orm_mode = True

class RoutineCreate(BaseModel):
    name: str
    description: Optional[str] = None
    days_per_week: int = 3
    exercises: List[RoutineExerciseIn] = []

class RoutineOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    days_per_week: int
    created_at: datetime
    coach: UserOut
    exercises: List[RoutineExerciseOut] = []

    class Config:
        orm_mode = True

class AssignRoutineRequest(BaseModel):
    athlete_id: str


class SessionCreate(BaseModel):
    routine_id: Optional[str] = None
    notes: Optional[str] = None

class SetCreate(BaseModel):
    exercise_id: str
    set_number: int
    reps: int
    weight_kg: Optional[float] = None
    rpe: Optional[float] = None

class SetOut(BaseModel):
    id: str
    exercise_id: str
    exercise: ExerciseOut
    set_number: int
    reps: int
    weight_kg: Optional[float]
    rpe: Optional[float]
    logged_at: datetime

    class Config:
        orm_mode = True

class SessionOut(BaseModel):
    id: str
    athlete_id: str
    routine_id: Optional[str]
    date: datetime
    notes: Optional[str]
    status: str
    sets: List[SetOut] = []

    class Config:
        orm_mode = True


class ProgressPoint(BaseModel):
    date: datetime
    max_weight: float
    max_weight_reps: int
    total_volume: float
    total_sets: int

class ExerciseProgress(BaseModel):
    exercise: ExerciseOut
    data_points: List[ProgressPoint]