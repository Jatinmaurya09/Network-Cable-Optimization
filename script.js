/* =========================================================
   NETWORK CABLE OPTIMIZATION USING MINIMUM SPANNING TREE
   ========================================================= */

/* ---------------- DOM ---------------- */
const canvas    = document.getElementById('graph');
const ctx       = canvas.getContext('2d');
const stage     = document.getElementById('stage');
const logBox    = document.getElementById('log');
const startSel  = document.getElementById('startSel');
const speedIn   = document.getElementById('speed');
const speedVal  = document.getElementById('speedVal');
const statTotal = document.getElementById('statTotal');
const statEdges = document.getElementById('statEdges');
const statusEl  = document.getElementById('status');
const hintEl    = document.getElementById('hint');

const edgeDialog = document.getElementById('edgeDialog');
const edgeWeight = document.getElementById('edgeWeight');
const dialogSub  = document.getElementById('dialogSub');

/* ---------------- STATE ---------------- */
let nodes = [];          // {id, x, y, label, name}
let edges = [];          // {id, u, v, w}
let nextId = 1;
let mode = 'move';
let drag = null;
let hoverNode = null;
let pendingFrom = null;  // node id for edge creation
let pendingPair = null;  // {u, v}

let W = 0, H = 0, DPR = 1, prevW = 0, prevH = 0;

const state = {
  mst: new Set(),
  rejected: new Set(),
  candidates: new Set(),
  visitedNodes: new Set(),
  current: null,
  total: 0,
  steps: [],
  idx: 0,
  running: false,
  done: false,
  timer: null,
  algo: null
};

/* ---------------- HELPERS ---------------- */
const nodeById = id => nodes.find(n => n.id === id);
const edgeById = id => edges.find(e => e.id === id);
const labelOf  = id => { const n = nodeById(id); return n ? n.label : '?'; };
const uid      = () => nextId++;

function autoLabel() {
  const i = nodes.length;
  if (i < 26) return String.fromCharCode(65 + i);
  return 'N' + (i + 1);
}

function delay() {
  const v = Number(speedIn.value);      // 1..10
  return 1250 - (v - 1) * 125;          // 1250ms .. 125ms
}

/* ---------------- NODE / EDGE OPS ---------------- */
function addNode(x, y, label, name) {
  const n = { id: uid(), x, y, label: label || autoLabel(), name: name || '' };
  nodes.push(n);
  refreshStartSelect();
  return n;
}

function addEdge(u, v, w) {
  if (u === v) return null;
  if (edges.some(e => (e.u === u && e.v === v) || (e.u === v && e.v === u))) return null;
  const e = { id: uid(), u, v, w: Math.max(1, Math.round(Number(w) || 1)) };
  edges.push(e);
  return e;
}

function deleteNode(id) {
  nodes = nodes.filter(n => n.id !== id);
  edges = edges.filter(e => e.u !== id && e.v !== id);
  refreshStartSelect();
}

/* ---------------- CANVAS SIZING ---------------- */
function resize() {
  const r = stage.getBoundingClientRect();
  const nw = Math.max(1, r.width), nh = Math.max(1, r.height);
  DPR = window.devicePixelRatio || 1;
  W = nw; H = nh;
  canvas.width  = Math.round(W * DPR);
  canvas.height = Math.round(H * DPR);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  // keep node positions proportional on resize
  if (prevW > 0 && prevH > 0 && nodes.length) {
    const sx = W / prevW, sy = H / prevH;
    if (Math.abs(sx - 1) > 0.002 || Math.abs(sy - 1) > 0.002) {
      nodes.forEach(n => { n.x *= sx; n.y *= sy; });
    }
  }
  prevW = W; prevH = H;
  draw();
}
new ResizeObserver(resize).observe(stage);
window.addEventListener('resize', resize);

/* ---------------- DRAWING ---------------- */
function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawGrid() {
  ctx.save();
  ctx.strokeStyle = 'rgba(120,160,255,.045)';
  ctx.lineWidth = 1;
  const g = 40;
  for (let x = 0; x < W; x += g) {
    ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += g) {
    ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); ctx.stroke();
  }
  ctx.restore();
}

