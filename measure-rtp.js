// Measures Tiger Temple's RTP at payScale = 1 by simulation, using the engine inside index.html.
// Run: node measure-rtp.js [rounds]   (default 40,000,000, split across all CPU cores)
// Paste the printed BASE_RTP into index.html whenever a weight, pay or feature changes.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

function loadEngine() {
  const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const body = src.split('/* ENGINE-START')[1].split('/* ENGINE-END */')[0].replace(/^[^\n]*\n/, '');
  return new Function(body + ';return Engine;')();
}

// Same steps as Engine.playRound, with counters for each feature.
function run(rounds) {
  const E = loadEngine();
  const bet = 10;
  const s = { rounds, paid: 0, paidSq: 0, base: 0, fsWin: 0, bonuses: 0, fsSpins: 0, rush: 0, capped: 0 };
  for (let i = 0; i < rounds; i++) {
    const b = E.baseSpin();
    if (b.rush.length) s.rush++;
    let r = E.evaluate(b.grid, bet, 1);
    let won = r.total, fsLeft = r.scatter.freeSpins, played = 0;
    s.base += r.total;
    if (fsLeft) s.bonuses++;
    const sticky = new Set();
    while (fsLeft > 0 && played < E.MAX_FS) {
      fsLeft--; played++;
      r = E.evaluate(E.freeSpin(sticky).grid, bet, E.FS_MULT);
      won += r.total; s.fsWin += r.total;
      fsLeft += E.extraSpins(r.scatter.count);
    }
    if (fsLeft > 0) s.capped++;
    s.fsSpins += played;
    const x = won / bet;
    s.paid += x; s.paidSq += x * x;
  }
  return s;
}

if (isMainThread) {
  const total = Number(process.argv[2]) || 40_000_000;
  const cores = os.cpus().length;
  const per = Math.ceil(total / cores);
  const t0 = Date.now();
  Promise.all(Array.from({ length: cores }, () => new Promise((res, rej) => {
    const w = new Worker(__filename, { workerData: per });
    w.on('message', res); w.on('error', rej);
  }))).then(parts => {
    const s = parts.reduce((a, p) => { for (const k in p) a[k] = (a[k] || 0) + p[k]; return a; }, {});
    const n = s.rounds, mean = s.paid / n;
    const sd = Math.sqrt(s.paidSq / n - mean * mean);
    const pct = v => (v * 100).toFixed(2) + '%';
    console.log(`rounds            ${n.toLocaleString()} in ${((Date.now() - t0) / 1000).toFixed(0)}s on ${cores} cores`);
    console.log(`BASE_RTP          ${(mean * 100).toFixed(2)}   (±${(1.96 * sd / Math.sqrt(n) * 100).toFixed(2)} at 95%)`);
    console.log(`  base game       ${pct(s.base / 10 / n)}`);
    console.log(`  free spins      ${pct(s.fsWin / 10 / n)}`);
    console.log(`volatility (SD)   ${sd.toFixed(1)}x bet per round`);
    console.log(`bonus frequency   1 in ${Math.round(n / s.bonuses)} spins`);
    console.log(`avg bonus length  ${(s.fsSpins / s.bonuses).toFixed(1)} free spins`);
    console.log(`avg bonus pays    ${(s.fsWin / 10 / s.bonuses).toFixed(1)}x bet`);
    console.log(`Tiger Rush        1 in ${Math.round(n / s.rush)} spins`);
    console.log(`bonuses capped    ${s.capped} (at ${100} spins)`);
  });
} else {
  parentPort.postMessage(run(workerData));
}
