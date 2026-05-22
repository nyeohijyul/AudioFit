# Git 브랜치 전략 (AudioFit)

## 브랜치 역할

| 브랜치 | 용도 | 커밋 이력 |
|--------|------|-----------|
| **master** | 배포·기준 버전 (안정 스냅샷) | 1개 — 현재 앱 전체 상태 |
| **dev** | 일상 개발 | 19개+ — 파일별·단계별 개발 이력 |

## 일반적인 작업 흐름

```bash
# 개발은 항상 dev에서
git checkout dev

# 기능 작업 후 커밋
git add .
git commit -m "feat: 설명"

# 기준 버전을 갱신할 때만 master 반영 (예: v1.1 릴리스)
git checkout master
git merge dev          # 또는 squash merge로 이력 1개로 정리
```

## 기능 브랜치 (선택, 규모가 커질 때)

```text
dev
 └── feature/플레이어-api
 └── fix/탭바-레이아웃
```

- `feature/…` : 새 기능
- `fix/…` : 버그 수정
- 작업 후 `dev`로 merge → 검증 후 필요 시 `master` 반영

## master를 “맨 처음 버전”으로 유지하는 이유

- `master` = “지금 동작하는 완성본” 한 커밋으로 보기 쉬움
- `dev` = 왜·어떻게 바뀌었는지 파일 단위 이력 보존

## 유용한 명령

```bash
git log --oneline master    # 기준 버전 (짧음)
git log --oneline dev       # 개발 이력 (김)
git diff master..dev        # 두 브랜치 차이 (보통 없음 = 같은 코드)
```
