# 개인 대시보드 웹앱 구축 계획

## Context

일상 생활을 한눈에 관리할 수 있는 **모바일 최적화 개인 대시보드**를 만든다. 핸드폰에서 기상/취침, 공부, 운동 시간을 버튼 하나로 기록하고, 날씨/뉴스를 확인하고, 일정을 관리할 수 있는 웹앱이다. Supabase를 백엔드로 사용하여 별도 서버 없이 운영하며, 여러 유저가 각자의 데이터를 갖는 구조이다.

**파이썬은 불필요** — Supabase가 DB, 인증, API를 모두 제공하므로 프론트엔드만 만들면 된다. Vercel에 배포하면 서버를 켜놓을 필요도 없다.

---

## 기술 스택

| 구분 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | **React + Vite + TypeScript** | 빠른 개발, Supabase 공식 React 지원 |
| 스타일링 | **Tailwind CSS** | 모바일 우선 유틸리티 클래스, 다크모드 내장 |
| UI 컴포넌트 | **shadcn/ui** | 아름답고 접근성 좋은 컴포넌트 |
| 차트 | **Recharts** | 가벼운 React SVG 차트 |
| 백엔드 | **Supabase (무료 티어)** | DB, 인증, 실시간, Edge Functions |
| 날씨 API | **Open-Meteo** | 무료, API 키 불필요, KMA 데이터 지원 |
| 뉴스 | **RSS 피드 (Supabase Edge Function)** | 연합뉴스/KBS RSS를 서버사이드로 파싱 |
| PWA | **vite-plugin-pwa** | 홈화면 설치 가능, 네이티브 앱처럼 동작 |
| 배포 | **Vercel (무료)** | 자동 빌드/배포, HTTPS 제공 |
| 라우팅 | **React Router v7** | |
| 상태관리 | **Zustand** | 가볍고 간단 |
| 날짜 | **date-fns** | 경량 날짜 처리 |
| 아이콘 | **Lucide React** | |

---

## 프로젝트 구조

```
me/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── .env.local                    # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── .gitignore
├── public/
│   ├── manifest.json             # PWA 매니페스트
│   └── favicon.svg
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── src/
│   ├── main.tsx
│   ├── App.tsx                   # 라우터 + 인증 래퍼
│   ├── lib/
│   │   ├── supabase.ts           # Supabase 클라이언트
│   │   ├── utils.ts              # cn(), formatDate() 등
│   │   └── constants.ts
│   ├── hooks/
│   │   ├── useAuth.ts            # 로그인/회원가입/자동로그인
│   │   ├── useActivities.ts      # 활동 CRUD + 실시간
│   │   ├── useWeather.ts         # 날씨 데이터
│   │   ├── useNews.ts            # 뉴스 데이터
│   │   ├── useMemos.ts           # 메모/일정 CRUD
│   │   └── useAnalytics.ts       # 패턴 분석
│   ├── stores/
│   │   └── appStore.ts           # UI 상태 (활성 타이머 등)
│   ├── components/
│   │   ├── ui/                   # shadcn/ui 기본 컴포넌트
│   │   ├── layout/
│   │   │   ├── MobileNav.tsx     # 하단 네비게이션 바
│   │   │   ├── Header.tsx        # 상단 인사 + 날짜
│   │   │   └── PageShell.tsx     # 공통 페이지 래퍼
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx # 메인 홈
│   │   │   ├── WeatherWidget.tsx # 날씨 위젯
│   │   │   ├── NewsWidget.tsx    # 뉴스 카드
│   │   │   ├── QuickActions.tsx  # 빠른 활동 버튼
│   │   │   ├── TodaySummary.tsx  # 오늘 활동 요약
│   │   │   └── UpcomingMemos.tsx # 다가오는 일정
│   │   ├── activity/
│   │   │   ├── ActivityPage.tsx  # 활동 추적 전체 뷰
│   │   │   ├── ActivityButton.tsx# 큰 탭 버튼
│   │   │   ├── ActiveTimer.tsx   # 진행 중 타이머
│   │   │   ├── ActivityLog.tsx   # 오늘 활동 기록
│   │   │   └── ActivityChart.tsx # 주간/월간 차트
│   │   ├── analytics/
│   │   │   ├── AnalyticsPage.tsx # 패턴 분석 뷰
│   │   │   ├── WeeklyChart.tsx   # 주간 활동 차트
│   │   │   ├── TrendChart.tsx    # 추세 차트
│   │   │   └── InsightCards.tsx  # 자동 인사이트
│   │   ├── schedule/
│   │   │   ├── SchedulePage.tsx  # 일정/메모 관리
│   │   │   ├── MemoCard.tsx      # 개별 메모 카드
│   │   │   ├── MemoForm.tsx      # 메모 생성/편집
│   │   │   └── CalendarView.tsx  # 달력 위젯
│   │   ├── settings/
│   │   │   └── SettingsPage.tsx  # 설정 (날씨 지역 변경, 프로필)
│   │   └── auth/
│   │       └── LoginPage.tsx     # 아이디+비밀번호 로그인/회원가입
│   ├── types/
│   │   ├── activity.ts
│   │   ├── memo.ts
│   │   ├── weather.ts
│   │   └── news.ts
│   └── styles/
│       └── globals.css
```

