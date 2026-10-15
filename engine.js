// Drill engine shared by the pages and the node check (no DOM, no three.js).
// Court: x = width, z = length, y = up. Net at z = 0. Side A is the near half (z > 0), side B the far half (z < 0).
const HALF_L = 6.70, HALF_W = 3.05, SINGLES_HW = 2.59;
const SHORT_SVC = 1.98, LONG_SVC_DBL = 5.94, LINE = 0.04;
const NET_CENTER = 1.524, NET_POST = 1.55;
const netHeight = x => NET_CENTER + (NET_POST - NET_CENTER) * Math.min(1, (Math.abs(x) / HALF_W) ** 2);

// Shuttle physics: gravity + quadratic drag, terminal velocity ~6.8 m/s
const G = 9.81, VT = 6.8, K = G / (VT * VT);
const RAD = Math.PI / 180;

function simulate(p0, v0) {
  const dt = 0.002;
  let p = { ...p0 }, v = { ...v0 }, t = 0;
  const pts = [{ t, x: p.x, y: p.y, z: p.z }];
  let netY = null, netX = 0, apex = p.y, land = null;
  const acc = u => { const s = Math.hypot(u.x, u.y, u.z); return { x: -K * s * u.x, y: -G - K * s * u.y, z: -K * s * u.z }; };
  while (t < 8) {
    const a1 = acc(v);
    const vm = { x: v.x + a1.x * dt / 2, y: v.y + a1.y * dt / 2, z: v.z + a1.z * dt / 2 };
    const a2 = acc(vm);
    const np = { x: p.x + vm.x * dt, y: p.y + vm.y * dt, z: p.z + vm.z * dt };
    const nv = { x: v.x + a2.x * dt, y: v.y + a2.y * dt, z: v.z + a2.z * dt };
    if (netY === null && p.z !== 0 && Math.sign(p.z) !== Math.sign(np.z)) {
      const f = p.z / (p.z - np.z);
      netY = p.y + (np.y - p.y) * f; netX = p.x + (np.x - p.x) * f;
    }
    if (np.y <= 0) {
      const f = p.y / (p.y - np.y);
      land = { t: t + dt * f, x: p.x + (np.x - p.x) * f, y: 0, z: p.z + (np.z - p.z) * f, v: Math.hypot(nv.x, nv.y, nv.z) };
      pts.push(land);
      break;
    }
    p = np; v = nv; t += dt;
    apex = Math.max(apex, p.y);
    pts.push({ t, x: p.x, y: p.y, z: p.z });
  }
  return { pts, land, netY, netX, apex, from: p0 };
}

// A shot across the net must clear the tape; a throw on the own half (feeder next to the worker) has no net to clear.
const netOk = (r, sameSide) => sameSide || (r.netY !== null && r.netY > netHeight(r.netX) + 0.05);

// Solve launch so the shuttle lands on `to`.
// mode "angle": fixed elevation, bisect speed. mode "speed": fixed speed, bisect elevation.
function solve(from, to, spec) {
  const dx = to.x - from.x, dz = to.z - from.z, D = Math.hypot(dx, dz) || 0.01;
  const ux = dx / D, uz = dz / D;
  const sameSide = Math.sign(from.z) === Math.sign(to.z);
  const shoot = (v, th) => simulate(from, { x: ux * Math.cos(th * RAD) * v, y: Math.sin(th * RAD) * v, z: uz * Math.cos(th * RAD) * v });
  const reach = r => r.land ? (r.land.x - from.x) * ux + (r.land.z - from.z) * uz : 1e9;

  if (spec.mode === "speed") {
    for (let v = spec.v0; v >= spec.v0 * 0.45; v *= 0.92) {
      let lo = spec.thMin, hi = spec.thMax;
      if (reach(shoot(v, hi)) < D || reach(shoot(v, lo)) > D) continue;
      for (let i = 0; i < 36; i++) { const m = (lo + hi) / 2; reach(shoot(v, m)) < D ? lo = m : hi = m; }
      const r = shoot(v, hi);
      if (netOk(r, sameSide)) return { ...r, v0: v, theta: hi };
    }
  }
  for (let th = spec.theta ?? 20; th <= 78; th += 2) {
    let lo = 0.5, hi = 120;
    if (reach(shoot(hi, th)) < D) continue;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; reach(shoot(m, th)) < D ? lo = m : hi = m; }
    const r = shoot(hi, th);
    if (netOk(r, sameSide)) return { ...r, v0: hi, theta: th };
  }
  return null;
}

