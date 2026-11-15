/* Robo-Λαβύρινθος: προγραμμάτισε το ρομπότ να φτάσει στη σημαία.
   Χάρτες: # τοίχος, . δρόμος, * μπαταρία, G σημαία, ^ > v < αφετηρία (και κατεύθυνση). */
(function () {
"use strict";

const LEVELS = [
  { n: "Πρώτα βήματα", ref: 4,
    tip: "Πάτα ⬆ Μπροστά για να φτιάξεις το πρόγραμμα και μετά ▶ Εκτέλεση.",
    map: ["#######", "#>...G#", "#######"] },
  { n: "Η πρώτη στροφή", ref: 5,
    tip: "Το ρομπότ στρίβει επί τόπου, χωρίς να προχωρά. Πρόσεξε προς τα πού κοιτάζει!",
    map: ["######", "#>..##", "###.##", "###G##", "######"] },
  { n: "Μάζεψε τις μπαταρίες", ref: 12,
    tip: "Η σημαία ανοίγει μόνο αφού μαζέψεις όλες τις 🔋.",
    map: ["#######", "#>.*..#", "#####.#", "#G.*..#", "#######"] },
  { n: "Σκαλοπάτια", ref: 11,
    tip: "Δεξιά, αριστερά, δεξιά, αριστερά… Βλέπεις κάποιο μοτίβο;",
    map: ["######", "#>.###", "##..##", "###..#", "####G#", "######"] },
  { n: "Ο βρόχος", ref: 2, loops: true,
    tip: "Νέα εντολή: 🔁 Επανάλαβε. Πάτα την και μετά ⬆, για να μπει η εντολή μέσα. Πάτα τον αριθμό για να τον αλλάξεις.",
    map: ["###########", "#>.......G#", "###########"] },
  { n: "Σκάλα με βρόχο", ref: 6, loops: true,
    tip: "Βάλε μέσα σε έναν βρόχο το κομμάτι που επαναλαμβάνεται και πρόσθεσε ό,τι λείπει στο τέλος.",
    map: ["########", "#>.#####", "##..####", "###..###", "####..##", "#####.G#", "########"] },
  { n: "Ο γύρος", ref: 6, loops: true,
    tip: "Μπορείς να βάλεις βρόχο μέσα σε βρόχο! Πάτα την κεφαλίδα ενός βρόχου για να διαλέξεις πού μπαίνουν οι εντολές.",
    map: ["#######", "#*...*#", "#.###.#", "#.###.#", "#.###.#", "#^G..*#", "#######"] },
  { n: "Φιδάκι", ref: 14, loops: true,
    tip: "Οι μεγάλες ευθείες γίνονται πιο σύντομες με βρόχους.",
    map: ["#######", "#>.*..#", "#####.#", "#..*..#", "#.#####", "#..*.G#", "#######"] },
  { n: "Μεγάλη σκάλα", ref: 8, loops: true,
    tip: "Τρία ίδια σκαλοπάτια. Φτιάξε το ένα και επανάλαβέ το.",
    map: ["##########", "#>.*######", "###.######", "###..*####", "#####.####", "#####..*##", "#######.##", "#######.G#", "##########"] },
  { n: "Ο λαβύρινθος", ref: 13, loops: true,
    tip: "Μόλις φτάσεις στη σημαία με όλες τις μπαταρίες κερδίζεις, ακόμη κι αν το πρόγραμμα έχει κι άλλες εντολές.",
    map: ["#########", "#>.....*#", "#######.#", "#*......#", "#.#######", "#......*#", "#######.#", "#G......#", "#########"] },
];

const DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]]; // πάνω, δεξιά, κάτω, αριστερά
const START = { "^": 0, ">": 1, "v": 2, "<": 3 };
const LABEL = { F: "⬆ Μπροστά", L: "↶ Αριστερά", R: "↷ Δεξιά" };
const PY = { F: "robot.straight(200)", L: "robot.turn(-90)", R: "robot.turn(90)" };
const MAX_STEPS = 400;

