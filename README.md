# Reclog — 기억 로깅 서비스

일상과 여행의 순간을 카테고리별로 기록하고, 공유 스페이스에서 함께 모으며, AI 손글씨로 감성적인 포토북을 만드는 서비스입니다.

---

## 서비스 소개

**대상 사용자**: 여행·일상 기록을 남기고 싶은 개인, 친구·커플·가족 단위의 공유 기록 사용자

### 핵심 기능

- **기록 CRUD** — 사진·텍스트·태그·위치·날짜를 담은 기록 작성/조회/수정/삭제
- **카테고리 관리** — 이모지와 이름으로 커스텀 카테고리 생성 및 정렬
- **공유 스페이스** — 6자리 코드로 입장하는 공동 기록 공간 (멤버 전원 업로드 가능)
- **AI 손글씨 포토북** — OpenAI `gpt-image-1`로 사진 위에 손글씨 감성 텍스트를 합성한 포토북 생성 (일 5회 제한)
- **캘린더 / 통계** — 월별 기록 히트맵, 카테고리 비율 파이차트, 태그 순위
- **구독 플랜** — 무료(Lv1) / 프리미엄(Lv2) 구독 관리 페이지

---

## 실행 방법 (Docker)

### 사전 준비

`.env.example`을 복사하여 `.env`를 생성하고 각 값을 채워 주세요.
`.env`는 메일로 별도 제출했습니다.

```bash
cp .env.example .env
```
```bash
docker compose up --build
```

### 실행

- 백엔드: `http://localhost:8000`
- 프론트엔드: `http://localhost:3000`

### 포트 변경

`.env`에서 포트를 변경할 수 있습니다.

```env
BACKEND_PORT=9000
FRONTEND_PORT=4000
NEXT_PUBLIC_API_URL=http://localhost:9000
FRONTEND_URL=http://localhost:4000
```

### 테스트 계정

| 항목 | 값 |
|---|---|
| 이메일 | `test@reclog.dev` |
| 비밀번호 | `reclog1234!` |

"바로 시작하기" 버튼으로 데모 테스트 가능

---

## 완성한 레벨

| 레벨 | 완성 여부 | 내용 |
|---|---|---|
| **Lv 1** | ✅ 완성 | 회원가입·로그인, 기록 CRUD, 카테고리 관리, 이미지 업로드, 공유 스페이스 |
| **Lv 2** | ✅ 완성 | AI 손글씨 포토북 생성 (gpt-image-1), 포토북 주문 내역 관리, 구독 플랜 페이지, 캘린더·통계 페이지, 프로필 편집 |
| **Lv 3** | ⬜ 미완성 | — |

### Lv1 세부 구현

- Supabase Auth 기반 JWT 인증 (ES256 JWKS, 24시간 캐시)
- 기록: 다중 이미지, 태그, 위치(카카오 주소 검색), 날짜
- 카테고리: 카테고리명 변경/편집/삭제 가능, 순서 수동 변경, 기록 수 카운트
- 공유 스페이스: 6자리 랜덤 코드 생성·참가, 멤버 수 표시, 권한 체크

### Lv2 세부 구현

- AI 포토북: 사진 위 손글씨 텍스트 합성, 일일 사용 횟수 DB 원자적 upsert로 레이스 컨디션 방지
- 통계: 카테고리별 기록 수, 자주 쓴 태그 Top 10, 월별 히트맵
- 프로필: 닉네임·프로필 사진 편집/삭제

---

## 기술 스택 및 아키텍처

### 스택

| 영역 | 기술 | 선택 이유 |
|---|---|---|
| **백엔드** | FastAPI + SQLAlchemy 2.0 (async) | 빠른 비동기 처리, 자동 OpenAPI 문서 |
| **DB / Auth / Storage** | Supabase (PostgreSQL) | Auth·DB·스토리지 통합, RLS 지원 |
| **프론트엔드** | Next.js 15 App Router + TypeScript | 파일 기반 라우팅, SSR/CSR 혼용 용이 |
| **AI 이미지** | OpenAI `gpt-image-1` | 이미지 편집 API로 손글씨 합성 |
| **지도** | 카카오 주소 검색 API | 한국 주소 품질 우수 |
| **컨테이너** | Docker Compose | 환경 변수 기반 포트 설정, 원클릭 실행 |
| **Rate Limiting** | slowapi | FastAPI 친화적, IP 기반 제한 |

