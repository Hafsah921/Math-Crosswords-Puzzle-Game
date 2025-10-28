// GEN v1.3 — clean 5-tile rows only; integers >=1; no two-step rows.
// Row shape: [ number ][ operator ][ number ][ = ][ number ]
// Bank is small and de-duped.

export const GEN_VERSION = '1.3';

export function generatePuzzle({ mode, difficulty }) {
  const conf = diffConfig(difficulty);
  const rows = conf.rows;
  const equations = [];
  for (let i = 0; i < rows; i++) equations.push(buildEquation(mode, conf.min, conf.max));

  const blanksNeeded = [];
  const boardCells = [];

  equations.forEach((eq) => {
    const pattern = [
      { type: "num", value: eq.a },
      { type: "sym", value: symbolOf(eq.op) },
      { type: "num", value: eq.b },
      { type: "eq",  value: "=" },
      { type: "num", value: eq.result },
    ];

    const numIdx = [0, 2, 4];
    const blankIdx = chooseBlanks(numIdx, eq.blanksPerRow);

    blankIdx.forEach(i => blanksNeeded.push(pattern[i].value));

    const row = pattern.map((p, idx) => {
      if (p.type === "num") {
        const blank = blankIdx.includes(idx);
        return blank
          ? { kind: "num", blank: true,  correct: p.value, value: null, state: null }
          : { kind: "num", blank: false, correct: p.value, value: p.value, state: null };
      }
      if (p.type === "sym") return { kind: "sym", value: p.value };
      if (p.type === "eq")  return { kind: "eq",  value: "=" };
    });

    boardCells.push(row); // exactly 5 items
  });

  // bank: unique, no zeros
  const bankSet = new Set(blanksNeeded);
  const target = Math.min(12, blanksNeeded.length + Math.ceil(blanksNeeded.length * 0.25));
  while (bankSet.size < target) bankSet.add(makeDistractor(mode, conf.min, conf.max));
  const bank = shuffle([...bankSet]).map((n, i) => ({ id: `cube-${i}`, value: n }));

  return { boardCells, bank };
}

function diffConfig(difficulty){
  if (difficulty === "easy")   return { min: 1, max: 10,  rows: 4 };
  if (difficulty === "medium") return { min: 1, max: 20,  rows: 5 };
  return { min: 1, max: 50, rows: 6 }; // hard
}

function buildEquation(op, min, max){
  let a, b, result;
  if (op === "+") {
    a = rand(min, max); b = rand(min, max); result = a + b;
  } else if (op === "-") {
    a = rand(min, max); b = rand(min, a); if (a === b) a = Math.min(max, a+1);
    result = a - b; if (result < 1) { result = 1; a = b + result; }
  } else if (op === "*") {
    a = rand(min, Math.min(12, max));
    b = rand(min, Math.min(12, max));
    result = a * b;
  } else if (op === "/") {
    // clean integer division, all >=1
    b = rand(1, Math.min(12, max));
    result = rand(min, Math.min(12, max));
    a = b * result;
  } else {
    op = "+"; a = 1; b = 1; result = 2;
  }
  const blanksPerRow = 2; // consistent
  return { op, a, b, result, blanksPerRow };
}

function symbolOf(op){ return op === "*" ? "×" : (op === "/" ? "÷" : op); }
function chooseBlanks(indices, count){ const pool=[...indices]; shuffle(pool); return pool.slice(0, Math.min(count, pool.length)); }
function makeDistractor(mode, min, max){
  if (mode === "+") return rand(min, max * 2);
  if (mode === "-") return rand(1, max);
  if (mode === "*") return rand(min, Math.min(12, max)) * rand(min, Math.min(12, max));
  if (mode === "/"){ const b=rand(1, Math.min(12, max)); const r=rand(min, Math.min(12, max)); return Math.max(1, b*r + (Math.random()<.5?-b:b)); }
  return rand(min, max);
}
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
