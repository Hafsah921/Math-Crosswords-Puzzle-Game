// Drag-only using Pointer Events (mouse + touch)
let active = null;         // { el, clone, value }
let currentTarget = null;  // cell element under pointer

export function setupDrag(bankEl, boardEl, onDropIntoCell){
  // attach to all cubes currently in the bank
  bankEl.querySelectorAll('.cube').forEach(cube => attachCube(cube));

  // allow dragging from already-filled cells back to bank
  boardEl.addEventListener('pointerdown', e => {
    const cell = e.target.closest('.tile.num.blank.filled');
    if (!cell) return;
    e.preventDefault();
    const value = parseInt(cell.dataset.value, 10);
    const cube = makeTemporaryCube(value); // create cube to drag back
    attachCube(cube);
    bankEl.appendChild(cube);
    // clear cell
    cell.classList.remove('filled', 'error', 'correct');
    cell.removeAttribute('data-value');
    cell.textContent = '';
    // start dragging immediately
    cube.dispatchEvent(new PointerEvent('pointerdown', e));
  });

  function attachCube(cube){
    cube.addEventListener('pointerdown', (e)=> startDrag(e, cube));
    cube.style.touchAction = 'none';
  }

  function startDrag(e, cube){
    e.preventDefault();
    cube.setPointerCapture?.(e.pointerId);
    const rect = cube.getBoundingClientRect();
    const clone = cube.cloneNode(true);
    clone.classList.add('drag-clone');
    document.body.appendChild(clone);
    positionClone(clone, e.clientX, e.clientY, rect.width, rect.height);
    cube.classList.add('dragging');

    active = { el: cube, clone, value: parseInt(cube.dataset.value,10) };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once:true });
  }

  function onMove(e){
    if (!active) return;
    positionClone(active.clone, e.clientX, e.clientY);
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cell = el?.closest?.('.tile.num.blank');
    if (currentTarget && currentTarget !== cell) currentTarget.classList.remove('hover');
    currentTarget = cell || null;
    if (currentTarget) currentTarget.classList.add('hover');
  }

  function onUp(){
    if (!active) return;
    const dropOk = !!currentTarget;
    if (dropOk){
      onDropIntoCell(currentTarget, active.value); // place into cell
      active.el.remove(); // remove from bank
    }
    cleanup();
  }

  function cleanup(){
    window.removeEventListener('pointermove', onMove);
    if (currentTarget) currentTarget.classList.remove('hover');
    if (active){
      active.el.classList.remove('dragging');
      active.clone.remove();
    }
    active = null; currentTarget = null;
  }
}

function positionClone(clone, x, y, w=clone.offsetWidth, h=clone.offsetHeight){
  clone.style.transform = `translate3d(${x - w/2}px, ${y - h/2}px, 0)`;
}

function makeTemporaryCube(value){
  const div = document.createElement('div');
  div.className = 'cube';
  div.textContent = value;
  div.dataset.value = value;
  return div;
}
