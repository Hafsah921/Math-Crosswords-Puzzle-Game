export const State = {
  running: false,
  startAt: 0,
  elapsedSec: 0,
  tries: 0,
  hintsUsed: 0,
  completed: false,
  mode: '+',
  difficulty: 'easy',
  hintsOn: false,
  timerEl: null,
  timerId: null,
};

export function resetRun() {
  State.running = false;
  State.startAt = 0;
  State.elapsedSec = 0;
  State.tries = 0;
  State.hintsUsed = 0;
  State.completed = false;
  stopTimer();
}

export function startTimer() {
  State.startAt = Date.now();
  State.running = true;
  if (State.timerId) clearInterval(State.timerId);
  State.timerId = setInterval(() => {
    State.elapsedSec = Math.floor((Date.now() - State.startAt) / 1000);
    if (State.timerEl) State.timerEl.textContent = fmtTime(State.elapsedSec);
  }, 250);
}

export function stopTimer() {
  if (State.timerId) clearInterval(State.timerId);
  State.timerId = null;
  State.running = false;
}

export function fmtTime(sec){
  const m = Math.floor(sec/60).toString().padStart(2,'0');
  const s = (sec%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}
