import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.db.session import SessionLocal
from app.models.all import Exercise

EXERCISES = [
    dict(name="Bench Press",             muscle_group="Chest",     exercise_type="strength"),
    dict(name="Incline Dumbbell Press",  muscle_group="Chest",     exercise_type="strength"),
    dict(name="Cable Fly",               muscle_group="Chest",     exercise_type="strength"),
    dict(name="Push-up",                 muscle_group="Chest",     exercise_type="strength"),
    dict(name="Deadlift",                muscle_group="Back",      exercise_type="strength"),
    dict(name="Pull-up",                 muscle_group="Back",      exercise_type="strength"),
    dict(name="Barbell Row",             muscle_group="Back",      exercise_type="strength"),
    dict(name="Lat Pulldown",            muscle_group="Back",      exercise_type="strength"),
    dict(name="Seated Cable Row",        muscle_group="Back",      exercise_type="strength"),
    dict(name="Squat",                   muscle_group="Legs",      exercise_type="strength"),
    dict(name="Romanian Deadlift",       muscle_group="Legs",      exercise_type="strength"),
    dict(name="Leg Press",               muscle_group="Legs",      exercise_type="strength"),
    dict(name="Leg Curl",                muscle_group="Legs",      exercise_type="strength"),
    dict(name="Leg Extension",           muscle_group="Legs",      exercise_type="strength"),
    dict(name="Calf Raise",              muscle_group="Legs",      exercise_type="strength"),
    dict(name="Lunges",                  muscle_group="Legs",      exercise_type="strength"),
    dict(name="Bulgarian Split Squat",   muscle_group="Legs",      exercise_type="strength"),
    dict(name="Hip Thrust",              muscle_group="Legs",      exercise_type="strength"),
    dict(name="Overhead Press",          muscle_group="Shoulders", exercise_type="strength"),
    dict(name="Dumbbell Shoulder Press", muscle_group="Shoulders", exercise_type="strength"),
    dict(name="Lateral Raise",           muscle_group="Shoulders", exercise_type="strength"),
    dict(name="Face Pull",               muscle_group="Shoulders", exercise_type="strength"),
    dict(name="Barbell Curl",            muscle_group="Biceps",    exercise_type="strength"),
    dict(name="Dumbbell Curl",           muscle_group="Biceps",    exercise_type="strength"),
    dict(name="Hammer Curl",             muscle_group="Biceps",    exercise_type="strength"),
    dict(name="Tricep Pushdown",         muscle_group="Triceps",   exercise_type="strength"),
    dict(name="Skull Crusher",           muscle_group="Triceps",   exercise_type="strength"),
    dict(name="Dips",                    muscle_group="Triceps",   exercise_type="strength"),
    dict(name="Plank",                   muscle_group="Core",      exercise_type="strength"),
    dict(name="Ab Rollout",              muscle_group="Core",      exercise_type="strength"),
    dict(name="Cable Crunch",            muscle_group="Core",      exercise_type="strength"),
    dict(name="Treadmill Run",           muscle_group="Cardio",    exercise_type="cardio"),
    dict(name="Stationary Bike",         muscle_group="Cardio",    exercise_type="cardio"),
    dict(name="Rowing Machine",          muscle_group="Cardio",    exercise_type="cardio"),
]

def seed():
    db = SessionLocal()
    added = 0
    for data in EXERCISES:
        if not db.query(Exercise).filter(Exercise.name == data["name"]).first():
            db.add(Exercise(**data))
            added += 1
    db.commit()
    db.close()
    print(f"✓ Seeded {added} exercises")

if __name__ == "__main__":
    seed()