// Text form of a drill sequence for the editor: one line per shot.
//   feeder smash B.mid_forehand "Angriff VH"
//   feeder net_feed B.front_forehand neu
//   worker block A.front_center contact=0.6
// Order of the words doesn't matter: a player key, a shot, a target, optionally "neu" (new shuttle),
// a "label" in quotes and key=value pairs for any other step field. Lines starting with # are comments.
(function (root) {
  // engine.js declares SHOT_TYPES as a global in the browser; in node it is required
  const SHOTS = typeof SHOT_TYPES !== "undefined" ? SHOT_TYPES : require("../engine.js").SHOT_TYPES;

  // German names without spaces work too ("netzspiel", "zuwurf", "halbsmash" …)
  const ALIASES = {};
  for (const [key, t] of Object.entries(SHOTS)) {
    ALIASES[key.toLowerCase()] = key;
    const de = t.name.toLowerCase();
    if (!/\s/.test(de) && !(de in ALIASES)) ALIASES[de] = key;
  }
  ALIASES.zuspiel = "net_feed";
  ALIASES.netfeed = "net_feed";

  const NEW_WORDS = new Set(["neu", "new", "+", "neuerball", "new_shuttle"]);
  const isZone = w => /^[ab]\./i.test(w) || w === "base" || /^(front|service|mid|back)(_|$)/i.test(w) || w.startsWith("{");

  function value(raw) {
    if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
    if (raw === "true" || raw === "false") return raw === "true";
    if (/^[{["]/.test(raw)) { try { return JSON.parse(raw); } catch (_) { /* keep text */ } }
    return raw;
  }

  function parseLine(line, players, n) {
    const step = {};
    const words = [...line.matchAll(/"([^"]*)"|„([^“”]*)[“”]|(\S+)/g)];
    for (const m of words) {
      if (m[1] != null || m[2] != null) { step.label = m[1] ?? m[2]; continue; }
      const w = m[3], lw = w.toLowerCase();
      const kv = w.match(/^([a-z_]+)=(.+)$/i);
      if (kv && !w.startsWith("{")) {
        const k = kv[1].toLowerCase();
        if (k === "to") step.to = value(kv[2]);
        else step[k] = value(kv[2]);
        continue;
      }
      const player = players.find(p => p.toLowerCase() === lw);
      if (player && step.by == null) { step.by = player; continue; }
      if (ALIASES[lw] && step.shot == null) { step.shot = ALIASES[lw]; continue; }
      if (NEW_WORDS.has(lw)) { step.new_shuttle = true; continue; }
      if (isZone(w) && step.to == null) {
        step.to = w.startsWith("{") ? value(w) : w.replace(/^([ab])\./, (_, s) => s.toUpperCase() + ".");
        continue;
      }
      if (player || ALIASES[lw]) throw new Error(`Zeile ${n}: „${w}“ steht doppelt in der Zeile.`);
      throw new Error(`Zeile ${n}: „${w}“ verstehe ich nicht. Erwartet werden ein Spieler (${players.join(", ")}), ein Schlag (z. B. smash) und ein Ziel (z. B. B.mid_forehand).`);
    }
    if (step.by == null) throw new Error(`Zeile ${n}: Es fehlt, wer schlägt (${players.join(", ")}).`);
    if (step.shot == null) throw new Error(`Zeile ${n}: Es fehlt die Schlagart, z. B. smash, block oder net_feed.`);
    if (step.to == null) throw new Error(`Zeile ${n}: Es fehlt das Ziel, z. B. B.mid_forehand.`);
    // fixed key order keeps the JSON readable
    const { by, shot, to, new_shuttle, label, ...rest } = step;
    return { by, shot, to, ...(new_shuttle ? { new_shuttle } : {}), ...(label ? { label } : {}), ...rest };
  }

  function parse(text, players) {
    const seq = [];
    text.split(/\r?\n/).forEach((line, i) => {
      const t = line.trim();
      if (!t || t.startsWith("#") || t.startsWith("//")) return;
      seq.push(parseLine(t, players, i + 1));
    });
    return seq;
  }

  function token(v) {
    if (typeof v === "string" && /^\S+$/.test(v) && !v.includes('"')) return v;
    return JSON.stringify(v);
  }
  function formatStep(s) {
    const out = [s.by, s.shot, token(s.to)];
    if (s.new_shuttle) out.push("neu");
    if (s.label) out.push(`"${String(s.label).replace(/"/g, "'")}"`);
    for (const [k, v] of Object.entries(s)) {
      if (["by", "shot", "to", "new_shuttle", "label"].includes(k) || v == null) continue;
      out.push(`${k}=${token(v)}`);
    }
    return out.join(" ");
  }
  const format = seq => seq.map(formatStep).join("\n");

  const api = { parse, format, formatStep, ALIASES };
  if (typeof module !== "undefined") module.exports = api;
  else root.DrillText = api;
})(typeof window !== "undefined" ? window : globalThis);
