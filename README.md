# AudioFit (나만의 홈트 라디오)

[AudioFit 배포 링크](https://audio-fit.vercel.app/)
[와이어프레임 링크](https://github.com/nyeohijyul/python-project-wireframe)

AudioFit은 유튜브 운동 영상의 자막을 추출하고 AI로 정제하여, 사용자 맞춤형 오디오 홈트레이닝 환경을 제공하는 서비스입니다. 사용자는 원하는 유튜브 영상의 안내 자막을 기반으로 루틴을 구성하고, TTS(Text-To-Speech) 음성 가이드와 타이머를 통해 화면을 보지 않고도 운동에 집중할 수 있는 '홈트 라디오' 환경을 경험할 수 있습니다.

---
파이썬프로그래밍 - 바이브코딩 프로젝트

## 로컬 실행 가이드
1. Node.js 설치
2. Python 설치
3. 루트 폴더에서 cmd 창 열고 다음 명령어 실행
> cd frontend

> npm install

> npm run dev

4. 두번째 cmd 창 열고 다음 명령어 실행
> cd backend

> venv\Scripts\activate

> pip install -r requirements.txt

> python manage.py runserver

5. http://localhost:5173/ 접속

## 📁 프로젝트 구조 (Monorepo)

```
AudioFit/
├── frontend/          # React + Vite 프론트엔드
│   ├── src/
│   │   ├── components/  # 공통 컴포넌트 및 화면 컴포넌트
│   │   ├── contexts/    # React Context (인증 등)
│   │   ├── hooks/       # 커스텀 훅
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/           # Django 백엔드 API
│   ├── audiofit/      # Django 프로젝트 설정
│   ├── apps/          # 서비스 비즈니스 로직 앱
│   │   ├── clips/     # 자막 추출, 정제, TTS 생성 및 루틴 관리
│   │   └── users/     # 사용자 인증 및 관리
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
├── docs/              # 프로젝트 문서
└── package.json (루트)  # 모노레포 관리 스크립트
```

---

## 🌟 주요 기능

### 1. 유튜브 자막 추출 및 AI 정제
- **자막 추출**: 유튜브 URL 입력 시 비디오 ID를 분석하고, 해당 영상의 자막 데이터를 자동으로 추출하여 저장합니다.
- **Gemini AI 자막 정제**: 길고 가독성이 떨어지는 유튜브의 자동 생성 자막을 Gemini AI를 통해 핵심 운동 안내 위주의 간결한 문장으로 요약 및 단순화합니다.

### 2. 커스텀 자막 에디터
- **단계별 자막 편집**: 추출된 자막 데이터의 시간 범위와 텍스트 내용을 사용자가 직접 세밀하게 수정할 수 있습니다.
- **운동 동작 구성**: 운동명, 설명, 노출 시간을 시각적으로 편집하여 나만의 동작 가이드를 만듭니다.

### 3. 나만의 운동 루틴 관리
- **루틴 생성**: 개별 편집된 클립들을 엮어 하나의 일관된 홈트레이닝 루틴(예: 아침 5분 코어 깨우기, 전신 홈트 30분)으로 생성하고 저장합니다.
- **보관함 보관**: 작성한 루틴을 보관함에서 확인하고 필요할 때마다 간편하게 재생할 수 있습니다.

### 4. 도넛 타이머 & 오디오 가이드 플레이어
- **도넛 타이머**: 원형 SVG 프로그레스 타이머를 통해 현재 동작의 남은 시간을 직관적으로 제공합니다.
- **Google Cloud TTS 음성 코칭**: 동작이 시작될 때 운동 설명을 부드러운 목소리의 한국어 음성(TTS)으로 재생하여, 사용자가 화면을 보지 않고 귀로 들으며 운동 동작을 따라 할 수 있습니다.

### 5. 크로스 플랫폼 사용자 인증
- **Firebase Auth**: Firebase를 통한 간편하고 안전한 소셜 로그인 및 사용자 인증을 처리합니다.
- **Django 연동**: Firebase 토큰을 검증하고 장고 백엔드 데이터베이스와 사용자를 매핑하여 안전하게 개인 데이터를 관리합니다.

---

## 🔧 기술 스택

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Vanilla CSS (커스텀 테마 반영)
- **State & Router**: Context API 기반 상태 관리

### Backend
- **Framework**: Django 4.2
- **Toolkit**: Django REST Framework (DRF)
- **Database**: SQLite (개발용), PostgreSQL (프로덕션 환경)
- **AI & API Integration**: Gemini API, Google Cloud Text-to-Speech API, YouTube Transcript API

---

## 🚀 시작하기

### 1. 사전 요구사항
- Node.js (v18 이상 권장)
- Python 3.10 이상

### 2. 프론트엔드 설정 (React)

```bash
# 프론트엔드 의존성 설치
npm run frontend:install

# 개발 서버 실행 (포트 5173)
npm run frontend:dev

# 프로덕션 빌드
npm run frontend:build
```

### 3. 백엔드 설정 (Django)

#### 환경 변수 작성 (`backend/.env`)
`backend/.env.example` 파일을 바탕으로 `backend/.env` 파일을 생성하고 필요한 API Key 및 서비스 계정 파일 정보를 입력합니다.
- Firebase Admin SDK 설정
- Google Cloud TTS 서비스 계정 JSON 경로
- Gemini API Key

#### 가상환경 구성 및 마이그레이션 (Windows)
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 마이그레이션 실행
python manage.py migrate

# 슈퍼유저(관리자) 생성
python manage.py createsuperuser

# 개발 서버 실행 (포트 8000)
python manage.py runserver
```

#### 가상환경 구성 및 마이그레이션 (macOS / Linux)
```bash
cd backend
python -m venv venv
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 마이그레이션 실행
python manage.py migrate

# 슈퍼유저 생성
python manage.py createsuperuser

# 개발 서버 실행
python manage.py runserver
```

---

## 📚 주요 API 엔드포인트

- **관리자 패널**: `http://localhost:8000/admin/`
- **유튜브 자막 추출**: `POST /api/clips/transcript/`
- **자막 정제 (AI)**: `POST /api/clips/simplify-subtitles/`
- **TTS 오디오 파일 요청**: `POST /api/clips/generate-speech/`
- **사용자 루틴 목록**: `GET /api/routines/`

---

## 🌐 CORS 및 통신
- 로컬 환경의 프론트엔드 개발 서버(`http://localhost:5173`)와 백엔드 API 서버(`http://localhost:8000`) 간의 리소스 공유를 허용하도록 Django Settings 내 CORS 헤더가 구성되어 있습니다.