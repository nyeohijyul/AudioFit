# AudioFit Monorepo

[나만의 홈트 라디오](https://audio-fit.vercel.app/)

---
파이썬프로그래밍 - 바이브코딩 프로젝트

## 📁 프로젝트 구조 (Monorepo)

```
AudioFit/
├── frontend/          # React + Vite 프론트엔드
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/           # Django 백엔드 API
│   ├── audiofit/      # Django 프로젝트 설정
│   ├── apps/          # Django 앱들
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
├── docs/
└── package.json (루트)
```

## 🚀 시작하기

### 프론트엔드 설정 (React)

```bash
# 프론트엔드 의존성 설치
npm run frontend:install

# 개발 서버 실행 (포트 5173)
npm run frontend:dev

# 프로덕션 빌드
npm run frontend:build
```

### 백엔드 설정 (Django)

#### Windows

```bash
# 가상환경 생성 및 활성화
cd backend
python -m venv venv
.\venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 마이그레이션
python manage.py migrate

# 슈퍼유저 생성
python manage.py createsuperuser

# 개발 서버 실행 (포트 8000)
python manage.py runserver
```

#### macOS / Linux

```bash
# 가상환경 생성 및 활성화
cd backend
python -m venv venv
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 마이그레이션
python manage.py migrate

# 슈퍼유저 생성
python manage.py createsuperuser

# 개발 서버 실행 (포트 8000)
python manage.py runserver
```

## 🔧 환경 설정

백엔드 환경 변수 설정:

```bash
cd backend
cp .env.example .env
# .env 파일 수정
```

## 📚 API 엔드포인트

- 관리자 패널: `http://localhost:8000/admin/`
- API: `http://localhost:8000/api/`

## 🌐 CORS 설정

프론트엔드와 백엔드의 통신을 위해 CORS가 설정되어 있습니다.
- 프론트엔드: `http://localhost:5173`
- 백엔드: `http://localhost:8000`

## 📦 사용 기술

### Frontend
- React 18
- Vite
- CSS3

### Backend
- Django 4.2
- Django REST Framework
- PostgreSQL (프로덕션)
- SQLite (개발)