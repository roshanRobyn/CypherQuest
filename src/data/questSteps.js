// Ordered quest steps. To extend the quest, add another step here — the
// stage/tool/inventory/map wiring in useQuestProgression is generic and
// reads this list, so no other progression code needs to change.
//
// Step shape:
//   id                 unique step id
//   stage              which puzzle GameplayArea mounts for this step
//   onComplete         effects applied the moment this puzzle is solved
//   unlockTranslation  exact Japanese answer that unlocks this step's map
//                      location (omit if this step isn't reached via the map)
//   mapLocationId      the map dot that, once unlocked, enters this step
//   onEnter            effects applied the moment the player enters this step
//
// Effect shape: { type: "tool" | "inventoryItem", id: string }

export const QUEST_STEPS = [
  {
    id: "shredded-clue",
    stage: "shredded-clue",
    onComplete: [{ type: "tool", id: "translation" }],
  },
  {
    id: "karakuri",
    stage: "karakuri",
    unlockTranslation: "大浜漁村",
    mapLocationId: "ohama-fishing-village",
    onEnter: [{ type: "inventoryItem", id: "riddle" }],
  },
];
