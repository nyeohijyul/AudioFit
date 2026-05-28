/**
 * 와이어프레임에서 사용하는 화면 ID, 운동 데이터 등 공통 상수 모음
 */

/** 화면 ID → DOM id 매핑 (원본 script.js screenMap과 동일) */
export const SCREEN_MAP = {
  home: 'screen-home',
  new: 'screen-new',
  player: 'screen-player',
  library: 'screen-library',
  mypage: 'screen-mypage',
};

/** 하단 탭·상단 네비 버튼 순서 인덱스 */
export const TAB_INDEX = {
  home: 0,
  new: 1,
  player: 2,
  library: 3,
  mypage: 4,
};

/** 플레이어 도넛 차트 원 둘레 계산용 반지름 */
export const DONUT_RADIUS = 58;

/** 동작당 타이머 총 초 */
export const TOTAL_SEC = 30;

/** 플레이어 샘플 운동 목록 (원본 exercises 배열) */
export const EXERCISES = [
  { name: '기지개 스트레칭', desc: '등을 바닥에 대고 누워 두 팔을 머리 위로 쭉 뻗어요', next: '고양이 자세' },
  { name: '고양이 자세', desc: '무릎과 손을 바닥에 대고, 등을 천장으로 동그랗게 말아요', next: '플랭크 (버티기)' },
  { name: '무릎 대고 팔굽혀 펴기', desc: '손은 어깨너비로 짚고, 무릎을 바닥에 댄 채 가슴이 바닥에 닿을 때까지 천천히 내려가요', next: '엉덩이 들어올리기' },
  { name: '엉덩이 들어올리기 (힙 브리지)', desc: '무릎을 세워 눕고, 발꿈치로 바닥을 밀며 엉덩이를 천장 쪽으로 들어올려요', next: '제자리 마무리 걷기' },
  { name: '제자리 마무리 걷기', desc: '제자리에서 천천히 무릎을 들어올리며 걸어요. 거의 다 왔어요! 👏', next: '완료!' },
];

/** 보관함 초기 루틴 목록 */
export const INITIAL_ROUTINES = [
  { id: '1', thumb: '🔥', name: '아침 5분 코어 깨우기', meta: '5개 동작 · 15분 · 초보자' },
  { id: '2', thumb: '💪', name: '전신 홈트 30분', meta: '8개 동작 · 30분 · 중급자' },
  { id: '3', thumb: '🦵', name: '하체 집중 스쿼트', meta: '6개 동작 · 20분 · 초보자' },
  { id: '4', thumb: '🧘', name: '자기 전 스트레칭', meta: '4개 동작 · 10분 · 초보자' },
];

/** 새 루틴 화면 초기 클립 목록 */
export const INITIAL_CLIPS = [
  { id: 'clip-0', label: '전신 홈트 (닥터유)', meta: '14:32~28:00' },
];

/** 상단 화면 네비게이션 버튼 정의 */
export const SCREEN_NAV_ITEMS = [
  { id: 'home', label: '🏠 홈' },
  { id: 'new', label: '✚ 새 루틴' },
  { id: 'player', label: '▶ 플레이어' },
  { id: 'library', label: '📁 보관함' },
  { id: 'mypage', label: '👤 마이페이지' },
];

/** 하단 탭 바 항목 정의 */
export const TAB_ITEMS = [
  { id: 'home', icon: '🏠', label: '홈' },
  { id: 'new', icon: '✚', label: '새루틴' },
  { id: 'player', icon: '▶', label: '재생' },
  { id: 'library', icon: '📁', label: '보관함' },
  { id: 'mypage', icon: '👤', label: '내정보' },
];