function edgeRank(e) {
  if (state.mst.has(e.id)) return 3;
  if (state.candidates.has(e.id)) return 2;
  if (state.rejected.has(e.id)) return 0;
  return 1;
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawGrid();

  /* ---- edges (sorted by visual priority) ---- */
  const sorted = [...edges].sort((a, b) => edgeRank(a) - edgeRank(b));

  for (const e of sorted) {
    const A = nodeById(e.u), B = nodeById(e.v);
    if (!A || !B) continue;

    const isMST  = state.mst.has(e.id);
    const isCand = state.candidates.has(e.id);
    const isRej  = state.rejected.has(e.id);

    let color = 'rgba(148,163,184,.34)';
    let lw = 2;
    let dash = [];

    if (isMST)  { color = '#34d399'; lw = 4; }
    else if (isCand) { color = '#fbbf24'; lw = 3.2; }
    else if (isRej)  { color = 'rgba(248,113,113,.6)'; lw = 1.8; dash = [6, 6]; }

    ctx.save();
    ctx.setLineDash(dash);
    if (isMST) { ctx.shadowColor = 'rgba(52,211,153,.75)'; ctx.shadowBlur = 14; }
    if (isCand) { ctx.shadowColor = 'rgba(251,191,36,.65)'; ctx.shadowBlur = 12; }
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();
    ctx.restore();

    /* ---- weight badge ---- */
    const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
    const txt = String(e.w);
    ctx.font = '700 11px "JetBrains Mono", monospace';
    const tw = ctx.measureText(txt).width;
    const bw = tw + 14, bh = 18;

    ctx.save();
    ctx.fillStyle = isMST ? 'rgba(6,32,24,.95)'
                  : isCand ? 'rgba(38,28,4,.95)'
                  : isRej ? 'rgba(38,10,10,.9)'
                  : 'rgba(8,14,28,.92)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    roundRect(mx - bw / 2, my - bh / 2, bw, bh, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = isMST ? '#7ff0c4' : isCand ? '#fde68a' : isRej ? '#fca5a5' : '#93a8c9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, mx, my + .5);
    ctx.restore();
  }

  /* ---- pending edge preview ---- */
  if (mode === 'addedge' && pendingFrom !== null) {
    const A = nodeById(pendingFrom);
    if (A) {
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(34,211,238,.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(A.x, A.y, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ---- nodes ---- */
  for (const n of nodes) {
    const inTree = state.visitedNodes.has(n.id);
    const isHover = hoverNode === n.id;
    const isPending = pendingFrom === n.id;
    const R = 22;

    ctx.save();
    if (inTree) { ctx.shadowColor = 'rgba(52,211,153,.85)'; ctx.shadowBlur = 18; }
    else if (isHover || isPending) { ctx.shadowColor = 'rgba(34,211,238,.85)'; ctx.shadowBlur = 18; }

    ctx.beginPath();
    ctx.arc(n.x, n.y, R, 0, Math.PI * 2);
    ctx.fillStyle = inTree
      ? 'rgba(16,60,48,.96)'
      : 'rgba(20,29,50,.97)';
    ctx.fill();

    ctx.lineWidth = 2.6;
    ctx.strokeStyle = inTree ? '#34d399'
                    : isPending ? '#fbbf24'
                    : isHover ? '#67e8f9'
                    : '#3f8fd6';
    ctx.stroke();
    ctx.restore();

    /* label */
    ctx.save();
    ctx.fillStyle = inTree ? '#b6f2dc' : '#dbeafe';
    ctx.font = `700 ${n.label.length > 3 ? 10 : 12}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.label, n.x, n.y + .5);
    ctx.restore();

    /* full name caption */
    if (n.name) {
      ctx.save();
      ctx.fillStyle = 'rgba(150,170,205,.85)';
      ctx.font = '500 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(n.name, n.x, n.y + R + 5);
      ctx.restore();
    }
  }
}

/* ---------------- HIT TESTING ---------------- */
function getPos(ev) {
  const r = canvas.getBoundingClientRect();
  return { x: ev.clientX - r.left, y: ev.clientY - r.top };
}

function nodeAt(p) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (Math.hypot(n.x - p.x, n.y - p.y) <= 22) return n;
  }
  return null;
}

function distToSeg(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function edgeAt(p) {
  for (let i = edges.length - 1; i >= 0; i--) {
    const e = edges[i];
    const A = nodeById(e.u), B = nodeById(e.v);
    if (!A || !B) continue;
    if (distToSeg(p, A, B) < 9) return e;
  }
  return null;
}

/* ---------------- POINTER EVENTS ---------------- */
canvas.addEventListener('pointerdown', ev => {
  const p = getPos(ev);
  const n = nodeAt(p);

  if (mode === 'move') {
    if (n) {
      drag = { id: n.id, dx: p.x - n.x, dy: p.y - n.y };
      canvas.setPointerCapture(ev.pointerId);
      resetAnimation();
    }
  } else if (mode === 'addnode') {
    if (!n) {
      addNode(p.x, p.y);
      resetAnimation();
    }
  } else if (mode === 'addedge') {
    if (n) {
      if (pendingFrom === null) {
        pendingFrom = n.id;
        setHint(`Selected <b>${n.label}</b> — now click the second node`);
      } else if (pendingFrom === n.id) {
        pendingFrom = null;
        setHint('Selection cleared — click a node to start a cable');
      } else {
        openEdgeDialog(pendingFrom, n.id);
      }
    } else {
      pendingFrom = null;
      setHint('Click a node to start a cable');
    }
  } else if (mode === 'delete') {
    if (n) { deleteNode(n.id); resetAnimation(); }
    else {
      const e = edgeAt(p);
      if (e) { edges = edges.filter(x => x.id !== e.id); resetAnimation(); }
    }
  }
  draw();
});

canvas.addEventListener('pointermove', ev => {
  const p = getPos(ev);

  if (drag) {
    const n = nodeById(drag.id);
    if (n) {
      n.x = Math.max(28, Math.min(W - 28, p.x - drag.dx));
      n.y = Math.max(28, Math.min(H - 28, p.y - drag.dy));
      draw();
    }
    return;
  }

  const n = nodeAt(p);
  const newHover = n ? n.id : null;
  if (newHover !== hoverNode) {
    hoverNode = newHover;
    draw();
  }

  if (mode === 'move') canvas.style.cursor = n ? 'grab' : 'default';
  else if (mode === 'addnode') canvas.style.cursor = n ? 'default' : 'copy';
  else if (mode === 'addedge') canvas.style.cursor = 'pointer';
  else if (mode === 'delete') canvas.style.cursor = (n || edgeAt(p)) ? 'not-allowed' : 'default';
});

canvas.addEventListener('pointerup', ev => {
  if (drag) {
    drag = null;
    try { canvas.releasePointerCapture(ev.pointerId); } catch (e) {}
  }
});
canvas.addEventListener('pointerleave', () => { drag = null; hoverNode = null; draw(); });

/* ---------------- EDGE DIALOG ---------------- */
function openEdgeDialog(u, v) {
  pendingPair = { u, v };
  const A = nodeById(u), B = nodeById(v);
  const dist = Math.round(Math.hypot(A.x - B.x, A.y - B.y) / 12);
  edgeWeight.value = Math.max(1, Math.min(99, dist));
  dialogSub.textContent = `Cable route: ${A.label} — ${B.label}`;
  edgeDialog.classList.remove('hidden');
  edgeWeight.focus();
  edgeWeight.select();
}

function closeEdgeDialog() {
  edgeDialog.classList.add('hidden');
  pendingPair = null;
  pendingFrom = null;
  setHint('Click a node to start a cable');
  draw();
}

document.getElementById('edgeCancel').addEventListener('click', closeEdgeDialog);
document.getElementById('edgeOk').addEventListener('click', () => {
  if (pendingPair) {
    addEdge(pendingPair.u, pendingPair.v, edgeWeight.value);
    resetAnimation();
  }
  closeEdgeDialog();
});
edgeWeight.addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('edgeOk').click();
  if (e.key === 'Escape') closeEdgeDialog();
});
edgeDialog.addEventListener('click', e => { if (e.target === edgeDialog) closeEdgeDialog(); });

/* ---------------- UI HELPERS ---------------- */
function setHint(html) { hintEl.innerHTML = html; }

function setStatus(msg, cls) {
  statusEl.className = 'status' + (cls ? ' ' + cls : '');
  statusEl.innerHTML = msg;
}

function log(msg, cls) {
  const el = document.createElement('div');
  el.className = 'log-item' + (cls ? ' ' + cls : '');
  el.innerHTML = msg;
  logBox.appendChild(el);
  logBox.scrollTop = logBox.scrollHeight;
}
function logClear() { logBox.innerHTML = ''; }

function refreshStartSelect() {
  const cur = startSel.value;
  startSel.innerHTML = nodes
    .map(n => `<option value="${n.id}">${n.label}${n.name ? ' — ' + n.name : ''}</option>`)
    .join('');
  if ([...startSel.options].some(o => o.value === cur)) startSel.value = cur;
}

function updateResult() {
  statTotal.textContent = state.total;
  statEdges.textContent = state.mst.size;
}

/* ---------------- ALGORITHM STEP GENERATORS ---------------- */
function primSteps(startId) {
  const steps = [];
  const n = nodes.length;
  if (n === 0) return steps;

  const inMST = new Set([startId]);
  const mstSet = new Set();
  let total = 0;

  while (inMST.size < n) {
    const cands = edges.filter(e =>
      !mstSet.has(e.id) &&
      (inMST.has(e.u) !== inMST.has(e.v))
    );
    if (cands.length === 0) break;   // disconnected

    let best = cands[0];
    for (const e of cands) if (e.w < best.w) best = e;

    const from = inMST.has(best.u) ? best.u : best.v;
    const to   = inMST.has(best.u) ? best.v : best.u;

    total += best.w;
    mstSet.add(best.id);
    inMST.add(best.u);
    inMST.add(best.v);

    steps.push({
      type: 'add',
      edge: best.id,
      candidates: cands.map(e => e.id),
      visited: [...inMST],
      total,
      note: `Pick cheapest cut edge <b>${labelOf(from)} — ${labelOf(to)}</b> (cost <b>${best.w}</b>) · total = <b>${total}</b>`
    });
  }
  return steps;
}

function kruskalSteps() {
  const steps = [];
  const n = nodes.length;

  const parent = new Map(nodes.map(nd => [nd.id, nd.id]));
  const rank = new Map(nodes.map(nd => [nd.id, 0]));

  function find(x) {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)));
      x = parent.get(x);
    }
    return x;
  }
  function union(a, b) {
    a = find(a); b = find(b);
    if (a === b) return false;
    if (rank.get(a) < rank.get(b)) [a, b] = [b, a];
    parent.set(b, a);
    if (rank.get(a) === rank.get(b)) rank.set(a, rank.get(a) + 1);
    return true;
  }

  const sorted = [...edges].sort((a, b) => a.w - b.w || a.id - b.id);
  let total = 0, count = 0;

  for (const e of sorted) {
    if (count === n - 1) break;

    if (union(e.u, e.v)) {
      total += e.w;
      count++;
      steps.push({
        type: 'accept',
        edge: e.id,
        total,
        note: `Accept <b>${labelOf(e.u)} — ${labelOf(e.v)}</b> (cost <b>${e.w}</b>) · no cycle · total = <b>${total}</b>`
      });
    } else {
      steps.push({
        type: 'reject',
        edge: e.id,
        note: `Reject <b>${labelOf(e.u)} — ${labelOf(e.v)}</b> (cost ${e.w}) · would form a cycle`
      });
    }
  }
  return steps;
}

/* ---------------- ANIMATION ENGINE ---------------- */
function resetState() {
  state.mst.clear();
  state.rejected.clear();
  state.candidates.clear();
  state.visitedNodes.clear();
  state.current = null;
  state.total = 0;
  state.steps = [];
  state.idx = 0;
  state.running = false;
  state.done = false;
  state.algo = null;
  clearTimeout(state.timer);
  updateResult();
}

function resetAnimation() {
  clearTimeout(state.timer);
  resetState();
  setStatus('Idle — press an algorithm button to start.', '');
  draw();
}

function runAlgorithm(algo) {
  if (nodes.length < 2) {
    setStatus('⚠️ Add at least 2 nodes to build a network.', 'warn');
    return;
  }
  if (edges.length === 0) {
    setStatus('⚠️ Add at least one cable (edge).', 'warn');
    return;
  }

  clearTimeout(state.timer);
  resetState();
  logClear();

  state.algo = algo;

  if (algo === 'prim') {
    let startId = Number(startSel.value);
    if (!nodeById(startId)) startId = nodes[0].id;
    state.steps = primSteps(startId);
    setStatus(`Running <b>Prim's Algorithm</b> from node <b>${labelOf(startId)}</b>…`, '');
    log(`▶ <b>Prim's Algorithm</b> starting from <b>${labelOf(startId)}</b>`, 'done');
  } else {
    state.steps = kruskalSteps();
    setStatus(`Running <b>Kruskal's Algorithm</b>…`, '');
    log(`▶ <b>Kruskal's Algorithm</b> — edges sorted by cost`, 'done');
  }

  state.idx = 0;
  state.running = true;
  state.done = false;
  playNext();
}

function applyStep(s) {
  state.candidates = new Set();
  state.current = null;

  if (s.type === 'add') {
    state.candidates = new Set(s.candidates);
    state.mst.add(s.edge);
    state.current = s.edge;
    state.total = s.total;
    state.visitedNodes = new Set(s.visited);
    log(s.note, 'ok');
  } else if (s.type === 'accept') {
    state.mst.add(s.edge);
    state.current = s.edge;
    state.total = s.total;
    const e = edgeById(s.edge);
    if (e) { state.visitedNodes.add(e.u); state.visitedNodes.add(e.v); }
    log(s.note, 'ok');
  } else if (s.type === 'reject') {
    state.rejected.add(s.edge);
    state.candidates = new Set([s.edge]);
    log(s.note, 'bad');
  }
  updateResult();
}

function stepOnce() {
  if (state.idx >= state.steps.length) { finish(); return; }
  applyStep(state.steps[state.idx++]);
  draw();
  if (state.idx >= state.steps.length) finish();
}

function playNext() {
  if (!state.running) return;
  if (state.idx >= state.steps.length) { finish(); return; }
  stepOnce();
  if (state.running && !state.done) {
    state.timer = setTimeout(playNext, delay());
  }
}

function finish() {
  clearTimeout(state.timer);
  state.running = false;
  if (state.done) return;
  state.done = true;

  const n = nodes.length;
  if (n > 0 && state.mst.size === n - 1) {
    setStatus(`✅ Optimal network found — total cable cost = <b>${state.total}</b> using <b>${n - 1}</b> cables.`, 'ok');
    log(`<b>✔ MST COMPLETE</b> — all ${n} nodes connected with ${n - 1} cables, minimum total cost = <b>${state.total}</b>`, 'done');
  } else {
    setStatus('⚠️ Graph is disconnected — a spanning tree covering all nodes does not exist.', 'warn');
    log('<b>✖ Graph disconnected</b> — cannot span all nodes.', 'bad');
  }
  updateResult();
  draw();
}

/* ---------------- BUTTON WIRING ---------------- */
document.querySelectorAll('.mode-btn').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    mode = b.dataset.mode;
    pendingFrom = null;
    const hints = {
      move: '✋ Drag any node to reposition it',
      addnode: '➕ Click anywhere on the canvas to add a building',
      addedge: '🔌 Click a node, then a second node to lay a cable',
      delete: '🗑 Click a node or a cable to remove it'
    };
    setHint(hints[mode]);
    draw();
  });
});

