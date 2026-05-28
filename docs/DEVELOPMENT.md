# 모노레포 개발 가이드

AudioFit 프로젝트는 모노레포 구조로 프론트엔드(React)와 백엔드(Django)를 함께 관리합니다.

## 📋 프로젝트 구조

```
AudioFit/
├── frontend/           # React + Vite 프론트엔드
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.js
├── backend/            # Django REST API
│   ├── audiofit/       # Django 프로젝트
│   ├── apps/           # Django 앱들
│   ├── Dockerfile
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
├── docs/
├── docker-compose.yml  # 로컬 개발용
└── package.json        # 루트 스크립트
```

## 🚀 로컬 개발 환경 설정

### 방법 1: Docker Compose (권장)

**장점**: 환경 설정이 간단하고 일관성 있음

```bash
# 컨테이너 빌드 및 실행
docker-compose up

# 초기 설정 (새 터미널에서)
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

**접속**:
- 프론트엔드: http://localhost:5173
- 백엔드 API: http://localhost:8000/api/
- 관리자 패널: http://localhost:8000/admin/

### 방법 2: 로컬 설정 (상세 제어)

#### 백엔드 (Django)

```bash
# 백엔드 디렉토리로 이동
cd backend

# Windows
python -m venv venv
.\venv\Scripts\activate

# macOS / Linux
python -m venv venv
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp .env.example .env
# .env 파일 편집 후 설정값 입력

# 데이터베이스 마이그레이션
python manage.py migrate

# 슈퍼유저 생성
python manage.py createsuperuser

# 개발 서버 실행
python manage.py runserver
```

#### 프론트엔드 (React)

다른 터미널 창에서:

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치 (처음만)
npm install

# 개발 서버 실행
npm run dev
```

**접속**: http://localhost:5173

## 🔗 API 통신

프론트엔드에서 백엔드 API로 요청할 때:

```javascript
// 환경 변수 설정 (frontend/.env)
VITE_API_URL=http://localhost:8000

// 예제 요청
const response = await fetch(`${import.meta.env.VITE_API_URL}/api/routines/`);
```

## 📝 주요 명령어

### 루트에서 (package.json)

```bash
# 프론트엔드만 실행
npm run frontend:dev

# 프론트엔드 빌드
npm run frontend:build

# 백엔드 빌드/실행 설정
npm run backend:setup
npm run backend:dev
npm run backend:migrate
```

### 백엔드에서

```bash
# 마이그레이션 생성
python manage.py makemigrations

# 마이그레이션 적용
python manage.py migrate

# 정적 파일 수집
python manage.py collectstatic

# 셸 접속
python manage.py shell

# 테스트 실행
python manage.py test
```

### 프론트엔드에서

```bash
# 빌드
npm run build

# 프리뷰
npm run preview

# Lint 검사
npm run lint
```

## 🗃️ 데이터베이스

### 개발 환경
- **기본**: SQLite (`db.sqlite3`)
- **선택**: PostgreSQL (Docker Compose)

### 마이그레이션 워크플로우

```bash
cd backend

# 모델 변경 후
python manage.py makemigrations

# 마이그레이션 적용
python manage.py migrate

# 마이그레이션 상태 확인
python manage.py showmigrations
```

## 🔐 환경 변수

### backend/.env
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
DATABASE_URL=sqlite:///db.sqlite3
```

### frontend/.env.local
```env
VITE_API_URL=http://localhost:8000
```

## 🐛 트러블슈팅

### Django 마이그레이션 오류
```bash
# 마이그레이션 초기화 (개발 환경만)
python manage.py migrate audiofit zero
python manage.py migrate
```

### CORS 오류
- 백엔드의 `settings.py`에서 `CORS_ALLOWED_ORIGINS` 확인
- 프론트엔드 URL이 포함되어 있는지 확인

### 포트 충돌
```bash
# macOS/Linux: 포트 확인
lsof -i :8000
lsof -i :5173

# Windows: 포트 확인
netstat -ano | findstr :8000
netstat -ano | findstr :5173
```

## 📚 참고 자료

- [Django 공식 문서](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Vite 문서](https://vitejs.dev/)
- [React 문서](https://react.dev/)

## 🤝 기여 가이드

1. 새 브랜치 생성: `git checkout -b feature/feature-name`
2. 변경사항 커밋: `git commit -m "feat: description"`
3. 브랜치 푸시: `git push origin feature/feature-name`
4. Pull Request 생성

## 📞 지원

문제가 발생하면:
1. 기존 Issue 검색
2. 새 Issue 생성 (에러 메시지와 환경 정보 포함)
3. 토론 섹션에서 질문