### 디렉터리 구조

```
reclog/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI 앱, CORS, 라우터 등록
│   │   ├── database.py       # 비동기 엔진, 세션 팩토리
│   │   ├── dependencies.py   # JWT 인증 의존성 (JWKS 캐시)
│   │   ├── models/           # SQLAlchemy ORM 모델
│   │   │   ├── record.py
│   │   │   ├── category.py
│   │   │   ├── shared_space.py
│   │   │   ├── ai_usage.py
│   │   │   └── ...
│   │   ├── routers/          # API 라우터
│   │   │   ├── records.py
│   │   │   ├── categories.py
│   │   │   ├── spaces.py
│   │   │   ├── generate.py   # AI 포토북
│   │   │   └── users.py
│   │   └── schemas/          # Pydantic 요청/응답 스키마
│   ├── alembic/              # DB 마이그레이션
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/                  # Next.js App Router 페이지
│   │   ├── page.tsx          # 홈 (카테고리 목록)
│   │   ├── calendar/
│   │   ├── stats/
│   │   ├── record/
│   │   ├── spaces/
│   │   ├── profile/
│   │   ├── photobook/
│   │   └── subscribe/
│   ├── components/           # 공통 컴포넌트
│   ├── lib/
│   │   ├── api.ts            # API 호출 (authFetch 내부 세션 처리)
│   │   ├── auth-context.tsx
│   │   └── supabase.ts
│   └── Dockerfile
├── docs/
│   ├── PROJECT_OVERVIEW.md
│   ├── CLAUDE.md
│   └── db.md
├── docker-compose.yml
└── .env.example
```

---

## AI 도구 사용 내역

| AI 도구 | 사용 목적 |
|---|---|
| **Claude Code (claude-sonnet-4-6)** | 전체 백엔드 설계·구현, 코드 리뷰·리팩토링, 버그 수정, README·문서 작성 |
| **OpenAI gpt-image-1** | 서비스 내 AI 기능 — 포토북 이미지 위 손글씨 텍스트 합성|
| **v0.dev (Vercel)** | 프론트엔드 초기 UI 컴포넌트 및 페이지 레이아웃 기초 생성, 이후 직접 수정·개선 |

> Claude Code를 활용해 FastAPI 라우터 구조 설계, SQLAlchemy 비동기 쿼리 최적화, 레이스 컨디션 해결(PostgreSQL 원자적 upsert), Supabase JWKS 캐시 인증 구현, 프론트엔드 API 클라이언트 리팩토링 등 전반적인 개발을 진행했습니다.

---

## 설계 의도

### 왜 이 아이디어인가

여행이나 일상 기록을 남기는 앱은 많이 있지만 그 기록을 같이 남겨가는 서비스는 드물다고 생각했습니다. 특히, 커플·친구·가족이 하나의 공유 공간 각자의 시각으로 같은 순간을 기록하면, 더 재밌고 의미있는 기록이 남을 것이라고 생각합니다. 여기에 요즘 유행하는 그림에 어울리는 AI 손글씨 드로잉 기능을 추가하여 이 아이디어의 가치를 더 추가하고자 했습니다. 

### 비즈니스 가능성

- **구독 모델**: 무료(AI 5회/일, 개인 기록) → 프리미엄(무제한 AI, 스페이스 다수 생성, 포토북 할인)
- **기념일 알림**: 기록 날짜 기반 알림으로 리텐션 확보

### 시간이 더 있었다면

- **지도 시각화**: 기록 위치를 지도 핀으로 모아보기
- **Lv3 구현**: 관리자 대시보드, 결제 연동, 실물 포토북 주문 처리
- **이미지 스토리지 보안**: 현재 Supabase public 버킷 사용 중 — 추후 private 버킷 + signed URL(만료 시간 포함)로 전환하여 URL 노출 시에도 일정 시간 후 무효화되도록 개선 예정
