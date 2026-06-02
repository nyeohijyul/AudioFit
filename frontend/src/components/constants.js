export const SCREEN_MAP = {
  home: 'screen-home',
  new: 'screen-new',
  player: 'screen-player',
  library: 'screen-library',
  mypage: 'screen-mypage',
};

export const TAB_INDEX = {
  home: 0,
  new: 1,
  player: 2,
  library: 3,
  mypage: 4,
};

export const DONUT_RADIUS = 58;
export const TOTAL_SEC = 30;

export const EXERCISES = [
  { name: '기지개 스트레칭', desc: '양팔을 머리 위로 뻗고 온몸을 쭉 늘려 몸을 깨워 줍니다.', duration: 15, next: '고양이 자세' },
  { name: '고양이 자세', desc: '네발 기기 자세에서 숨을 마시며 머리를 들고, 내쉬며 등을 동그랗게 맙니다.', duration: 15, next: '무릎 대고 팔굽혀 펴기' },
  { name: '무릎 대고 팔굽혀 펴기', desc: '무릎을 대고 상체를 낮추며 가슴과 팔 근육에 부드러운 긴장을 줍니다.', duration: 15, next: '엉덩이 들기 브릿지' },
  { name: '엉덩이 들기 브릿지', desc: '누운 자세에서 무릎을 세우고 엉덩이를 들어 올려 코어와 둔근을 자극합니다.', duration: 15, next: '제자리 제자리 걷기' },
  { name: '제자리 제자리 걷기', desc: '호흡을 고르며 가볍게 제자리걸음을 하며 온몸의 정리를 돕습니다.', duration: 15, next: '완료!' },
];

export const INITIAL_ROUTINES = [];

export const INITIAL_CLIPS = [];

export const SCREEN_NAV_ITEMS = [
  { id: 'home', label: '홈' },
  { id: 'new', label: '새 루틴' },
  // { id: 'player', label: '플레이어' },
  { id: 'library', label: '보관함' },
  { id: 'mypage', label: '내 정보' },
];

export const TAB_ITEMS = [
  { id: 'home', icon: '🏠', label: '홈' },
  { id: 'new', icon: '✚', label: '새루틴' },
  // { id: 'player', icon: '▶', label: '재생' },
  { id: 'library', icon: '📁', label: '보관함' },
  { id: 'mypage', icon: '👤', label: '내정보' },
  // { id: 'home', icon: '⌂', label: '홈' },
  // { id: 'new', icon: '+', label: '새 루틴' },
  // { id: 'player', icon: '▶', label: '재생' },
  // { id: 'library', icon: '▣', label: '보관함' },
  // { id: 'mypage', icon: '◯', label: '내 정보' },
];
