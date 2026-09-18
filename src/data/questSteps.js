// Ordered puzzle sequence. To extend the quest, add another entry here —
// the wiring in useQuestProgression is generic and reads this list, so no
// other progression code needs to change to add a puzzle.
//
// Entry shape:
//   id                 unique puzzle id (this is what shows up in
//                       completedPuzzles / currentPuzzle)
//   stage              which puzzle component GameplayArea mounts
//   onComplete         effects applied the moment this puzzle is solved
//   completionReveal   { japanese, mapLocationId } — the Japanese clue
//                       shown via the reusable "Clue Restored" overlay the
//                       instant this puzzle is solved. Reveals ONLY the
//                       Japanese text — never the English meaning, and
//                       never unlocks the map location by itself. The
//                       player must carry that clue to the Translator tool
//                       (src/data/translations.js needs a matching entry so
//                       the Translator can display its English meaning);
//                       only a correct translation there unlocks
//                       `mapLocationId` (see handleTranslation in
//                       useQuestProgression.js). Omit for a puzzle that
//                       doesn't reveal a next destination (yet).
//   unlockTranslation  exact Japanese answer that unlocks this puzzle's own
//                       map location (omit if this puzzle isn't reached via
//                       a map location — e.g. the very first puzzle). This
//                       is the original Jigsaw -> Translator -> Ohama path;
//                       mechanically identical to completionReveal (both
//                       are only ever resolved through the Translator), just
//                       named for its historical self-referential case
//                       (the clue unlocks the dot leading to the very
//                       puzzle that declares it).
//   mapLocationId      the map dot that, once unlocked, lets the player
//                       enter this puzzle
//   onEnter            effects applied the moment the player enters this puzzle
//   autoNext           id of the puzzle to enter automatically the moment
//                       this one is completed (skips the map entirely —
//                       used for a temporary linear chain, before a
//                       puzzle's real destination/unlock is known). Omit to
//                       stop auto-progression after this puzzle.
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
    onComplete: [],
    completionReveal: {
      japanese: "樫根の丘",
      mapLocationId: "kashine-hills",
    },
  },
  {
    id: "forgotten-spirit",
    stage: "forgotten-spirit",
    mapLocationId: "kashine-hills",
    // The 15 "Whispers of the Spirit" clues live in the inventory (see
    // WhispersViewer.jsx) rather than inside the puzzle iframe itself —
    // granted the moment the player enters the stage, same pattern as
    // karakuri's riddle above.
    onEnter: [{ type: "inventoryItem", id: "whispers" }],
    onComplete: [],
    completionReveal: {
      japanese: "磯撫で",
      mapLocationId: "isonade-coast",
    },
  },
  {
    id: "lantern-switch",
    stage: "lantern-switch",
    mapLocationId: "isonade-coast",
    onComplete: [],
    completionReveal: {
      japanese: "茶川の峡谷",
      mapLocationId: "brown-river-gorge",
    },
  },
  {
    id: "samurai-puzzle",
    stage: "samurai-puzzle",
    mapLocationId: "brown-river-gorge",
    onComplete: [],
    completionReveal: {
      japanese: "豆酘平原",
      mapLocationId: "tsutsu-plains",
    },
  },
  {
    id: "three-hidden-differences",
    stage: "three-hidden-differences",
    mapLocationId: "tsutsu-plains",
    onComplete: [],
    completionReveal: {
      japanese: "金泉",
      mapLocationId: "golden-leaf-hot-spring",
    },
    // No autoNext / next stage yet — end of the currently defined chain.
    // Golden Leaf Hot Spring becomes clickable on the map once this puzzle
    // is solved, but no puzzle is registered at that mapLocationId yet, so
    // clicking it does nothing until a future puzzle is added there.
  },
];
