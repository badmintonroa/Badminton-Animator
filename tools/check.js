// Rechnet alle Drills aus beispiele/programm.js (oder einer anderen Datei) mit der Engine durch.
// Aufruf: node tools/check.js [pfad/zur/programm.js]
const path = require("path");
const { buildDrill } = require("../engine.js");

const file = path.resolve(process.argv[2] || path.join(__dirname, "../beispiele/programm.js"));
const LIB = require(file);
let errors = 0;

for (const [id, drill] of Object.entries(LIB.drills)) {
  try {
    const d = buildDrill(drill);
    console.log(`ok    ${id}: ${d.perRep} Schläge × ${d.reps}, ${d.total.toFixed(1)} s`);
  } catch (e) {
    errors++;
    console.log(`FEHLER ${id}: ${e.message}`);
  }
}
for (const disc of LIB.library) for (const p of disc.programmes) for (const e of p.exercises) {
  if (e.drill && !LIB.drills[e.drill]) { errors++; console.log(`FEHLER ${disc.name} / ${p.name} / ${e.name}: Drill „${e.drill}“ fehlt.`); }
}
if (LIB.library.length !== 2) { errors++; console.log("FEHLER library braucht genau zwei Disziplinen: Doppel und Einzel."); }
process.exit(errors ? 1 : 0);
