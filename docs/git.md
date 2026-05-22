1. git merge --squash dev
2. git reset --hard master
3. feat / fix / refactor / docs / chore

feat: implement bottom tab navigation
fix: resolve player screen overflow
refactor: split AudioPlayer into hooks
docs: add Git workflow guide
chore: configure Vercel deployment

# Git 사용 정리

## 1. branch 나누고 master(main)에 커밋 1개만 남기며 합치는 방법

추천 구조:

```txt
master(main) -> 배포용 안정 버전
dev          -> 개발용 브랜치
```

---

## 처음 브랜치 만들기

현재 master 기준으로 dev 생성:

```bash
git checkout -b dev
```

GitHub에도 업로드:

```bash
git push -u origin dev
```

---

## 개발은 dev 에서 진행

```bash
git checkout dev
```

작업 후:

```bash
git add .
git commit -m "feat: add login page"
```

여러 번 자유롭게 커밋해도 됨.

---

## master(main)에 최종 커밋 1개만 합치기

master 로 이동:

```bash
git checkout master
```

squash merge:

```bash
git merge --squash dev
```

커밋 생성:

```bash
git commit -m "feat: complete login feature"
```

GitHub 반영:

```bash
git push origin master
```

---

## squash merge 란?

dev 의 여러 커밋:

```txt
A - B - C - D
```

를:

```txt
A - E
```

처럼 최종 커밋 하나로 합쳐줌.

master 히스토리가 매우 깔끔해짐.

---

## merge 후 dev 동기화하기

안 하면 다음 merge 때 꼬일 수 있음.

```bash
git checkout dev
git reset --hard master
```

그러면:

```txt
master == dev
```

상태가 됨.

---

# 2. commit 메시지 작성 방법

보통:

```txt
타입: 설명
```

형식으로 작성함.

예시:

```bash
git commit -m "feat: add dark mode"
```

---

## 자주 사용하는 타입들

### feat

새 기능 추가

```txt
feat: add login screen
```

---

### fix

버그 수정

```txt
fix: resolve audio playback issue
```

---

### docs

문서 수정

```txt
docs: update README
```

---

### style

코드 스타일 수정
(동작 변화 없음)

```txt
style: format component spacing
```

---

### refactor

기능 변화 없이 코드 구조 개선

```txt
refactor: simplify audio state logic
```

---

### chore

잡일 / 설정 수정

```txt
chore: update .gitignore
```

예:

* npm 패키지 수정
* 설정 파일 수정
* 빌드 설정 변경

---

### test

테스트 추가/수정

```txt
test: add player component test
```

---

## 좋은 commit 메시지 팁

### 좋은 예

```txt
feat: add splash screen
fix: resolve mobile layout overflow
docs: add Git workflow guide
```

무엇을 했는지 바로 이해 가능.

---

### 안 좋은 예

```txt
update
fix
done
ㅇㅇ
```

나중에 기록 보기 힘들어짐.

---

# 3. 유용한 Git 팁들

## 현재 상태 보기

```bash
git status
```

제일 많이 사용하는 명령.

---

## commit 기록 보기

```bash
git log --oneline --graph --all
```

브랜치 구조 보기 매우 좋음.

---

## 브랜치 목록 보기

```bash
git branch
```

---

## 브랜치 이동

```bash
git checkout dev
```

---

## 새 브랜치 생성 + 이동

```bash
git checkout -b feature/login
```

---

## 원격(GitHub) 업로드

```bash
git push origin dev
```

---

## 최신 코드 가져오기

```bash
git pull
```

---

## 변경 파일 확인

```bash
git diff
```

---

## add 취소

```bash
git restore --staged 파일명
```

---

## 파일 변경 되돌리기

```bash
git restore 파일명
```

주의:
수정 내용이 사라짐.

---

## 마지막 commit 메시지 수정

```bash
git commit --amend
```

---

## .gitignore 중요

업로드하면 안 되는 파일 제외:

예시:

```txt
node_modules
.env
dist
```

특히 `.env` 는 절대 올리지 않기.

---

## 브랜치 이름 추천

```txt
dev
feature/login
feature/player-ui
fix/audio-bug
```

---

## 추천 워크플로우

```txt
1. dev 에서 작업
2. 여러 commit
3. 테스트 완료
4. master 로 이동
5. git merge --squash dev
6. 최종 commit 1개 생성
7. push
8. dev 를 master 기준으로 reset
```

---

## Vercel 과 함께 사용할 때 추천

