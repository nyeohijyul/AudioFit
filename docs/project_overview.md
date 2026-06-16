# 🎙 AudioFit 프로젝트 개요 및 로컬 실행 가이드

AudioFit은 사용자의 조건(체력 상태, 운동 시간, 선호/비선호 부위 등)에 맞춰 운동 동작과 유튜브 영상을 추천하고, 화면을 보지 않고 귀로 들으며 운동할 수 있도록 한국어 음성(TTS) 코칭 및 원형 SVG 타이머를 제공하는 나만의 홈트 라디오 웹 서비스입니다.

---

## ✨ 핵심 기능

1. **맞춤형 운동 루틴 추천**
   - 사용자 설문(목표, 시간, 레벨, 타겟 부위, 비선호 부위)을 분석하여 최적의 맨몸 운동 목록(ExerciseDB 연동)과 추천 유튜브 영상을 반환합니다.
2. **동작 편집 및 자막 생성**
   - 추천 영상의 상세 자막을 사용자가 직접 편집할 수 있으며, Gemini AI를 사용하여 자막 내용을 이해하기 쉬운 코칭 텍스트로 단순화(Simplify)합니다.
3. **오디오 가이드 플레이어 & 도넛 타이머**
   - 각 운동 동작이 바뀔 때마다 **Google Cloud TTS**를 이용한 고품질 한국어 코칭 음성이 재생됩니다.
   - 동작 시작 전 설명 오디오를 일시정지(Pause)/재개(Resume)하는 오디오 제어가 가능합니다.
   - 원형 SVG 도넛 타이머를 통해 현재 운동의 경과를 모바일 화면에 최적화하여 렌더링합니다.
4. **Firebase Auth 사용자 연동**
   - Firebase를 사용하여 간편하고 안전하게 소셜 로그인을 제공하고, 장고(Django) 백엔드와 연동하여 개인화된 루틴 및 운동 기록을 관리합니다.

---

## 🛠 시스템 아키텍처 및 폴더 구조

AudioFit은 프론트엔드와 백엔드를 통합 관리하는 **모노레포(Monorepo)** 구조로 설계되었습니다.

```text
AudioFit/
├── frontend/           # React + Vite 프론트엔드 서비스 (Port: 5173)
│   ├── src/
│   │   ├── components/ # 화면 및 모달 UI 컴포넌트
│   │   ├── contexts/   # Auth 컨텍스트 (Firebase 연동)
│   │   └── hooks/      # 오디오 플레이어/TTS 제어 훅 등
│   ├── vite.config.js
│   └── package.json
├── backend/            # Django REST API 백엔드 서비스 (Port: 8000)
│   ├── audiofit/       # Django 프로젝트 설정 폴더
│   ├── apps/           # 기능별 Django 앱 (clips, exercises, users 등)
│   │   ├── clips/      # 자막 추출, 재생 및 루틴 제어 API
│   │   ├── exercises/  # 운동 정보 및 관련 유튜브 매핑 API
│   │   └── users/      # 사용자 관리 API
│   ├── requirements.txt
│   └── manage.py
├── docs/               # 설계서 및 가이드 문서 폴더
├── docker-compose.yml  # 도커 컨테이너 정의 파일 (로컬 개발용)
└── package.json        # 모노레포 관리 루트 스크립트
```

---

## 🚀 로컬 환경 실행 가이드

로컬 환경에서 개발 서버를 구동하기 위한 환경 설정 및 실행 방법입니다.

### 1. 환경 변수(.env) 설정

프로젝트를 실행하기 전, 프론트엔드와 백엔드 디렉토리에 각각 환경 변수 파일을 생성하고 필요한 값을 입력해야 합니다.

#### 🔹 Backend 설정 (`backend/.env`)
`backend/.env.example` 파일을 복사하여 `backend/.env` 파일을 생성하고 설정을 입력합니다.

```env
# Django 기본 설정
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# 외부 API 연동 설정 (필요시 채워 넣습니다)
GEMINI_API_KEY=your-gemini-api-key
YOUTUBE_API_KEY=your-youtube-api-key
```

#### 🔹 Frontend 설정 (`frontend/.env`)
`frontend/` 폴더 내에 `.env` 파일을 생성하고 아래 내용을 설정합니다.

```env
# 백엔드 API 서버 URL 주소
VITE_API_BASE_URL=http://localhost:8000
VITE_YOUTUBE_API_KEY=your-youtube-api-key

# Firebase 설정 정보 (Firebase 콘솔 웹앱 설정에서 획득 가능)
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
VITE_FIREBASE_APP_ID=your-firebase-app-id
```

---

### 2. 패키지 설치 및 실행 방법

#### 💡 방법 A. Docker Compose로 빠르게 실행하기 (권장)
설치 과정 없이 Docker 컨테이너 상에서 전체 서비스를 한 번에 구동할 수 있습니다.

```bash
# 컨테이너 빌드 및 백그라운드 실행
docker-compose up -d

# 백엔드 초기 스키마 적용 및 관리자 생성 (새 터미널 열기)
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

* **프론트엔드**: [http://localhost:5173](http://localhost:5173)
* **백엔드 API**: [http://localhost:8000/api/](http://localhost:8000/api/)
* **관리자 패널**: [http://localhost:8000/admin/](http://localhost:8000/admin/)

---

#### 💡 방법 B. 로컬 시스템에서 개별 실행하기

##### 1️⃣ 백엔드 (Django) 설정 및 구동
```bash
# 1. backend 디렉토리로 이동
cd backend

# 2. 가상환경 생성 및 활성화
# (Windows)
python -m venv venv
.\venv\Scripts\activate

# (macOS / Linux)
python -m venv venv
source venv/bin/activate

# 3. 의존성 설치
pip install -r requirements.txt

# 4. 데이터베이스 마이그레이션 적용
python manage.py migrate

# 5. 관리자 계정 생성 (선택 사항)
python manage.py createsuperuser

# 6. Django 개발 서버 실행
python manage.py runserver
```

##### 2️⃣ 프론트엔드 (React + Vite) 설정 및 구동
새로운 터미널 창을 열고 아래 명령어를 순서대로 실행합니다.

```bash
# 1. frontend 디렉토리로 이동
cd frontend

# 2. 패키지 및 의존성 라이브러리 설치
npm install

# 3. Vite 개발 서버 실행
npm run dev
```

* **프론트엔드 접속 주소**: [http://localhost:5173](http://localhost:5173)
