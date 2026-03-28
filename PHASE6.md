# Phase 6: 네이티브 앱 느낌 강화

## 1. 페이지 전환 애니메이션
- To Do, D-day 등 서브페이지 진입 시 오른쪽→왼쪽 슬라이드인
- 뒤로가기 시 왼쪽→오른쪽 슬라이드아웃
- 0.3s cubic-bezier(0.22, 1, 0.36, 1)
- 적용 대상: TodoPage, DdayPage

## 2. 햅틱 피드백 스프링 애니메이션
- 체크/완료 시 scale(0.85)→scale(1.1)→scale(1) 스프링 바운스
- 활동 시작 버튼 탭 시 동일
- 토글 버튼에 적용
- CSS keyframe: hapticBounce

## 3. 빈 상태 디자인
- "No tasks" → 아이콘 + 텍스트 조합
- "활동 없음" → 이미 처리됨
- "No to-dos yet" → 아이콘 + 텍스트
- "No activities recorded" → 아이콘 + 텍스트
- 각 빈 상태에 맞는 lucide 아이콘 사용

## 4. 풀다운 새로고침 개선
- 현재 PullToRefresh 컴포넌트 확인 후 애니메이션 개선
- 스피너 대신 부드러운 인디케이터

## 5. 상태바 색상 동기화
- meta theme-color를 페이지/모달 상태에 따라 동적 변경
- 모달 열림: #000000
- 기본: #0A0A0B
- useEffect로 동적 업데이트

## 6. 토스트 알림
- 활동 시작/종료, 태스크 완료, To Do 완료 시 표시
- 하단에서 올라오는 작은 바
- 2초 후 자동 사라짐
- 기존 appStore의 flashMessage 활용
- 디자인: 미니멀, 배경 #1C1C1F, 둥근 모서리
