from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, exercises, routines, sessions, users

app = FastAPI(title="GymTrack API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                   "http://10.0.0.13:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(exercises.router)
app.include_router(routines.router)
app.include_router(sessions.router)
app.include_router(users.router)

@app.get("/health")
def health():
    return {"status": "ok"}