document.getElementById('btnPrim').addEventListener('click', () => runAlgorithm('prim'));
document.getElementById('btnKruskal').addEventListener('click', () => runAlgorithm('kruskal'));

document.getElementById('btnPause').addEventListener('click', (e) => {
  if (!state.steps.length) return;
  if (state.running) {
    state.running = false;
    clearTimeout(state.timer);
    e.target.textContent = '▶ Resume';
    setStatus('⏸ Paused — press Resume or Step.', '');
  } else if (!state.done) {
    state.running = true;
    e.target.textContent = '⏸ Pause';
    setStatus(`Running <b>${state.algo === 'prim' ? "Prim's" : "Kruskal's"}</b>…`, '');
    playNext();
  }
});

document.getElementById('btnStep').addEventListener('click', () => {
  if (!state.steps.length) {
    setStatus('⚠️ Run an algorithm first.', 'warn');
    return;
  }
  state.running = false;
  clearTimeout(state.timer);
  document.getElementById('btnPause').textContent = '▶ Resume';
  if (state.done) return;
  stepOnce();
});

document.getElementById('btnReset').addEventListener('click', () => {
  resetAnimation();
  document.getElementById('btnPause').textContent = '⏸ Pause';
  logClear();
  setStatus('Idle — press an algorithm button to start.', '');
});

