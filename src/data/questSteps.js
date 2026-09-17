// Ordered puzzle sequence. To extend the quest, add another entry here —
// the wiring in useQuestProgression is generic and reads this list, so no
// other progression code needs to change to add a puzzle.
//
// Entry shape:
//   id                 unique puzzle id (this is what shows up in
//                       completedPuzzles / currentPuzzle)
//   stage              which puzzle component GameplayArea mounts
//   onComplete         effects applied the moment this puzzle is solved
//   unlockTranslation  exact Japanese answer that unlocks this puzzle's map
//                       location (omit if this puzzle isn't reached via a
//                       map location — e.g. the very first puzzle)
//   mapLocationId      the map dot that, once unlocked, lets the player
//                       enter this puzzle
//   onEnter            effects applied the moment the player enters this puzzle
//   autoNext           id of the puzzle to enter automatically the moment
//                       this one is completed (skips the map entirely —
//                       used for a temporary linear chain). Omit to stop
//                       auto-progression after this puzzle.
//
// Effect shape: { type: "tool" | "inventoryItem", id: string }
//
// This same shape is meant to grow to support the future triangulation
// puzzles (three required locations -> Triangulator tool -> next location)
// without changing this file's structure — just richer `unlockRequirement`
// values and a `type: "location"` effect, added when that work starts.

export const QUEST_STEPS = [
  {
    id: "jigsaw",
    stage: "shredded-clue",
    onComplete: [{ type: "tool", id: "translator" }],
  },
  {
    id: "karakuri",
    stage: "karakuri",
    unlockTranslation: "大浜漁村",
    mapLocationId: "ohama-fishing-village",
    onEnter: [{ type: "inventoryItem", id: "riddle" }],
    // TEMPORARY: chain straight into Forgotten Spirit on completion, ahead
    // of deciding real unlock requirements/rewards for it.
    autoNext: "forgotten-spirit",
  },

  /*
    Integrated and playable. Not reachable via the map/translator yet — no
    unlockTranslation/mapLocationId — and their onComplete grants nothing
    yet, since neither's real rewards/order has been decided. For now they
    only run via `autoNext` from the puzzle before them, purely so the team
    can test the full chain. Once the real order/unlocks are decided,
    replace `autoNext` with a proper unlockTranslation + mapLocationId (or
    future unlockRequirement) and add onComplete/onEnter effects; no other
    progression code needs to change.
  */
  {
    id: "forgotten-spirit",
    stage: "forgotten-spirit",
    onComplete: [],
    autoNext: "lantern-switch",
  },
  {
    id: "lantern-switch",
    stage: "lantern-switch",
    onComplete: [],
    // No autoNext: progression stops here for now.
  },
];
