import { useEffect, useRef, useState } from "react";
import { QUEST_STEPS } from "../data/questSteps";

const PULSE_MS = 3200;

// Generic, data-driven sequential quest engine. Reads QUEST_STEPS and
// exposes the current puzzle stage plus which tools/inventory items/map
// locations are unlocked — none of that is hardcoded per-puzzle here, so
// adding a step to QUEST_STEPS is the only change future puzzles need.
export function useQuestProgression() {
  const [stage, setStage] = useState(QUEST_STEPS[0].stage);
  const [completedStepIds, setCompletedStepIds] = useState([]);
  const [unlockedTools, setUnlockedTools] = useState([]);
  const [unlockedItems, setUnlockedItems] = useState([]);
  const [unlockedLocationIds, setUnlockedLocationIds] = useState([]);
  const [justUnlockedTool, setJustUnlockedTool] = useState(null);
  const [justUnlockedItem, setJustUnlockedItem] = useState(null);

  const stepById = useRef(new Map(QUEST_STEPS.map((step) => [step.id, step])));
  const stepByLocationId = useRef(
    new Map(QUEST_STEPS.filter((step) => step.mapLocationId).map((step) => [step.mapLocationId, step]))
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
        setUnlockedTools((current) => {
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

  // Call when the puzzle currently mounted for `stepId` is solved.
  const completeStep = (stepId) => {
    const step = stepById.current.get(stepId);
    if (!step) return;

    setCompletedStepIds((current) => {
      if (current.includes(stepId)) return current;
      applyEffects(step.onComplete);
      return [...current, stepId];
    });
  };

  // Call with the exact Japanese text the translator just looked up.
  const handleTranslation = (japaneseInput) => {
    const target = QUEST_STEPS.find((step) => step.unlockTranslation === japaneseInput);
    if (!target || !target.mapLocationId) return;

    setUnlockedLocationIds((current) =>
      current.includes(target.mapLocationId) ? current : [...current, target.mapLocationId]
    );
  };

  // Call when a map location marker is clicked. Returns true if it was
  // unlocked and successfully entered (so the caller can e.g. close the map).
  const enterLocation = (locationId) => {
    if (!unlockedLocationIds.includes(locationId)) return false;

    const step = stepByLocationId.current.get(locationId);
    if (!step) return false;

    setStage(step.stage);
    applyEffects(step.onEnter);
    return true;
  };

  return {
    stage,
    completedStepIds,
    unlockedTools,
    unlockedItems,
    unlockedLocationIds,
    justUnlockedTool,
    justUnlockedItem,
    completeStep,
    handleTranslation,
    enterLocation,
  };
}