speedIn.addEventListener('input', () => { speedVal.textContent = speedIn.value; });

document.getElementById('btnClear').addEventListener('click', () => {
  nodes = []; edges = []; nextId = 1;
  resetAnimation();
  logClear();
  refreshStartSelect();
  setStatus('Canvas cleared — add nodes or load a preset.', '');
  draw();
});

document.getElementById('btnRandom').addEventListener('click', () => {
  generateRandom();
});

document.getElementById('btnLoadPreset').addEventListener('click', () => {
  loadPreset(document.getElementById('presetSel').value);
});

/* ---------------- PRESETS ---------------- */
const PRESETS = {
  campus: {
    nodes: [
      { name: 'Admin Block',   label: 'ADM', x: .14, y: .18 },
      { name: 'Library',       label: 'LIB', x: .44, y: .10 },
      { name: 'CSE Block',     label: 'CSE', x: .80, y: .18 },
      { name: 'Hostel',        label: 'HST', x: .90, y: .56 },
      { name: 'Canteen',       label: 'CNT', x: .60, y: .50 },
      { name: 'Lab Complex',   label: 'LAB', x: .28, y: .50 },
      { name: 'Sports Ground', label: 'SPT', x: .12, y: .80 },
      { name: 'Main Gate',     label: 'GAT', x: .52, y: .88 }
    ],
    edges: [
      ['Admin Block', 'Library', 4],
      ['Admin Block', 'Lab Complex', 5],
      ['Admin Block', 'Sports Ground', 7],
      ['Admin Block', 'Canteen', 9],
      ['Library', 'CSE Block', 6],
      ['Library', 'Lab Complex', 3],
      ['Library', 'Canteen', 5],
      ['CSE Block', 'Hostel', 4],
      ['CSE Block', 'Canteen', 7],
      ['CSE Block', 'Lab Complex', 8],
      ['Hostel', 'Canteen', 3],
      ['Hostel', 'Main Gate', 6],
      ['Canteen', 'Main Gate', 4],
      ['Canteen', 'Lab Complex', 6],
      ['Lab Complex', 'Sports Ground', 4],
      ['Sports Ground', 'Main Gate', 8]
    ]
  },
  office: {
    nodes: [
      { name: 'Reception',    label: 'RCP', x: .12, y: .22 },
      { name: 'Server Room',  label: 'SRV', x: .50, y: .12 },
      { name: 'Dev Team',     label: 'DEV', x: .86, y: .26 },
      { name: 'HR Dept',      label: 'HR',  x: .18, y: .74 },
      { name: 'Manager',      label: 'MGR', x: .55, y: .62 },
      { name: 'Conference',   label: 'CNF', x: .88, y: .80 }
    ],
    edges: [
      ['Reception', 'Server Room', 5],
      ['Reception', 'HR Dept', 3],
      ['Reception', 'Manager', 8],
      ['Server Room', 'Dev Team', 4],
      ['Server Room', 'Manager', 6],
      ['Dev Team', 'Manager', 5],
      ['Dev Team', 'Conference', 3],
      ['HR Dept', 'Manager', 4],
      ['Manager', 'Conference', 7],
      ['Reception', 'Dev Team', 12]
    ]
  },
  hostel: {
    nodes: [
      { name: 'Block A',    label: 'A', x: .12, y: .20 },
      { name: 'Block B',    label: 'B', x: .38, y: .12 },
      { name: 'Block C',    label: 'C', x: .68, y: .16 },
      { name: 'Mess',       label: 'M', x: .88, y: .42 },
      { name: 'Warden Off', label: 'W', x: .62, y: .60 },
      { name: 'Gate',       label: 'G', x: .30, y: .78 },
      { name: 'Parking',    label: 'P', x: .10, y: .55 }
    ],
    edges: [
      ['Block A', 'Block B', 4],
      ['Block A', 'Parking', 3],
      ['Block A', 'Gate', 7],
      ['Block B', 'Block C', 5],
      ['Block B', 'Parking', 6],
      ['Block C', 'Mess', 3],
      ['Block C', 'Warden Off', 5],
      ['Mess', 'Warden Off', 4],
      ['Warden Off', 'Gate', 6],
      ['Gate', 'Parking', 8],
      ['Block B', 'Warden Off', 9]
    ]
  }
};

