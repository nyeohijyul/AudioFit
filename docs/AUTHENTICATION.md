---
name: 로그인 인증 기능
overview: AudioFit 백엔드의 Firebase 기반 로그인 인증 기능 구현 계획과 적용 방법을 정리합니다.
---

# 로그인 인증 기능

## 1. 다음 단계

네, 현재로서는 로그인 인증 기능이 다음으로 진행해야 할 적절한 작업입니다. 프론트엔드가 실제 사용자별 데이터를 사용할 수 있으려면, 먼저 백엔드에서 신뢰할 수 있는 인증 기반이 필요합니다.

## 2. 적용 목표

- Firebase Authentication을 사용해 사용자 로그인/회원가입을 클라이언트에서 처리합니다.
- 백엔드는 Firebase ID 토큰을 검증하고, 요청이 인증된 사용자로부터 왔다는 것을 보장합니다.
- 이후 루틴 생성, 보관함, 세션 저장 등 모든 사용자별 API는 이 인증 기반 위에서 동작합니다.

## 3. 인증 방식: Google OAuth

AudioFit은 Firebase의 Google OAuth를 사용하여 사용자 인증을 처리합니다. 
Google 계정으로 로그인하면 자동으로 사용자가 등록되고, 이후 API 호출 시 Firebase ID 토큰을 백엔드로 전달합니다.

## 4. 구현한 기능

### 4.1. 백엔드 인증 모듈

`backend/apps/users/authentication.py`에 Firebase ID 토큰 검증기(`FirebaseAuthentication`)를 추가했습니다.

- `Authorization: Bearer <Firebase ID Token>` 헤더를 해석합니다.
- Firebase Admin SDK로 토큰을 검증합니다.
- 검증된 토큰 정보를 기반으로 `request.user`를 구성합니다.

### 3.2. 인증 확인 엔드포인트

`backend/apps/users/views.py`에 토큰 확인 API를 추가했습니다.

- 경로: `GET /api/v1/auth/verify/`
- 요청 헤더: `Authorization: Bearer <token>`
- 응답 예시:
  ```json
  {
    "uid": "firebase-user-uid",
    "email": "user@example.com",
    "name": "사용자 이름"
  }
  ```

### 3.3. Django 프로젝트 통합

- `backend/audiofit/settings.py`에 `apps.users`를 `INSTALLED_APPS`에 추가했습니다.
- 인증 방식으로 `apps.users.authentication.FirebaseAuthentication`을 사용하도록 `REST_FRAMEWORK`를 구성했습니다.
- `backend/audiofit/urls.py`에 `/api/v1/auth/` 경로를 추가했습니다.

### 3.4. 환경 변수

`backend/.env.example`에 Firebase 서비스 계정 경로를 추가했습니다.

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

이 파일은 실제 서비스 계정 JSON 경로로 교체해야 합니다.

## 4. 설치 및 실행

### 4.1. 백엔드 의존성 설치

```bash
cd backend
pip install -r requirements.txt
```

### 4.2. Firebase 서비스 계정 준비

1. Firebase 콘솔에서 서비스 계정 키(JSON)를 생성합니다.
2. `backend/firebase-service-account.json`으로 저장하거나 경로를 지정합니다.
3. `.env`에 `FIREBASE_SERVICE_ACCOUNT_PATH`를 설정합니다.

### 4.3. 토큰 검증 테스트

```bash
cd backend
python manage.py runserver
```

그런 다음 다음과 같은 요청으로 확인합니다.

```bash
curl -H "Authorization: Bearer <Firebase ID Token>" http://localhost:8000/api/v1/auth/verify/
```

## 5. 프론트엔드 연결

프론트엔드에서 로그인 기능을 추가할 때 다음 흐름을 사용합니다.

1. Firebase Auth SDK로 사용자 로그인/회원가입 수행
2. Firebase ID 토큰을 받아서
3. 백엔드 API 요청에 `Authorization: Bearer <token>` 헤더 추가
4. 백엔드 `/api/v1/auth/verify/` 또는 보호된 API를 호출

### 5.1. 추가한 프론트엔드 구현

- `frontend/src/firebaseConfig.js`에서 Firebase 앱을 초기화합니다.
- `frontend/src/contexts/AuthContext.jsx`에서 인증 상태, Google 로그인/로그아웃 함수를 제공합니다.
- `frontend/src/components/screens/LoginScreen.jsx`에서 Google OAuth 기반 로그인 버튼을 표시합니다.
- `frontend/src/App.jsx`는 로그인 상태에 따라 로그인 화면 또는 메인 앱을 전환합니다.
- `frontend/src/components/AudioFitWireframe.jsx`와 `frontend/src/components/screens/MyPageScreen.jsx`에 사용자 정보와 로그아웃 버튼을 전달합니다.

### 5.2. 프론트엔드 환경 변수

`frontend/.env.example`에 다음을 추가했습니다.

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_API_BASE_URL=http://localhost:8000
```

### 5.3. 로컬 개발용 DB 의존성

현재 `backend/settings.py`는 기본 SQLite를 사용하므로 로컬 개발 환경에서는 `backend/requirements.txt`만 설치하면 됩니다.

`requirements.txt`에서 `Pillow`를 제거했습니다. 현재 백엔드 코드에는 이미지를 직접 처리하는 기능이 없기 때문에 로컬 설치 과정에서 불필요한 빌드 오류가 발생하는 요소를 제거했습니다.

PostgreSQL을 사용하려면 `backend/requirements-postgres.txt`를 설치하고, PostgreSQL 클라이언트가 시스템에 설치되어 있어야 합니다.

```bash
cd backend
pip install -r requirements-postgres.txt
```

## 6. 다음 작업

- 프론트엔드에 로그인/회원가입 화면 추가
- 로그인 상태를 관리하는 `AuthProvider` 구현
- 백엔드에서 인증된 사용자의 사용자 정보/설정 저장 API 추가
- `apps.users`에서 Firebase 토큰 기반 사용자 프로필 저장 기능 확장