function parse(L) {
  const rows = L.map;
  const g = { h: rows.length, w: Math.max.apply(null, rows.map(r => r.length)), wall: {}, bats: [], goal: null, start: null };
  rows.forEach((row, r) => {
    for (let c = 0; c < g.w; c++) {
      const ch = row[c] || "#";
      if (ch === "#") g.wall[r + "," + c] = 1;
      else if (ch === "*") g.bats.push(r + "," + c);
      else if (ch === "G") g.goal = r + "," + c;
      else if (ch in START) g.start = { r: r, c: c, d: START[ch] };
    }
  });
  return g;
}

function count(list) {
  return list.reduce((a, x) => a + 1 + (x.t === "loop" ? count(x.b) : 0), 0);
}
function flatten(list, out) {
  for (const x of list) {
    if (out.length > MAX_STEPS) return out;
    if (x.t === "loop") { for (let i = 0; i < x.n; i++) flatten(x.b, out); }
    else out.push(x);
  }
  return out;
}
function stars(lvl, n) {
  const ref = LEVELS[lvl].ref;
  return n <= ref ? 3 : n <= ref + 3 ? 2 : 1;
}

// Εκτέλεση χωρίς γραφικά: επιστρέφει τη σειρά καταστάσεων (χρησιμοποιείται και για έλεγχο των επιπέδων)
function simulate(lvl, prog) {
  const g = parse(LEVELS[lvl]);
  const steps = flatten(prog, []);
  let r = g.start.r, c = g.start.c, d = g.start.d;
  const got = {};
  const trace = [];
  for (let i = 0; i < steps.length; i++) {
    const x = steps[i];
    if (i >= MAX_STEPS) { trace.push({ x: x, end: "long" }); return trace; }
    if (x.t === "F") {
      const nr = r + DIRS[d][0], nc = c + DIRS[d][1];
      if (g.wall[nr + "," + nc] || nr < 0 || nc < 0 || nr >= g.h || nc >= g.w) { trace.push({ x: x, r: r, c: c, d: d, end: "crash" }); return trace; }
      r = nr; c = nc;
    } else d = (d + (x.t === "R" ? 1 : 3)) % 4;
    const k = r + "," + c;
    let pick = null;
    if (g.bats.indexOf(k) >= 0 && !got[k]) { got[k] = 1; pick = k; }
    const all = Object.keys(got).length === g.bats.length;
    const st = { x: x, r: r, c: c, d: d, pick: pick };
    if (k === g.goal) { if (all) { st.end = "win"; trace.push(st); return trace; } st.locked = true; }
    trace.push(st);
  }
  trace.push({ end: "short" });
  return trace;
}

/* ---------- UI ---------- */
let H = null;          // βοηθητικά από το app.js
let save = null;
function load() {
  save = H.store.get("rz.game", null) || { stars: {} };
  if (!save.stars) save.stars = {};
}
function persist() { H.store.set("rz.game", save); }
function unlocked(i) { return i === 0 || !!save.stars[i - 1]; }

function menu(main) {
  load();
  const total = Object.keys(save.stars).reduce((a, k) => a + save.stars[k], 0);
  main.innerHTML =
    '<div class="head"><button class="back" data-go="#/">← Αρχική</button>' +
    '<div class="title"><span>🎮</span>Robo-Λαβύρινθος</div>' +
    '<div class="sub">Γράψε το πρόγραμμα, πάτα ▶ και οδήγησε το ρομπότ στη σημαία 🏁. ' +
    "Λιγότερες εντολές = περισσότερα αστέρια. · ⭐ " + total + " / " + LEVELS.length * 3 + "</div></div>" +
    '<div class="glevels">' + LEVELS.map((L, i) => {
      const s = save.stars[i] || 0, open = unlocked(i);
      return '<button class="glvl' + (open ? "" : " lock") + '"' + (open ? ' data-go="#/game/' + (i + 1) + '"' : " disabled") + ">" +
        '<div class="num">' + (open ? i + 1 : "🔒") + '</div><div class="nm">' + H.esc(L.n) + "</div>" +
        '<div class="st">' + (open ? "★".repeat(s) + '<span class="off">' + "★".repeat(3 - s) + "</span>" : "&nbsp;") + "</div>" +
        (L.loops && (i === 0 || !LEVELS[i - 1].loops) ? '<span class="new">βρόχοι</span>' : "") + "</button>";
    }).join("") + "</div>";
}

