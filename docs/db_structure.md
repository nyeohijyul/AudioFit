# AudioFit MongoDB 데이터베이스 구조 설계서

본 문서는 `docs/PLAN.md`에 기술된 요구사항 및 추가 요구사항(유저별 정보, 루틴 목록, TTS 자막 데이터, 공개여부 등)을 반영한 MongoDB 스키마 상세 구조 설계서입니다.

---

## 1. 요구사항 매핑 (Requirements Mapping)

| 요구 조건 | 구현 컬렉션 및 필드 | 설명 |
| :--- | :--- | :--- |
| **유저이름(수정가능)** | `users.display_name` | 사용자의 닉네임으로 마이페이지 등에서 자유롭게 수정 가능합니다. |
| **유저가 저장한 루틴이름** | `routines.name` | 각 유저가 생성 및 저장한 운동 루틴의 고유 이름입니다. |
| **루틴마다 해당하는 동작 목록** | `exercises` 컬렉션의 문서들 | 특정 `routine_id`를 참조하는 1:N 관계의 운동 상세 목록입니다. |
| **동작마다 TTS를 사용할 자막데이터** | `exercises.coaching_text` | 유튜브 자막을 AI가 정제하여 가공한 음성 코칭용 텍스트 대사입니다. |
| **루틴의 공개여부** | `routines.is_public` | 루틴을 타인에게 노출할지 결정하는 여부로 Boolean 값으로 정의됩니다. |

---

## 2. 컬렉션별 상세 스키마 (Collection Schemas)

### ① `users` 컬렉션
사용자의 계정 정보 및 개인 설정을 보관합니다. (비밀번호는 Firebase Authentication에서 관리하므로 저장하지 않습니다.)

```json
{
  "_id": "ObjectId",
  "firebase_uid": "String (예: 'uR2h93Kl...')", // Firebase 고유 ID (인덱싱)
  "display_name": "String (예: '홍길동')",       // 유저이름 (수정 가능)
  "fitness_level": "String (예: 'beginner')",   // 체력 레벨 ('beginner', 'intermediate', 'advanced')
  "settings": {                                 // 개인별 추가 설정 옵션
    "theme": "String",
    "tts_voice": "String"
  },
  "created_at": "ISODate"                       // 가입일시
}
```

---

### ② `routines` 컬렉션
사용자가 직접 생성하거나 담은 루틴의 메타데이터를 저장합니다.

```json
{
  "_id": "ObjectId",
  "user_id": "String (firebase_uid 참조)",       // 루틴 소유자 ID
  "name": "String (예: '아침 잠 깨우는 10분 스트레칭')", // 루틴이름
  "is_public": "Boolean (기본값: false)",       // 루틴의 공개여부 (True: 공개, False: 비공개)
  "translate_mode": "Boolean",                  // 초보자용 번역/해설 모드 사용 여부
  "status": "String (예: 'ready')",             // 생성 상태 ('pending', 'ready', 'failed')
  "total_duration_sec": "Number (예: 600)",     // 전체 운동 시간 (초)
  "created_at": "ISODate"                       // 생성일시
}
```

---

### ③ `exercises` 컬렉션
각 루틴을 구성하는 세부 동작 목록입니다. 루틴(`routines`)과 1:N 관계를 가집니다.

```json
{
  "_id": "ObjectId",
  "routine_id": "ObjectId (routines._id 참조)", // 소속된 루틴의 ID (인덱싱)
  "order": "Number (예: 1)",                     // 루틴 내 동작 재생 순서
  "name": "String (예: '스쿼트')",               // 동작 이름
  "instruction": "String",                      // 동작 설명 (상세)
  "instruction_easy": "String (Null 허용)",      // 초보자용 번역설명 (translate_mode 활성화 시)
  "duration_sec": "Number (예: 45)",             // 해당 동작 지속 시간
  "coaching_text": "String"                     // 동작마다 TTS로 재생할 자막데이터
}
```

---

### ④ `routine_clips` 컬렉션
루틴 생성에 사용된 유튜브 영상 정보와 자막 추출 구간 설정입니다.

```json
{
  "_id": "ObjectId",
  "routine_id": "ObjectId (routines._id 참조)", 
  "clip_id": "ObjectId (video_clips._id 참조)",  // 원본 유튜브 영상 ID
  "start_sec": "Number (예: 120)",              // 클립 시작 구간 (초)
  "end_sec": "Number (예: 300)",                // 클립 종료 구간 (초)
  "order": "Number"                             // 다중 클립 시 매핑 순서
}
```

---

### ⑤ `video_clips` 컬렉션
한 번 가져온 유튜브 자막 데이터를 보관(캐싱)하여 중복 API 요청 및 LLM 비용을 최소화합니다.

```json
{
  "_id": "ObjectId",
  "user_id": "String (최초 수집 유저 ID)",
  "youtube_url": "String",
  "video_id": "String (예: 'dQw4w9WgXcQ')",
  "title": "String",
  "duration_sec": "Number",
  "transcript_raw": [                          // 자막 원본 데이터 배열
    {
      "text": "String",
      "start": "Float",
      "duration": "Float"
    }
  ],
  "created_at": "ISODate"
}
```
