// Beispielprogramm für die Multifeed-Bibliothek (bibliothek/index.html).
// Alle Drills hier sind frei erfunden und dürfen unter den Bedingungen der AGPL-3.0 (siehe LICENSE) verändert und weitergegeben werden.
//
// Aufbau:
//   drills  – Drill-Skripte im Format des Flugbahn-Studios, Schlüssel = Drill-ID
//   library – Disziplinen (Index 0 = Doppel, 1 = Einzel) mit Programmen und Übungen;
//             eine Übung verweist über "drill" auf ein Skript (ohne "drill" gibt es keine Animation)
//
// Prüfen mit:  node tools/check.js
const LIB = {
  drills: {
    block_kill: {
      id: "block_kill",
      name: "Block & Kill – alternierend",
      format: "singles",
      summary_de: "Der Feeder greift abwechselnd auf Vorhand und Rückhand an, der Worker blockt kurz ans Netz und tötet das anschließende Netzzuspiel.",
      players: {
        feeder: { side: "A", start: "mid_center" },
        worker: { side: "B", start: "base" }
      },
      tempo: { pause_between_shuttles: 1.2 },
      sequence: [
        { by: "feeder", shot: "smash", to: "B.mid_forehand", label: "Angriff VH" },
        { by: "worker", shot: "block", to: "A.front_center", label: "Block" },
        { by: "feeder", shot: "net_feed", to: "B.front_forehand", label: "Zuspiel Netz VH" },
        { by: "worker", shot: "net_kill", to: "A.mid_center", label: "Kill!" },
        { by: "feeder", shot: "smash", to: "B.mid_backhand", label: "Angriff RH" },
        { by: "worker", shot: "block", to: "A.front_center", label: "Block" },
        { by: "feeder", shot: "net_feed", to: "B.front_backhand", label: "Zuspiel Netz RH" },
        { by: "worker", shot: "net_kill", to: "A.mid_center", label: "Kill!" }
      ],
      repeat: 2
    },

    vier_ecken: {
      id: "vier_ecken",
      name: "Vier Ecken mit Rückweg",
      format: "singles",
      summary_de: "Multifeed in alle vier Ecken: hinten Vorhand, vorne Rückhand, hinten Rückhand, vorne Vorhand. Nach jedem Schlag zurück zur Mitte.",
      players: {
        feeder: { side: "A", start: "front_center" },
        worker: { side: "B", start: "base" }
      },
      tempo: { pause_between_shuttles: 1.0, feed_after_hit: 1.1 },
      sequence: [
        { by: "feeder", shot: "lift", to: "B.back_forehand", new_shuttle: true },
        { by: "worker", shot: "clear", to: "A.back_center", label: "Clear" },
        { by: "feeder", shot: "net_feed", to: "B.front_backhand", new_shuttle: true },
        { by: "worker", shot: "net", to: "A.front_backhand", label: "Netz RH" },
        { by: "feeder", shot: "lift", to: "B.back_backhand", new_shuttle: true },
        { by: "worker", shot: "drop", to: "A.front_forehand", label: "Drop um den Kopf" },
        { by: "feeder", shot: "net_feed", to: "B.front_forehand", new_shuttle: true },
        { by: "worker", shot: "lift", to: "A.back_backhand", label: "Lift VH" }
      ],
      repeat: 2
    },

    vorne_hinten: {
      id: "vorne_hinten",
      name: "Vorne-Hinten zu zweit",
      format: "doubles",
      summary_de: "Angriffsstellung im Doppel: Worker 1 bleibt vorne und nimmt alles am Netz, Worker 2 deckt das Hinterfeld und greift an.",
      players: {
        feeder: { side: "A", start: "front_center" },
        worker_1: { side: "B", start: "service_center", role: "worker" },
        worker_2: { side: "B", start: "base", role: "worker" }
      },
      tempo: { pause_between_shuttles: 1.0, feed_after_hit: 0.8 },
      sequence: [
        { by: "feeder", shot: "lift", to: "B.back_forehand", new_shuttle: true },
        { by: "worker_2", shot: "smash", to: "A.mid_backhand", label: "Smash" },
        { by: "feeder", shot: "net_feed", to: "B.front_backhand", new_shuttle: true },
        { by: "worker_1", shot: "net_kill", to: "A.mid_forehand", label: "Kill vorne" },
        { by: "feeder", shot: "push", to: "B.mid_center", new_shuttle: true },
        { by: "worker_2", shot: "drive", to: "A.mid_forehand", label: "Drive" },
        { by: "feeder", shot: "lift", to: "B.back_backhand", new_shuttle: true },
        { by: "worker_2", shot: "stick", to: "A.mid_center", label: "Halbsmash" },
        { by: "feeder", shot: "net", to: "B.front_forehand", new_shuttle: true },
        { by: "worker_1", shot: "push", to: "A.mid_backhand", label: "Push" }
      ],
      repeat: 2
    }
  },

  library: [
    {
      name: "Doppel",
      programmes: [
        {
          name: "Beispielprogramm Doppel",
          description: "Kurzes Beispiel mit einer Übung für zwei Worker.",
          duration: 10,
          shuttles: 120,
          exercises: [
            {
              name: "Vorne-Hinten zu zweit", rounds: 3, per_round: 20, total: 60, drill: "vorne_hinten",
              notes: "Der Feeder steht vorne in der Mitte und spielt jeden Ball neu ein. Hohe Bälle gehören dem hinteren Spieler, alles Kurze dem vorderen.\n\nNach jedem Satz tauschen die Worker die Positionen."
            }
          ]
        }
      ]
    },
    {
      name: "Einzel",
      programmes: [
        {
          name: "Beispielprogramm Einzel",
          description: "Zwei Übungen für Abwehr, Netz und Laufarbeit.",
          duration: 15,
          shuttles: 180,
          exercises: [
            {
              name: "Block & Kill – alternierend", rounds: 3, per_round: 16, total: 48, drill: "block_kill",
              notes: "Der Feeder greift aus dem Mittelfeld an, der Worker blockt kurz und geht sofort nach vorne.\n\nAuf den Split-Step vor jedem Angriff achten."
            },
            {
              name: "Vier Ecken mit Rückweg", rounds: 3, per_round: 20, total: 60, drill: "vier_ecken",
              notes: "Der Feeder spielt den nächsten Ball erst, wenn der Worker wieder in der Mitte ist. Mit steigendem Niveau das Tempo erhöhen."
            }
          ]
        }
      ]
    }
  ]
};

if (typeof module !== "undefined") module.exports = LIB;
