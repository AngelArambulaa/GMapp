# GymTrack

A full-stack gym training tracker for athletes and coaches.

## Stack
- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Python + FastAPI
- **Database**: MySQL

## Project Structure
## Setup

### Backend
```bash
cd GymTrack-api
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # Fill in your values
alembic upgrade head
python seed.py
uvicorn app.main:app --reload
```

### Frontend
```bash
cd GymTrack
npm install
cp .env.example .env         # Fill in your API URL
npm run dev
```

## Environment Variables

### Backend `.env`
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MySQL connection string |
| `SECRET_KEY` | Random string for JWT signing |
| `ALGORITHM` | JWT algorithm (HS256) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry in minutes |

### Frontend `.env`
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |