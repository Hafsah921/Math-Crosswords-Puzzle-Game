import { State, resetRun, startTimer, stopTimer, fmtTime } from './state.js';
import { generatePuzzle, GEN_VERSION } from './generator.js';
import { setupDrag } from './dragdrop.js';

const settingsPanel = document.getElementById('settingsPanel');
const gamePanel = document.getElementById('gamePanel');
const boardEl = document.getElementById('board');
const bankEl = document.getElementById('bank');
const playBtn = document.getElementById('playBtn');
const hintBtn = document.getElementById('hintBtn');
const checkBtn = document.getElementById('checkBtn');
const submitBtn = document.getElementById('submitBtn');
const retryBtn = document.getElementById('retryBtn');
const modeSeg = document.getElementById('mode');
const diffSeg = document.getElementById('difficulty');
const hintsToggle = document.getElementById('hintsToggle');
const timerEl = document.getElementById('timer');
const resultsDialog = document.getElementById('resultsDialog');
const resultsBody = document.getElementById('resultsBody');
const closeResults = document.getElementById('closeResults');
const modeBadge = document.getElementById('modeBadge');
const difficultyBadge = document.getElementById('difficultyBadge');

console.log('GEN loaded:', GEN_VERSION);

State.timerEl = timerEl;
State.mode = '+';
State.difficulty = 'easy';
document.querySelector('[data-mode="+"]').classList.add('active');
document.querySelector('[data-diff="easy"]').classList.add('active');

modeSeg.addEventListener('click', (e)=>{
  if (e.target.tagName !== 'BUTTON') return;
  [...modeSeg.children].forEach(b=>b.classList.remove('active'));
  e.target.classList.add('active');
  State.mode = e.target.dataset.mode;
});
diffSeg.addEventListener('click', (e)=>{
  if (e.target.tagName !== 'BUTTON') return;
  [...diffSeg.children].forEach(b=>b.classList.remove('active'));
  e.target.classList.add('active');
  State.difficulty = e.target.dataset.diff;
});
hintsToggle.addEventListener('change', ()=>{
  State.hintsOn = hintsToggle.checked;
  hintBtn.hidden = !State.hintsOn;
});

playBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);
checkBtn.addEventListener('click', ()=> validate(false));
submitBtn.addEventListener('click', ()=> validate(true));
hintBtn.addEventListener('click', revealOne);
closeResults.addEventListener('click', ()=>{ resultsDialog.close(); startGame(); });

let puzzle = null;

function startGame(){
  resetRun();
  timerEl.textContent = '00:00';
  modeBadge.textContent = symbolOf(State.mode);
  difficultyBadge.textContent = cap(State.difficulty);

  puzzle = generatePuzzle({ mode: State.mode, difficulty: State.difficulty });
  renderBoard(puzzle.boardCells);
  renderBank(puzzle.bank);
  setupDrag(bankEl, boardEl, onDropIntoCell);

  settingsPanel.hidden = true;
  gamePanel.hidden = false;
  startTimer();
}

function renderBoard(boardCells){
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = 'repeat(5, 64px)'; // exactly 5 tiles per row

  boardCells.forEach((row)=>{
    row.forEach(cell => {
      const div = document.createElement('div');
      if (cell.kind === 'num'){
        div.className = `tile num ${cell.blank ? 'blank' : 'locked'}`;
        if (!cell.blank){ div.textContent = cell.correct; }
        else { div.textContent = ''; div.dataset.correct = cell.correct; }
      } else if (cell.kind === 'sym'){
        div.className = 'tile sym';
        div.textContent = cell.value;
      } else { // eq
        div.className = 'tile eq';
        div.textContent = '=';
      }
      boardEl.appendChild(div);
    });
  });
}

function renderBank(bank){
  bankEl.innerHTML = '';
  bank.forEach(item =>{
    const cube = document.createElement('div');
    cube.className = 'cube';
    cube.textContent = item.value;
    cube.dataset.value = item.value;
    cube.setAttribute('role','button');
    cube.setAttribute('aria-label', `number ${item.value}`);
    bankEl.appendChild(cube);
  });
}

function onDropIntoCell(cellEl, value){
  cellEl.textContent = value;
  cellEl.dataset.value = value;
  cellEl.classList.add('filled');
  cellEl.classList.remove('error','correct');
}

// per-row validation (any numbers that satisfy the row are OK)
function validate(isSubmit){
  boardEl.querySelectorAll('.tile.num.blank').forEach(c => c.classList.remove('error','correct'));

  let totalWrong = 0;
  let idx = 0;

  for (const row of puzzle.boardCells){
    const dom = [];
    for (let j=0; j<5; j++) dom.push(boardEl.children[idx++]);

    const aVal = row[0].blank ? parseInt(dom[0].dataset.value || 'NaN', 10) : row[0].correct;
    const bVal = row[2].blank ? parseInt(dom[2].dataset.value || 'NaN', 10) : row[2].correct;
    const rVal = row[4].blank ? parseInt(dom[4].dataset.value || 'NaN', 10) : row[4].correct;

    if (Number.isNaN(aVal) || Number.isNaN(bVal) || Number.isNaN(rVal)) continue;

    const op = unsymbol(row[1].value);
    const ok = evalRow(aVal, op, bVal, rVal);

    [0,2,4].forEach(k=>{
      if (!row[k].blank) return;
      dom[k].classList.add(ok ? 'correct' : 'error');
      if (!ok) totalWrong++;
    });
  }

  if (!isSubmit) return;

  stopTimer();
  const blanks = boardEl.querySelectorAll('.tile.num.blank');
  const filled = [...blanks].filter(c=>!Number.isNaN(parseInt(c.dataset.value||'NaN',10))).length;
  State.tries += totalWrong;
  const accuracy = blanks.length ? Math.round((filled - State.tries) / blanks.length * 100) : 100;

  resultsBody.innerHTML = `
    <p><strong>Time taken:</strong> ${fmtTime(State.elapsedSec)}</p>
    <p><strong>Tries (errors):</strong> ${State.tries}</p>
    <p><strong>Hints used:</strong> ${State.hintsUsed}</p>
    <p><strong>Accuracy:</strong> ${Math.max(0, accuracy)}%</p>
  `;
  resultsDialog.showModal();
}

function revealOne(){
  const blanks = [...boardEl.querySelectorAll('.tile.num.blank')];
  const empty = blanks.filter(b => !b.dataset.value);
  if (empty.length === 0) return;
  const pick = empty[Math.floor(Math.random()*empty.length)];
  const correct = parseInt(pick.dataset.correct,10);
  onDropIntoCell(pick, correct);
  State.hintsUsed += 1;
  const cube = [...bankEl.children].find(c => parseInt(c.dataset.value,10) === correct);
  cube?.remove();
}

function symbolOf(op){ return op==='*' ? '×' : op==='/' ? '÷' : op; }
function unsymbol(s){ return s==='×' ? '*' : s==='÷' ? '/' : s; }
function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
function evalRow(a, op, b, r){
  if (op === '+') return a + b === r;
  if (op === '-') return a - b === r;
  if (op === '*') return a * b === r;
  if (op === '/') return b !== 0 && a / b === r;
  return false;
}
