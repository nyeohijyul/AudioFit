/* ──── SCREEN SWITCH ──── */
const screenMap = {home:'screen-home', new:'screen-new', player:'screen-player', library:'screen-library', mypage:'screen-mypage'};
function showScreen(id, navBtn) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(screenMap[id]);
  if (el) {
    el.classList.add('active');
    // re-trigger animation
    const wrap = document.querySelector('.phone-wrap');
    wrap.style.animation = 'none';
    requestAnimationFrame(() => { wrap.style.animation = ''; });
  }
  document.querySelectorAll('.screen-nav button').forEach(b => b.classList.remove('active'));
  if (navBtn) navBtn.classList.add('active');
  // update all tab bars
  const tabIdx = {home:0, new:1, player:2, library:3, mypage:4};
  document.querySelectorAll('.screen.active .tab-item').forEach((t,i) => {
    t.classList.toggle('active', i === tabIdx[id]);
  });
  if (id === 'player' && !timerRunning) startTimer();
}

/* ──── TOGGLE ──── */
function toggleSwitch(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('off');
}

/* ──── SLIDER ──── */
function updateSlider(val) {
  const mins = Math.round(val * 60 / 100);
  document.getElementById('end-val').textContent = `${String(Math.floor(mins/60)).padStart(2,'0')}:${String(mins%60).padStart(2,'0')}`;
  const slider = document.getElementById('seg-slider');
  slider.style.background = `linear-gradient(to right, var(--wine) 0%, var(--wine) ${val}%, var(--surface2) ${val}%)`;
}

/* ──── ADD CLIP ──── */
function addClip() {
  const link = document.getElementById('yt-link').value.trim();
  const label = link ? link.slice(0,28) + '…' : '새 영상 클립';
  const div = document.createElement('div');
  div.className = 'clip-item';
  div.innerHTML = `<div class="clip-dot"></div>${label}<span class="clip-meta">전체 구간</span>`;
  document.getElementById('clip-list').appendChild(div);
  document.getElementById('yt-link').value = '';
}

/* ──── PLAYER ──── */
const exercises = [
  { name: '기지개 스트레칭', desc: '등을 바닥에 대고 누워 두 팔을 머리 위로 쭉 뻗어요', next: '고양이 자세' },
  { name: '고양이 자세', desc: '무릎과 손을 바닥에 대고, 등을 천장으로 동그랗게 말아요', next: '플랭크 (버티기)' },
  { name: '무릎 대고 팔굽혀 펴기', desc: '손은 어깨너비로 짚고, 무릎을 바닥에 댄 채 가슴이 바닥에 닿을 때까지 천천히 내려가요', next: '엉덩이 들어올리기' },
  { name: '엉덩이 들어올리기 (힙 브리지)', desc: '무릎을 세워 눕고, 발꿈치로 바닥을 밀며 엉덩이를 천장 쪽으로 들어올려요', next: '제자리 마무리 걷기' },
  { name: '제자리 마무리 걷기', desc: '제자리에서 천천히 무릎을 들어올리며 걸어요. 거의 다 왔어요! 👏', next: '완료!' },
];
let curEx = 2, timerSec = 24, timerRunning = false, timerInterval = null;
const TOTAL_SEC = 30;

function renderExercise() {
  const ex = exercises[curEx];
  document.getElementById('action-name').textContent = ex.name;
  document.getElementById('action-desc').textContent = ex.desc;
  document.getElementById('next-action').textContent = ex.next;
  document.getElementById('player-step-label').textContent = `${curEx+1} / ${exercises.length}번째 동작`;
  timerSec = TOTAL_SEC;
  updateDonut();
}
function updateDonut() {
  document.getElementById('timer-display').textContent = timerSec;
  const circ = 2 * Math.PI * 58;
  const offset = circ * (1 - timerSec / TOTAL_SEC);
  document.getElementById('donut-ring').style.strokeDashoffset = offset;
}
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerRunning = true;
  timerInterval = setInterval(() => {
    if (timerSec > 0) { timerSec--; updateDonut(); }
    else { nextExercise(); }
  }, 1000);
}
function togglePlay() {
  const btn = document.getElementById('play-btn');
  if (timerRunning) {
    clearInterval(timerInterval); timerRunning = false;
    btn.textContent = '▶';
  } else {
    startTimer(); btn.textContent = '⏸';
  }
}
function nextExercise() {
  if (curEx < exercises.length - 1) { curEx++; renderExercise(); }
}
function prevExercise() {
  if (curEx > 0) { curEx--; renderExercise(); }
}
function seekForward() { timerSec = Math.max(0, timerSec - 10); updateDonut(); }
function seekBack()    { timerSec = Math.min(TOTAL_SEC, timerSec + 10); updateDonut(); }
function setSpeed(el, label) {
  document.querySelectorAll('.speed-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

/* ──── LIBRARY DELETE ──── */
function deleteRoutine(btn) {
  const item = btn.closest('.routine-item');
  item.style.transition = 'opacity .2s, transform .2s';
  item.style.opacity = '0';
  item.style.transform = 'translateX(20px)';
  setTimeout(() => item.remove(), 200);
}

/* ──── LEVEL ──── */
function setLevel(btn) {
  document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

/* init */
updateSlider(60);
renderExercise();