// Shot types: contact height (m), launch model, German name
const SHOT_TYPES = {
  clear:    { name: "Clear",        contact: 2.5,  spec: { mode: "angle", theta: 38 } },
  smash:    { name: "Smash",        contact: 2.7,  spec: { mode: "speed", v0: 85, thMin: -40, thMax: 8 } },
  stick:    { name: "Halbsmash",    contact: 2.6,  spec: { mode: "speed", v0: 55, thMin: -35, thMax: 8 } },
  slice:    { name: "Slice",        contact: 2.5,  spec: { mode: "speed", v0: 34, thMin: -30, thMax: 10 } },
  drop:     { name: "Drop",         contact: 2.5,  spec: { mode: "angle", theta: 4 } },
  drive:    { name: "Drive",        contact: 1.3,  spec: { mode: "speed", v0: 34, thMin: -6, thMax: 18 } },
  lay_off:  { name: "Lay-off",      contact: 1.2,  spec: { mode: "angle", theta: 18 } },
  block:    { name: "Block",        contact: 0.75, spec: { mode: "angle", theta: 24 } },
  net:      { name: "Netzspiel",    contact: 1.3,  spec: { mode: "angle", theta: 25 } },
  spin:     { name: "Netz-Spin",    contact: 1.35, spec: { mode: "angle", theta: 28 } },
  net_feed: { name: "Zuspiel Netz", contact: 1.2,  spec: { mode: "angle", theta: 62 } },
  lift:     { name: "Lift",         contact: 0.5,  spec: { mode: "angle", theta: 56 } },
  flat_lift:{ name: "Flacher Lift", contact: 0.9,  spec: { mode: "angle", theta: 30 } },
  push:     { name: "Push",         contact: 1.5,  spec: { mode: "speed", v0: 24, thMin: -20, thMax: 12 } },
  serve:    { name: "Aufschlag",    contact: 1.1,  spec: { mode: "angle", theta: 22 } },
  flick:    { name: "Swip-Aufschlag", contact: 1.1, spec: { mode: "angle", theta: 48 } },
  net_kill: { name: "Kill",         contact: 2.0,  spec: { mode: "speed", v0: 45, thMin: -50, thMax: 5 }, ends: true },
  kill:     { name: "Kill",         contact: 2.0,  spec: { mode: "speed", v0: 45, thMin: -50, thMax: 5 }, ends: true },
  feed:     { name: "Zuwurf",       contact: 1.4,  spec: { mode: "angle", theta: 45 } },
  throw:    { name: "Wurf",         contact: 1.6,  spec: { mode: "angle", theta: 30 } },
};
// Shots that may stay on the own half (hand throws from a feeder standing next to the worker)
const SAME_SIDE_OK = new Set(["feed", "throw"]);

// Zones. Depth is measured from the net; forehand follows the handedness of the hitting side's worker.
const DEPTH = { front: 1.25, service: 2.3, mid: 3.5, back: 5.8, base: 3.7 };
const DEPTH_DE = { front: "Vorne", service: "Aufschlaglinie", mid: "Mitte", back: "Hinten" };
const COL_DE = { forehand: "VH", center: "Mitte", backhand: "RH" };

function makeZoneResolver(drill) {
  const lateral = drill.format === "doubles" ? 2.2 : 1.65;
  const keys = Object.keys(drill.players);
  const handOf = side => {
    // the worker's hand decides; a feeder standing on the same half doesn't flip the court
    const onSide = keys.filter(k => drill.players[k].side === side);
    const k = onSide.find((k, i) => keys.indexOf(k) !== 0) ?? onSide[0];
    const p = k && drill.players[k];
    return p && String(p.hand || "R").toUpperCase().startsWith("L") ? "L" : "R";
  };
  function resolve(ref, defaultSide) {
    if (typeof ref !== "string") throw new Error(`Zone fehlt oder ist kein Text: ${JSON.stringify(ref)}`);
    let side = defaultSide, name = ref.trim();
    const m = name.match(/^([AB])\.(.+)$/i);
    if (m) { side = m[1].toUpperCase(); name = m[2]; }
    if (side !== "A" && side !== "B") throw new Error(`Zone „${ref}“ braucht eine Seite, z. B. „B.${name}“.`);
    const sgn = side === "A" ? 1 : -1;
    if (name === "base") return { x: 0, z: sgn * DEPTH.base, side, label: `${side} · Base` };
    const parts = name.split("_");
    const depth = parts[0], col = parts[1] || "center", wide = parts[2] === "wide";
    if (!(depth in DEPTH_DE) || !(col in COL_DE) || (parts[2] && !wide) || (wide && col === "center")) throw new Error(`Unbekannte Zone „${ref}“.`);
    // facing the net, a right-hander's forehand is +x on side A and -x on side B
    const fhSign = (side === "A" ? 1 : -1) * (handOf(side) === "L" ? -1 : 1);
    // "_wide" sits on the singles sideline (singles) or in the side tramline (doubles)
    const lat = wide ? (drill.format === "doubles" ? 2.8 : 2.35) : lateral;
    const x = col === "center" ? 0 : (col === "forehand" ? fhSign : -fhSign) * lat;
    return { x, z: sgn * DEPTH[depth], side, label: `${side} · ${DEPTH_DE[depth]} ${COL_DE[col]}${wide ? " außen" : ""}` };
  }
  return resolve;
}