function loadPreset(key) {
  const p = PRESETS[key];
  if (!p) return;

  nodes = []; edges = []; nextId = 1;
  resetAnimation();
  logClear();

  const pad = 78;
  const map = {};

  p.nodes.forEach(nd => {
    const x = pad + nd.x * (W - pad * 2);
    const y = pad + nd.y * (H - pad * 2);
    const n = addNode(x, y, nd.label, nd.name);
    map[nd.name] = n.id;
  });

  p.edges.forEach(([a, b, w]) => addEdge(map[a], map[b], w));

  refreshStartSelect();
  updateResult();
  setStatus(`Preset <b>${key.toUpperCase()}</b> loaded — ${nodes.length} nodes, ${edges.length} possible cable routes. Press Run.`, '');
  setHint('Preset loaded · drag nodes to rearrange · press ▶ Run Prim\'s or Kruskal\'s');
  draw();
}

/* ---------------- RANDOM GRAPH ---------------- */
function generateRandom(n) {
  n = n || (5 + Math.floor(Math.random() * 4));   // 5..8

  nodes = []; edges = []; nextId = 1;
  resetAnimation();
  logClear();

  const pad = 80;
  const pts = [];

  for (let i = 0; i < n; i++) {
    let x, y, tries = 0;
    do {
      x = pad + Math.random() * Math.max(60, W - pad * 2);
      y = pad + Math.random() * Math.max(60, H - pad * 2);
      tries++;
    } while (tries < 300 && pts.some(p => Math.hypot(p.x - x, p.y - y) < 95));
    pts.push({ x, y });
    addNode(x, y);
  }

  /* guaranteed connectivity: random spanning tree */
  for (let i = 1; i < n; i++) {
    const j = Math.floor(Math.random() * i);
    addEdge(nodes[i].id, nodes[j].id, 1 + Math.floor(Math.random() * 15));
  }

  /* extra redundant routes */
  const extra = Math.floor(n * 0.9);
  for (let k = 0; k < extra; k++) {
    const a = Math.floor(Math.random() * n);
    const b = Math.floor(Math.random() * n);
    if (a !== b) addEdge(nodes[a].id, nodes[b].id, 1 + Math.floor(Math.random() * 15));
  }

  refreshStartSelect();
  updateResult();
  setStatus(`Random network generated — ${nodes.length} nodes, ${edges.length} routes.`, '');
  setHint('Random graph ready · press ▶ Run Prim\'s or Kruskal\'s');
  draw();
}

/* ---------------- TABS ---------------- */
document.querySelectorAll('.tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    document.getElementById('view-' + t.dataset.view).classList.add('active');
    if (t.dataset.view === 'viz') setTimeout(resize, 40);
  });
});

/* ---------------- INIT ---------------- */
function init() {
  resize();
  loadPreset('campus');
  speedVal.textContent = speedIn.value;
  updateResult();
}
window.addEventListener('load', init);
setTimeout(() => { if (!nodes.length) init(); }, 60);