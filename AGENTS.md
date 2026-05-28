# Agent Guidance for AudioFit Monorepo

This document provides essential, repo-specific information for agents working within the AudioFit monorepo.

## Project Structure

The repository follows a monorepo structure with distinct `frontend` and `backend` directories.

- **`frontend/`**: Contains the React + Vite application.
- **`backend/`**: Contains the Django API.

## Project Structure

The repository follows a monorepo structure with distinct `frontend` and `backend` directories.

- **`frontend/`**: Contains the React + Vite application.
- **`backend/`**: Contains the Django API.

## Core Commands

### Frontend (React/Vite)

- **Install dependencies:** `npm run frontend:install`
- **Start development server:** `npm run frontend:dev` (runs on port 5173)
- **Build for production:** `npm run frontend:build`
- **Preview production build:** `npm run frontend:preview`

### Backend (Django)

**Setup (Windows):**
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

**Setup (macOS/Linux):**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

- **Start development server:** `python manage.py runserver` (runs on port 8000)
- **Run migrations:** `python manage.py migrate`
- **Create superuser:** `python manage.py createsuperuser`
- **Collect static files:** `python manage.py collectstatic`

### Environment Variables

- Backend environment variables are configured in `backend/.env` (based on `.env.example`).

## Important Notes

- **Monorepo Scripts:** The root `package.json` provides convenience scripts like `npm run dev` (which maps to `frontend:dev`) and `npm run build` (which maps to `frontend:build`).
- **CORS:** Cross-Origin Resource Sharing (CORS) is configured for communication between `http://localhost:5173` (frontend) and `http://localhost:8000` (backend).
- **Admin Panel:** Accessible at `http://localhost:8000/admin/`.
- **API Endpoints:** Available at `http://localhost:8000/api/`.

## Verification

- **Frontend Dev Server:** Check `http://localhost:5173`.
- **Backend Dev Server:** Check `http://localhost:8000`.
- **Admin Panel:** Check `http://localhost:8000/admin/`.
