import { useEffect, useRef, useState } from "react";
import { QUEST_STEPS } from "../data/questSteps";

const PULSE_MS = 3200;

/*
  Central, reusable sequential game-state system.

  Conceptually the state this hook owns is exactly:

    currentPuzzle:      "jigsaw"
    completedPuzzles:   []
    unlockedLocations:  []
    availableTools:     []

  ...becoming, after the jigsaw is solved:

    completedPuzzles:   ["jigsaw"]
    availableTools:     ["translator"]

  ...then, after the correct translation:

    unlockedLocations:  ["ohama-fishing-village"]

  ...and once that location is entered:

    currentPuzzle:       "karakuri"

  None of that is hardcoded here — it's all read from QUEST_STEPS
  (src/data/questSteps.js). Adding a future puzzle (including one that
  eventually requires three unlocked locations + a Triangulator tool) means
  adding an entry to that file; this engine and its call sites in
  GameplayScreen do not need to change.
*/
export function useQuestProgression() {
  const [currentPuzzle, setCurrentPuzzle] = useState(QUEST_STEPS[0].id);
  const [completedPuzzles, setCompletedPuzzles] = useState([]);
  const [availableTools, setAvailableTools] = useState([]);
  const [unlockedItems, setUnlockedItems] = useState([]);
  const [unlockedLocations, setUnlockedLocations] = useState([]);
  const [justUnlockedTool, setJustUnlockedTool] = useState(null);
  const [justUnlockedItem, setJustUnlockedItem] = useState(null);

  const puzzleById = useRef(new Map(QUEST_STEPS.map((puzzle) => [puzzle.id, puzzle])));
  const puzzleByLocationId = useRef(
    new Map(
      QUEST_STEPS.filter((puzzle) => puzzle.mapLocationId).map((puzzle) => [puzzle.mapLocationId, puzzle])
    )
  );

  useEffect(() => {
    if (!justUnlockedTool) return undefined;
    const timeout = setTimeout(() => setJustUnlockedTool(null), PULSE_MS);
    return () => clearTimeout(timeout);
  }, [justUnlockedTool]);

  useEffect(() => {
    if (!justUnlockedItem) return undefined;
    const timeout = setTimeout(() => setJustUnlockedItem(null), PULSE_MS);
    return () => clearTimeout(timeout);
  }, [justUnlockedItem]);

  const applyEffects = (effects) => {
    (effects || []).forEach((effect) => {
      if (effect.type === "tool") {
        setAvailableTools((current) => {
          if (current.includes(effect.id)) return current;
          setJustUnlockedTool(effect.id);
          return [...current, effect.id];
        });
      } else if (effect.type === "inventoryItem") {
        setUnlockedItems((current) => {
          if (current.includes(effect.id)) return current;
          setJustUnlockedItem(effect.id);
          return [...current, effect.id];
        });
      }
    });
  };

  // Make `puzzleId` the active puzzle and apply whatever entering it grants.
  const enterPuzzle = (puzzleId) => {
    const puzzle = puzzleById.current.get(puzzleId);
    if (!puzzle) return;

    setCurrentPuzzle(puzzle.id);
    applyEffects(puzzle.onEnter);
  };

  // Mark a puzzle as completed, apply whatever it grants (tools, etc), and
  // — if it declares an `autoNext` — immediately enter that next puzzle.
  // `autoNext` is a temporary linear-chain mechanism: it bypasses the map,
  // for sequences whose real unlock requirements haven't been decided yet.
  const completePuzzle = (puzzleId) => {
    const puzzle = puzzleById.current.get(puzzleId);
    if (!puzzle) return;

    setCompletedPuzzles((current) => {
      if (current.includes(puzzleId)) return current;
      applyEffects(puzzle.onComplete);
      if (puzzle.autoNext) enterPuzzle(puzzle.autoNext);
      return [...current, puzzleId];
    });
  };

  // Validate a clue/answer against every puzzle's unlock requirement. Only
  // an exact match unlocks its map location — wrong input unlocks nothing.
  const handleTranslation = (japaneseInput) => {
    const target = QUEST_STEPS.find((puzzle) => puzzle.unlockTranslation === japaneseInput);
    if (!target || !target.mapLocationId) return;

    setUnlockedLocations((current) =>
      current.includes(target.mapLocationId) ? current : [...current, target.mapLocationId]
    );
  };

  // Call when a map location marker is clicked. Returns true if it was
  // unlocked and successfully entered (so the caller can e.g. close the map).
  const enterLocation = (locationId) => {
    if (!unlockedLocations.includes(locationId)) return false;

    const puzzle = puzzleByLocationId.current.get(locationId);
    if (!puzzle) return false;

    enterPuzzle(puzzle.id);
    return true;
  };

  // The puzzle component GameplayArea should mount for `currentPuzzle`.
  const currentStage = puzzleById.current.get(currentPuzzle)?.stage;

  return {
    currentPuzzle,
    currentStage,
    completedPuzzles,
    availableTools,
    unlockedItems,
    unlockedLocations,
    justUnlockedTool,
    justUnlockedItem,
    completePuzzle,
    handleTranslation,
    enterLocation,
  };
}