---

## 데이터베이스 스키마 (Supabase PostgreSQL)

### profiles 테이블
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,     -- 로그인용 아이디
  display_name TEXT,
  timezone TEXT DEFAULT 'Asia/Seoul',
  weather_city TEXT DEFAULT '인천',   -- 사용자별 날씨 도시명 (표시용)
  weather_lat FLOAT DEFAULT 37.45,   -- 사용자별 위도
  weather_lon FLOAT DEFAULT 126.70,  -- 사용자별 경도
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: 본인 데이터만 접근
-- 설정 페이지에서 날씨 지역을 변경 가능 (도시 선택 or 직접 입력)
```

### activities 테이블
```sql
CREATE TYPE activity_type AS ENUM ('wake', 'sleep', 'study', 'exercise');

CREATE TABLE activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type activity_type NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,              -- NULL = 진행 중
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE WHEN ended_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (ended_at - started_at)) / 60
    END
  ) STORED,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: 본인 데이터만 접근
```

### memos 테이블
```sql
CREATE TABLE memos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  scheduled_at TIMESTAMPTZ,          -- 일정인 경우 날짜/시간
  is_completed BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,        -- 0=보통, 1=중요, 2=긴급
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: 본인 데이터만 접근
```

### daily_summaries 테이블 (자동 집계)
```sql
CREATE TABLE daily_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  wake_time TIME,
  sleep_time TIME,
  total_study_minutes INTEGER DEFAULT 0,
  total_exercise_minutes INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);
-- DB 트리거로 activities 변경 시 자동 업데이트
```

---

## 핵심 기능 설계

### 1. 활동 추적기 (Activity Tracker)
- **기상/취침**: 버튼 한번 탭 → 시간 기록 (타이머 없이 시점만 저장)
- **공부/운동**: 시작 버튼 탭 → 타이머 시작 → 종료 버튼 탭 → 시간 기록
- 동시에 하나의 활동만 진행 가능
- 각 활동별 고유 색상: 기상(노란), 취침(보라), 공부(파랑), 운동(초록)
- 큰 터치 버튼 (44px 이상)

### 2. 날씨 위젯
- Open-Meteo API (무료, 키 불필요)
- **사용자별 지역 설정 가능** — profiles 테이블의 weather_lat/lon 사용
- 기본값: 경기/인천 (37.45, 126.70)
- 설정 페이지에서 주요 도시 선택 (서울, 인천, 부산, 대구 등) 또는 직접 좌표 입력
- 현재 기온 + 날씨 아이콘 + 3일 예보
- KMA 모델 사용으로 한국 날씨 정확도 높음

### 3. 뉴스 위젯
- 연합뉴스/KBS RSS 피드를 Supabase Edge Function으로 파싱
- 가로 스크롤 카드 형태로 헤드라인 표시
- 15분 캐싱

### 4. 일정/메모
- 카드 기반 UI, 색상 구분
- 빠른 추가 버튼 (FAB)
- 완료 토글
- 달력에 일정 있는 날 점 표시

### 5. 분석 (Analytics)
- 주간 공부/운동 시간 막대 차트
- 기상/취침 시간 추세 꺾은선 차트
- 자동 인사이트: "이번 주 공부 시간이 지난주보다 20% 증가"

---

## 모바일 UI 설계

- **하단 네비게이션 바**: 홈 / 활동 / 일정 / 분석 / 설정 (5탭)
- **다크모드 기본**: 배경 `#0F172A`, 카드 `#1E293B`
- **대시보드 홈 (위→아래)**:
  1. 인사 + 날짜 ("좋은 아침이에요, 3월 23일")
  2. 날씨 카드
  3. 빠른 활동 버튼 (2×2 그리드)
  4. 오늘 활동 요약
  5. 다가오는 일정
  6. 뉴스 헤드라인
