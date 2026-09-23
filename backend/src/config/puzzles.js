/**
 * Fixed, ordered puzzle catalog for Cypher Quest.
 *
 * This is the single source of truth for puzzle order and identity.
 * `file` is informational (maps to the standalone HTML puzzle file in the
 * frontend) and is not used by the backend to serve any content.
 *
 * `puzzleId` values match `src/data/questSteps.js` (QUEST_STEPS[].id) on the
 * frontend exactly, since that is what the client sends to
 * POST /api/game/puzzle-complete. Keep the two files in sync if the quest
 * sequence changes.
 */

export const PUZZLES = [
  { puzzleId: "jigsaw", name: "Shredded Clue (Jigsaw)", file: "public/puzzles/shredded-clue.html" },
  { puzzleId: "karakuri", name: "Karakuri Lock", file: "public/puzzles/karakuri-sequence.html" },
  { puzzleId: "forgotten-spirit", name: "The Forgotten Spirit", file: "public/puzzles/forgotten-spirit.html" },
  { puzzleId: "lantern-switch", name: "Lantern Switch", file: "public/puzzles/lantern-switch.html" },
  { puzzleId: "samurai-puzzle", name: "Samurai Puzzle", file: "public/puzzles/samurai-puzzle.html" },
  { puzzleId: "three-hidden-differences", name: "Three Hidden Differences", file: "public/puzzles/three-hidden-differences.html" },
  { puzzleId: "kintsugi-shrine", name: "Kintsugi Shrine", file: "public/puzzles/kintsugi-shrine.html" },
  // Terminal step, NOT a level (L1–L7 are the seven entries above).
  // Completing it — and only it — marks the hunt COMPLETED, sets
  // finishedAt, and freezes totalTimeMs (see gameplayService.completePuzzle).
  { puzzleId: "final-treasure", name: "Final Treasure", file: "public/puzzles/final-treasure.html" },
];

export const PUZZLE_IDS = PUZZLES.map((p) => p.puzzleId);

export function getPuzzleIndex(puzzleId) {
  return PUZZLES.findIndex((p) => p.puzzleId === puzzleId);
}

export function isValidPuzzleId(puzzleId) {
  return getPuzzleIndex(puzzleId) !== -1;
}

export function getNextPuzzleId(puzzleId) {
  const idx = getPuzzleIndex(puzzleId);
  if (idx === -1 || idx + 1 >= PUZZLES.length) return null;
  return PUZZLES[idx + 1].puzzleId;
}

export function getFirstPuzzleId() {
  return PUZZLES[0].puzzleId;
}

export function isLastPuzzle(puzzleId) {
  const idx = getPuzzleIndex(puzzleId);
  return idx !== -1 && idx === PUZZLES.length - 1;
}