function play(main, lvl) {
  load();
  if (!(lvl >= 0 && lvl < LEVELS.length) || !unlocked(lvl)) return menu(main);
  const L = LEVELS[lvl];
  const g = parse(L);
  let uid = 0;
  const saved = (save.prog || {})[lvl];
  let prog = saved ? revive(saved) : [];
  let target = prog;
  let view = "blocks";
  let timer = null, running = false, fast = false;
  let rot = 0;             // συνολικές μοίρες, για ομαλή περιστροφή

  function revive(list) {
    return list.map(x => x.t === "loop" ? { id: ++uid, t: "loop", n: x.n, b: revive(x.b) } : { id: ++uid, t: x.t });
  }
  function strip(list) { return list.map(x => x.t === "loop" ? { t: "loop", n: x.n, b: strip(x.b) } : { t: x.t }); }
  function remember() {
    save.prog = save.prog || {};
    save.prog[lvl] = strip(prog);
    persist();
  }

  const cell = Math.max(26, Math.min(54, Math.floor((Math.min(main.clientWidth || 360, 560)) / g.w)));

  let board = "";
  for (let r = 0; r < g.h; r++) for (let c = 0; c < g.w; c++) {
    const k = r + "," + c;
    const cls = g.wall[k] ? "w" : "f";
    const item = g.bats.indexOf(k) >= 0 ? "🔋" : k === g.goal ? "🏁" : "";
    board += '<div class="gc ' + cls + '" data-k="' + k + '">' + (item ? '<span class="it">' + item + "</span>" : "") + "</div>";
  }

  main.innerHTML =
    '<div class="head"><button class="back" data-go="#/game">← Επίπεδα</button>' +
    '<div class="title" style="font-size:20px">' + (lvl + 1) + ". " + H.esc(L.n) + "</div>" +
    '<div class="sub">Στόχος: έως ' + L.ref + " εντολές για ★★★" + (g.bats.length ? " · μάζεψε " + g.bats.length + " 🔋" : "") + "</div></div>" +
    '<div class="gtip">💡 ' + H.esc(L.tip) + "</div>" +
    '<div class="gboard" style="--cell:' + cell + "px;width:" + cell * g.w + "px;grid-template-columns:repeat(" + g.w + "," + cell + 'px)">' + board +
    '<div class="grobot" id="grobot"><svg viewBox="0 0 40 40" aria-hidden="true">' +
    '<rect x="4" y="11" width="6" height="18" rx="2" fill="#1f2937"/><rect x="30" y="11" width="6" height="18" rx="2" fill="#1f2937"/>' +
    '<rect x="8" y="8" width="24" height="26" rx="6" fill="#0b67b2"/><path d="M20 1l7 8H13z" fill="#f00087"/>' +
    '<circle cx="15" cy="16" r="3.2" fill="#fff"/><circle cx="25" cy="16" r="3.2" fill="#fff"/>' +
    '<circle cx="15" cy="16" r="1.5" fill="#f00087"/><circle cx="25" cy="16" r="1.5" fill="#f00087"/>' +
    '<rect x="14" y="25" width="12" height="3" rx="1.5" fill="#fff" opacity=".7"/></svg></div></div>' +
    '<div class="gstatus" id="gstatus"></div>' +
    '<div class="gctl"><button class="btn pri" id="grun">▶ Εκτέλεση</button>' +
    '<button class="btn sec2" id="greset">⟲ Επαναφορά</button>' +
    '<button class="btn sec2 gsq" id="gspeed" aria-label="Ταχύτητα">🐢</button></div>' +
    '<div class="tabs" style="margin-top:14px"><button class="tab on" data-view="blocks">🧩 Εντολές</button><button class="tab" data-view="code">🐍 Κώδικας Python</button></div>' +
    '<div id="gpane"></div>' +
    '<div class="gover" id="gover"></div>';

  const $ = id => document.getElementById(id);
  const robotEl = $("grobot");
  const status = $("gstatus");

  function place(r, c, d, instant) {
    const cur = ((rot % 360) + 360) % 360;
    const diff = (d * 90 - cur + 360) % 360;
    rot += diff === 270 ? -90 : diff;
    robotEl.style.transition = instant ? "none" : "";
    robotEl.style.transform = "translate(" + c * cell + "px," + r * cell + "px) rotate(" + rot + "deg)";
  }
  function resetBoard() {
    clearTimeout(timer);
    running = false;
    robotEl.classList.remove("crash", "win");
    main.querySelectorAll(".gc .it").forEach(e => e.classList.remove("got"));
    main.querySelectorAll(".gc.locked").forEach(e => e.classList.remove("locked"));
    rot = g.start.d * 90;
    place(g.start.r, g.start.c, g.start.d, true);
    setStatus("");
    mark(null);
    $("grun").disabled = false;
  }
  function setStatus(t, kind) {
    status.textContent = t;
    status.className = "gstatus" + (kind ? " " + kind : "");
  }
  function mark(id) {
    main.querySelectorAll(".gpane .run").forEach(e => e.classList.remove("run"));
    if (id != null) {
      const el = main.querySelector('[data-id="' + id + '"]');
      if (el) el.classList.add("run");
    }
  }

  /* ----- Πρόγραμμα ----- */
  function find(list, id, parent) {
    for (const x of list) {
      if (x.id === id) return { x: x, list: list, parent: parent };
      if (x.t === "loop") { const f = find(x.b, id, x); if (f) return f; }
    }
    return null;
  }
  function progHTML(list) {
    return list.map(x => x.t === "loop"
      ? '<div class="gloop' + (target === x.b ? " tgt" : "") + '"><div class="glh" data-id="' + x.id + '" data-sel="' + x.id + '">' +
        '<span>🔁 Επανάλαβε</span><button class="gcnt" data-cnt="' + x.id + '">' + x.n + "×</button>" +
        '<button class="gdel" data-del="' + x.id + '" aria-label="Διαγραφή βρόχου">✕</button></div>' +
        '<div class="glb">' + (x.b.length ? progHTML(x.b) : '<span class="ghint">' + (target === x.b ? "οι εντολές μπαίνουν εδώ…" : "πάτα εδώ για να βάλεις εντολές") + "</span>") + "</div></div>"
      : '<button class="gblk b' + x.t + '" data-id="' + x.id + '" data-del="' + x.id + '">' + LABEL[x.t] + "</button>").join("");
  }
  function pyCode() {
    const vars = "ijk";
    function gen(list, ind, depth) {
      return list.map(x => x.t === "loop"
        ? ind + "for " + (vars[depth] || "n" + depth) + " in range(" + x.n + "):\n" + (x.b.length ? gen(x.b, ind + "    ", depth + 1) : ind + "    pass\n")
        : ind + PY[x.t] + "\n").join("");
    }
    return "# Robo-Λαβύρινθος · επίπεδο " + (lvl + 1) + "\n" +
      "# Το ίδιο πρόγραμμα για LEGO EV3 (Pybricks). 1 κουτάκι = 200 mm\n" +
      "from pybricks.ev3devices import Motor\nfrom pybricks.parameters import Port\nfrom pybricks.robotics import DriveBase\n\n" +
      "left = Motor(Port.B)\nright = Motor(Port.C)\nrobot = DriveBase(left, right, wheel_diameter=56, axle_track=114)\n\n" +
      (prog.length ? gen(prog, "", 0) : "# (κενό πρόγραμμα)\n");
  }
  function renderPane() {
    const pane = $("gpane");
    const n = count(prog);
    if (view === "code") {
      const code = pyCode();
      pane.className = "";
      pane.innerHTML = '<div class="codewrap"><div class="codebar"><span>Python · ' + n + " εντολές</span></div>" +
        '<div class="code">' + H.codeTable(H.highlight(code, "py")) + "</div></div>" +
        '<div class="gnote">Γράψε τον κώδικα στο VS Code με την επέκταση EV3 MicroPython και δοκίμασέ τον σε πραγματικό ρομπότ!</div>';
      return;
    }
    pane.className = "gpane";
    pane.innerHTML =
      '<div class="gpal">' + ["F", "L", "R"].map(t => '<button class="gblk b' + t + '" data-add="' + t + '">' + LABEL[t] + "</button>").join("") +
      (L.loops ? '<button class="gblk bloop" data-add="loop">🔁 Επανάλαβε</button>' : "") + "</div>" +
      '<div class="gprog' + (target === prog ? " tgt" : "") + '" data-main="1">' +
      '<div class="gph"><span>Πρόγραμμα · <b>' + n + "</b> εντολ" + (n === 1 ? "ή" : "ές") + "</span>" +
      '<span><button class="gmini" data-act="undo">↩ Αναίρεση</button><button class="gmini" data-act="clear">🗑</button></span></div>' +
      (prog.length ? progHTML(prog) : '<span class="ghint">Πάτα τις εντολές από πάνω για να φτιάξεις το πρόγραμμα. Πάτα μια εντολή εδώ για να τη σβήσεις.</span>') +
      "</div>";
  }
  function edited() { remember(); renderPane(); }

  $("gpane").addEventListener("click", e => {
    if (running) { toast("Περίμενε να τελειώσει ή πάτα ⟲"); return; }
    const t = e.target.closest("[data-add],[data-cnt],[data-del],[data-sel],[data-act],[data-main]");
    if (!t) return;
    if (t.dataset.add) {
      if (count(prog) >= 60) { toast("Πολλές εντολές!"); return; }
      const x = t.dataset.add === "loop" ? { id: ++uid, t: "loop", n: 3, b: [] } : { id: ++uid, t: t.dataset.add };
      target.push(x);
      if (x.t === "loop") target = x.b;
      edited();
    } else if (t.dataset.cnt) {
      const f = find(prog, +t.dataset.cnt);
      f.x.n = f.x.n >= 9 ? 2 : f.x.n + 1;
      edited();
    } else if (t.dataset.del) {
      const f = find(prog, +t.dataset.del);
      f.list.splice(f.list.indexOf(f.x), 1);
      if (f.x.t === "loop" && contains(f.x, target)) target = f.list;
      edited();
    } else if (t.dataset.sel) {
      const f = find(prog, +t.dataset.sel);
      target = target === f.x.b ? f.list : f.x.b;
      edited();
    } else if (t.dataset.act === "undo") {
      undo();
      edited();
    } else if (t.dataset.act === "clear") {
      prog.length = 0;
      target = prog;
      edited();
    } else if (t.dataset.main) {
      if (target !== prog) { target = prog; edited(); }
    }
  });
  function contains(loop, arr) {
    if (loop.b === arr) return true;
    return loop.b.some(x => x.t === "loop" && contains(x, arr));
  }
  // Αναίρεση: σβήνει την τελευταία εντολή του τρέχοντος σημείου εισαγωγής (ή βγαίνει από άδειο βρόχο)
  function undo() {
    if (target.length) {
      const x = target.pop();
      if (x.t === "loop" && contains(x, target)) target = prog;
      return;
    }
    if (target !== prog) {
      const owner = (function walk(list) {
        for (const x of list) if (x.t === "loop") { if (x.b === target) return { x: x, list: list }; const w = walk(x.b); if (w) return w; }
        return null;
      })(prog);
      if (owner) { owner.list.splice(owner.list.indexOf(owner.x), 1); target = owner.list; }
    }
  }

  main.querySelectorAll("[data-view]").forEach(b => b.onclick = () => {
    view = b.dataset.view;
    main.querySelectorAll("[data-view]").forEach(x => x.classList.toggle("on", x === b));
    renderPane();
  });

  /* ----- Εκτέλεση ----- */
  $("greset").onclick = resetBoard;
  $("gspeed").onclick = e => {
    fast = !fast;
    e.currentTarget.textContent = fast ? "🐇" : "🐢";
    main.querySelector(".gboard").classList.toggle("fast", fast);
  };
  $("grun").onclick = () => {
    if (running) return;
    if (!prog.length) { toast("Πρόσθεσε πρώτα εντολές 🧩"); return; }
    resetBoard();
    if (view === "code") { view = "blocks"; main.querySelectorAll("[data-view]").forEach(x => x.classList.toggle("on", x.dataset.view === "blocks")); renderPane(); }
    main.querySelector(".gboard").scrollIntoView({ behavior: "smooth", block: "center" });
    const trace = simulate(lvl, prog);
    running = true;
    $("grun").disabled = true;
    setStatus("Εκτελείται…");
    let i = 0;
    (function tick() {
      const st = trace[i++];
      if (!st) return;
      if (st.end === "short") return finish("Το πρόγραμμα τελείωσε πριν τη σημαία. Πρόσθεσε κι άλλες εντολές.", "bad");
      if (st.end === "long") return finish("Πάρα πολλά βήματα! Μείωσε τις επαναλήψεις.", "bad");
      mark(st.x.id);
      if (st.end === "crash") {
        const dr = DIRS[st.d];
        robotEl.style.transform = "translate(" + (st.c + dr[1] * 0.25) * cell + "px," + (st.r + dr[0] * 0.25) * cell + "px) rotate(" + rot + "deg)";
        robotEl.classList.add("crash");
        return finish("💥 Τοίχος! Το ρομπότ χτύπησε. Δες ποια εντολή φωτίστηκε.", "bad");
      }
      place(st.r, st.c, st.d);
      if (st.pick) { const it = main.querySelector('[data-k="' + st.pick + '"] .it'); if (it) setTimeout(() => it.classList.add("got"), fast ? 80 : 180); }
      if (st.locked) { const gc = main.querySelector('[data-k="' + g.goal + '"]'); gc.classList.add("locked"); setStatus("🔒 Η σημαία θέλει πρώτα όλες τις μπαταρίες!", "bad"); }
      if (st.end === "win") {
        robotEl.classList.add("win");
        timer = setTimeout(() => { finish("🏁 Τα κατάφερες!", "good"); won(); }, fast ? 200 : 420);
        return;
      }
      timer = setTimeout(tick, fast ? 170 : 420);
    })();
  };
  function finish(msg, kind) {
    running = false;
    $("grun").disabled = false;
    setStatus(msg, kind);
  }
  function won() {
    const n = count(prog);
    const s = stars(lvl, n);
    const best = Math.max(save.stars[lvl] || 0, s);
    save.stars[lvl] = best;
    persist();
    const last = lvl === LEVELS.length - 1;
    const ov = $("gover");
    ov.innerHTML = '<div class="gcard"><div class="gbig">' + (last ? "🏆" : "🎉") + "</div>" +
      "<h3>" + (last ? "Τερμάτισες όλα τα επίπεδα!" : "Μπράβο!") + "</h3>" +
      '<div class="gstars">' + "★".repeat(s) + '<span class="off">' + "★".repeat(3 - s) + "</span></div>" +
      "<p>" + n + " εντολές" + (s < 3 ? " · για ★★★ θέλει έως " + LEVELS[lvl].ref + (L.loops ? ". Δοκίμασε βρόχους!" : ".") : " · τέλειο πρόγραμμα!") + "</p>" +
      '<div class="gctl"><button class="btn sec2" data-ov="again">⟲ Ξανά</button>' +
      (last ? '<button class="btn pri" data-go="#/game">Επίπεδα</button>' : '<button class="btn pri" data-go="#/game/' + (lvl + 2) + '">Επόμενο ›</button>') +
      "</div></div>";
    ov.classList.add("on");
    ov.querySelector('[data-ov="again"]').onclick = () => { ov.classList.remove("on"); resetBoard(); };
  }
  function toast(m) { H.toast(m); }

  resetBoard();
  renderPane();
}

window.RZGame = {
  LEVELS: LEVELS,
  simulate: simulate,
  count: count,
  mount(main, lvl, helpers) {
    H = helpers;
    if (lvl == null) menu(main);
    else play(main, lvl);
  },
};
})();