- **PWA**: 홈화면에 추가하면 앱처럼 동작 (브라우저 UI 없음)

---

## 인증 설계

- **아이디(username) + 비밀번호** 방식 회원가입/로그인
  - Supabase Auth는 이메일 기반이므로, 내부적으로 `username@app.local` 형태의 더미 이메일로 처리
  - 사용자는 아이디와 비밀번호만 입력 (이메일 입력 불필요)
  - 회원가입 시 username 중복 체크
- 소규모 프로젝트 (4~5명 사용 예상)
- 자동 로그인: Supabase가 로컬 스토리지에 세션 토큰 자동 저장 → 새로고침/재방문 시 자동 로그인
- 각 유저별 독립된 데이터 (RLS 정책으로 보장)

---

## 구현 순서

### Phase 1: 프로젝트 초기화
1. Vite + React + TypeScript 프로젝트 생성
2. Tailwind CSS, shadcn/ui 설정
3. 핵심 패키지 설치 (`@supabase/supabase-js`, `react-router`, `zustand`, `date-fns`, `recharts`, `lucide-react`, `vite-plugin-pwa`)
4. 기본 라우팅 + 하단 네비게이션 레이아웃
5. Supabase 클라이언트 설정 (`.env.local`에 키 입력)

### Phase 2: 인증
1. 아이디+비밀번호 로그인/회원가입 페이지
2. `useAuth` 훅 (자동 로그인 포함)
3. 인증된 사용자만 접근 가능하도록 라우터 보호

### Phase 3: 활동 추적기
1. `ActivityButton` 컴포넌트 (시작/종료 상태)
2. `ActiveTimer` 컴포넌트 (경과 시간 표시)
3. `useActivities` 훅 (Supabase CRUD)
4. 활동 페이지 완성 + 오늘 활동 로그

### Phase 4: 대시보드 + 날씨
1. `WeatherWidget` (Open-Meteo API, 사용자별 지역)
2. `TodaySummary`, `QuickActions`
3. `UpcomingMemos` 위젯
4. 대시보드 홈 페이지 조립

### Phase 5: 일정/메모
1. `MemoForm` (생성/편집 다이얼로그)
2. `MemoCard` (완료 토글)
3. 일정 페이지 + FAB

### Phase 6: 설정 페이지
1. 날씨 지역 변경 (도시 드롭다운 + 좌표)
2. 프로필 표시 이름 변경
3. 로그아웃

### Phase 7: 뉴스 + 분석
1. (뉴스) Supabase Edge Function으로 RSS 파싱
2. `NewsWidget` 가로 스크롤 카드
3. (분석) Recharts 차트 컴포넌트들
4. 자동 인사이트 카드

### Phase 8: PWA + 배포
1. PWA 매니페스트 + 서비스 워커 설정
2. Vercel 배포
3. 모바일 테스트 + 홈화면 설치 확인

---

## 검증 방법

1. `npm run dev`로 로컬 실행 → 모바일 브라우저에서 같은 네트워크로 접속
2. 회원가입 (아이디+비밀번호) → 로그인 → 자동 로그인 확인
3. 활동 버튼 탭 → Supabase 대시보드에서 데이터 확인
4. 설정에서 날씨 지역 변경 → 날씨 위젯에 반영 확인
5. 메모 생성/완료/삭제 동작 확인
6. 분석 페이지에 차트 표시 확인
7. Vercel 배포 후 실제 핸드폰에서 PWA 설치 테스트

---

## 향후 확장 가능성

새 기능 추가 패턴: `DB 테이블 추가` → `hooks/useXxx.ts` → `components/xxx/` 폴더 → 라우트 추가

- 습관 트래커, 물 섭취 기록
- 가계부/지출 관리
- 독서 기록
- 푸시 알림 (웹 Push API)
- 데이터 CSV 내보내기
- 커스텀 위젯 배치
- 새로운 활동 유형 추가

---

## 주요 파일 (수정/생성 대상)

- `vite.config.ts` — Vite + PWA 설정
- `src/lib/supabase.ts` — Supabase 클라이언트 (모든 훅의 의존성)
- `src/App.tsx` — 라우팅 + 인증 래퍼
- `src/components/layout/MobileNav.tsx` — 앱 전체 네비게이션 구조
- `src/hooks/useAuth.ts` — 아이디+비밀번호 인증 로직
- `src/hooks/useActivities.ts` — 핵심 활동 추적 로직
- `src/components/settings/SettingsPage.tsx` — 날씨 지역 등 사용자 설정
- `supabase/migrations/001_initial_schema.sql` — 전체 DB 스키마