// Find where the receiving player meets the ball: the last moment it is still at/above contact height on their side.
function intercept(traj, contact, side) {
  const pts = traj.pts, sideOk = p => side === "A" ? p.z > 0.25 : p.z < -0.25;
  let idx = -1;
  for (let i = pts.length - 1; i > 0; i--) if (pts[i].y >= contact && sideOk(pts[i])) { idx = i; break; }
  if (idx < 0) idx = Math.max(1, pts.length - 1 - Math.round(0.08 / 0.002));
  return { index: idx, point: pts[idx] };
}

// Build a drill timeline: one segment per shot.
// A shot chains onto the previous ball when that ball comes to the hitter's half and is still in play,
// unless the step says "new_shuttle": true (multifeed: the feeder starts the next shuttle).
// With tempo.feed_after_hit a new shuttle leaves that many seconds after the previous shot was struck,
// so several shuttles can be in the air at once; otherwise it waits pause_between_shuttles after the landing.
function buildDrill(drill) {
  if (!drill || typeof drill !== "object") throw new Error("Das Skript muss ein JSON-Objekt sein.");
  if (!drill.players || typeof drill.players !== "object") throw new Error("„players“ fehlt.");
  if (!Array.isArray(drill.sequence) || !drill.sequence.length) throw new Error("„sequence“ fehlt oder ist leer.");
  const zone = makeZoneResolver(drill);
  const pause = Number(drill.tempo?.pause_between_shuttles ?? 1.2);
  const afterHit = drill.tempo?.feed_after_hit == null ? null : Number(drill.tempo.feed_after_hit);
  const reps = Math.max(1, Math.min(10, Math.round(Number(drill.repeat ?? 1))));
  // colour slot per player: "role" decides feeder/worker (default: first player feeds), the second of a role gets the alt colour
  const actorOf = {}, seen = { feeder: 0, worker: 0 };
  Object.keys(drill.players).forEach((k, i) => {
    const role = drill.players[k].role === "feeder" || (drill.players[k].role == null && i === 0) ? "feeder" : "worker";
    actorOf[k] = seen[role]++ ? `${role}2` : role;
  });

  const segs = [];
  let prev = null;
  drill.sequence.forEach((step, i) => {
    const pl = drill.players[step.by];
    if (!pl) throw new Error(`Schlag ${i + 1}: Spieler „${step.by}“ ist nicht unter „players“ definiert.`);
    const type = SHOT_TYPES[step.shot];
    if (!type) throw new Error(`Schlag ${i + 1}: Schlagart „${step.shot}“ kenne ich nicht.`);
    const target = zone(step.to, pl.side === "A" ? "B" : "A");
    if (target.side === pl.side && !SAME_SIDE_OK.has(step.shot)) throw new Error(`Schlag ${i + 1}: Ziel „${step.to}“ liegt auf der eigenen Seite.`);
    const contact = Number(step.contact ?? type.contact);

    let from, chained = false, t = 0;
    const incoming = prev && !prev.ends && !step.new_shuttle && prev.target.side === pl.side;
    if (incoming) {
      const cut = intercept(prev.traj, contact, pl.side);
      prev.cutIndex = cut.index;
      prev.dur = cut.point.t;
      from = { x: cut.point.x, y: cut.point.y, z: cut.point.z };
      chained = true;
      t = prev.start + prev.dur + 0.04;
    } else {
      const start = zone(step.from || pl.start || "base", pl.side);
      from = { x: start.x, y: contact, z: start.z };
      if (prev) {
        const gap = step.gap != null ? Number(step.gap) : null;
        if (afterHit != null) t = prev.start + Math.max(0.15, gap ?? afterHit);
        else t = prev.start + prev.dur + (gap ?? pause);
      }
    }
    const traj = solve(from, { x: target.x, y: 0, z: target.z }, type.spec);
    if (!traj) throw new Error(`Schlag ${i + 1} (${type.name} nach ${step.to}) lässt sich nicht über das Netz spielen.`);
    const seg = {
      n: i + 1, by: step.by, actor: actorOf[step.by],
      shot: step.shot, type, label: step.label || type.name,
      target, traj, start: t, dur: traj.land.t, ends: !!type.ends, chained,
    };
    segs.push(seg); prev = seg;
  });
  // a repetition lasts until its last ball is down
  const end = Math.max(...segs.map(s => s.start + s.dur));
  const repLen = end + pause;
  const all = [];
  for (let r = 0; r < reps; r++) for (const s of segs) all.push({ ...s, start: s.start + r * repLen, rep: r + 1 });
  return { drill, segs: all, perRep: segs.length, reps, total: reps * repLen - pause + 1.0 };
}

if (typeof module !== "undefined") module.exports = { buildDrill, makeZoneResolver, solve, simulate, SHOT_TYPES, HALF_L, HALF_W, SINGLES_HW, netHeight };