```txt
master(main) -> Production 배포
dev          -> Preview 배포
```

브랜치별로 자동 배포됨.

---

## Git은 저장 기능이 아니다

Git의 핵심은:

```txt
"변경 기록 관리"
```

즉:

* 언제 무엇을 바꿨는지
* 왜 바꿨는지
* 어떻게 되돌릴지

를 관리하는 도구임.

commit 메시지를 잘 쓰면 미래의 자신이 편해진다.

네!
그건 보통 **Conventional Commits** 스타일이라고 불러요.
Git commit 메시지를 일정한 규칙으로 작성하는 방식입니다.

대표 형식:

```txt id="lx8v0y"
type: 설명
```

예:

```txt id="dzt1mf"
feat: add splash screen
fix: resolve audio autoplay bug
docs: update README
```

이렇게 쓰면:

* 기록 보기 쉬움
* 협업 편함
* 자동 changelog 생성 가능
* 나중에 검색하기 편함

장점이 많아요.

---

# 가장 많이 쓰는 타입들

## feat

새 기능 추가

```txt id="a5mbr0"
feat: add login screen
feat: implement dark mode
```

---

## fix

버그 수정

```txt id="v6s1ef"
fix: resolve navbar overlap issue
```

---

## docs

문서 수정

```txt id="9lyrzh"
docs: update installation guide
```

README, md 파일 수정 등.

---

## style

코드 스타일만 수정
(동작 변화 없음)

```txt id="syqv5c"
style: format component indentation
```

예:

* prettier 적용
* 세미콜론 정리
* 공백 수정

---

## refactor

기능 변화 없이 구조 개선

```txt id="l7k9n5"
refactor: simplify player state management
```

예:

* 함수 분리
* 코드 정리
* 구조 개선

---

## chore

기타 잡일/설정 수정

```txt id="pnj6d8"
chore: update vite config
chore: add gitignore
```

예:

* package 업데이트
* Vite 설정
* npm 설정
* build 설정

---

## test

테스트 관련

```txt id="jshnbo"
test: add player component tests
```

---

# 추가로 자주 쓰는 것들

## perf

성능 개선

```txt id="4j9myn"
perf: optimize image loading
```

---

## ci

CI/CD 설정

```txt id="79pd1u"
ci: add vercel deployment workflow
```

GitHub Actions 같은 것.

---

## build

빌드 시스템 관련

```txt id="y7e0q8"
build: configure vite aliases
```

---

## revert

이전 commit 되돌리기

```txt id="0v2shf"
revert: remove experimental player UI
```

---

# commit 메시지 작성 요령

## 좋은 방식

### 1. "무엇을 했는지" 쓰기

좋은 예:

```txt id="3lc2f2"
feat: add onboarding modal
fix: resolve mobile scrolling bug
```

나쁜 예:

```txt id="fjlwm0"
update
fix
done
```

---

## 2. 현재형 느낌으로 쓰기

보통:

```txt id="z2j7qk"
add
fix
update
remove
```

처럼 씀.

자연어 문장보다는 작업 기록 느낌.

---

## 3. 한 commit = 한 주제

좋은 예:

```txt id="axpj7r"
feat: add audio player controls
```

나쁜 예:

```txt id="4kqobm"
feat: add player and fix navbar and update README
```

너무 많은 작업이 섞임.

---

# 실전 예시 (사용자 프로젝트 느낌)

```txt id="4zq9h8"
feat: add routine creation screen
feat: implement bottom tab navigation
fix: resolve player screen overflow
refactor: split AudioPlayer into hooks
docs: add Git workflow guide
chore: configure Vercel deployment
```

이런 느낌이면 아주 깔끔합니다 👍

---

# 추가 팁

## scope 붙이기

원하면:

```txt id="8o8ekv"
feat(player): add repeat mode
fix(auth): resolve login redirect bug
```

처럼 어느 영역인지 표시 가능.

큰 프로젝트에서 많이 씁니다.

---

## 너무 작은 commit 남발은 피하기

```txt id="z1n6qt"
fix typo
fix typo again
fix typo real
```

이런 건 보기 힘들어져요.

관련 작업은 적당히 묶는 게 좋아요.

---

## commit은 "저장"이 아니라 "기록"

이 감각이 중요해요.

즉:

```txt id="g9s70h"
"이 시점에서 어떤 의미 있는 변화가 있었는가?"
```

를 남기는 거예요.

그래서:

* 기능 단위
* 수정 단위
* 리팩토링 단위

로 commit 하면 나중에 엄청 편해집니다.
