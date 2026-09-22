import { useCallback, useEffect, useRef, useState } from "react";
import { QUEST_STEPS } from "../data/questSteps";
import { loadSession, saveSession } from "../data/persistence";
import { completePuzzle as reportPuzzleComplete } from "../api/cypherQuestClient";

const PULSE_MS = 3200;

// Only the authoritative progression fields are persisted — never
// justUnlockedTool/justUnlockedItem (one-shot pulse-animation triggers)
// or reveal (a dismissible popup) — those are transient UI state, and
// restoring them would replay animations/popups the player already
// dismissed. discoveredClues isn't listed either: it's derived from
// completedPuzzles + QUEST_STEPS (see below), so restoring
// completedPuzzles alone reconstructs it.
//
// Defensive by construction: anything missing, the wrong type, or (for
// completedPuzzles/currentPuzzle) naming a puzzle id that no longer
// exists in QUEST_STEPS is dropped rather than trusted, so a corrupted or
// stale record can never crash the app or leave it in an inconsistent
// state — it just falls back to that one field's normal default.
function sanitizeQuestState(rawQuest) {
  const validPuzzleIds = new Set(QUEST_STEPS.map((puzzle) => puzzle.id));
  const stringArray = (value) => (Array.isArray(value) ? value.filter((item) => typeof item === "string") : []);

  const currentPuzzle =
    typeof rawQuest?.currentPuzzle === "string" && validPuzzleIds.has(rawQuest.currentPuzzle)
      ? rawQuest.currentPuzzle
      : QUEST_STEPS[0].id;

  return {
    currentPuzzle,
    completedPuzzles: stringArray(rawQuest?.completedPuzzles).filter((id) => validPuzzleIds.has(id)),
    availableTools: stringArray(rawQuest?.availableTools),
    unlockedItems: stringArray(rawQuest?.unlockedItems),
    unlockedLocations: stringArray(rawQuest?.unlockedLocations),
  };
}

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
export function useQuestProgression(teamName) {
  // Each lazy initializer below runs exactly once, on this hook's first
  // mount, never again on subsequent renders — so recomputing
  // sanitizeQuestState(loadSession()?.quest) independently per field
  // (rather than sharing one precomputed value via a ref, which would
  // read that ref during render) is still only ever done once per field,
  // not per render.
  const [currentPuzzle, setCurrentPuzzle] = useState(
    () => sanitizeQuestState(loadSession()?.quest).currentPuzzle
  );
  const [completedPuzzles, setCompletedPuzzles] = useState(
    () => sanitizeQuestState(loadSession()?.quest).completedPuzzles
  );
  const [availableTools, setAvailableTools] = useState(
    () => sanitizeQuestState(loadSession()?.quest).availableTools
  );
  const [unlockedItems, setUnlockedItems] = useState(
    () => sanitizeQuestState(loadSession()?.quest).unlockedItems
  );
  const [unlockedLocations, setUnlockedLocations] = useState(
    () => sanitizeQuestState(loadSession()?.quest).unlockedLocations
  );
  const [justUnlockedTool, setJustUnlockedTool] = useState(null);
  const [justUnlockedItem, setJustUnlockedItem] = useState(null);
  const [reveal, setReveal] = useState(null);

  // Persist on every change to any authoritative field, so a browser
  // refresh at literally any point (mid-puzzle, right after a completion
  // reveal, on the map, right after translating) has nothing but the
  // instant before it to lose. Cheap: a handful of small arrays/strings,
  // not the whole app.
  useEffect(() => {
    saveSession({
      teamName,
      quest: { currentPuzzle, completedPuzzles, availableTools, unlockedItems, unlockedLocations },
    });
  }, [teamName, currentPuzzle, completedPuzzles, availableTools, unlockedItems, unlockedLocations]);

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
  //
  // `completionReveal` is the permanent replacement for that once a
  // puzzle's real destination is known: { japanese, mapLocationId, skipOverlay? }.
  // Completing the puzzle shows ONLY the Japanese clue via the reusable
  // "Clue Restored" presentation every puzzle uses (unless `skipOverlay` is
  // set, e.g. the Jigsaw, whose own iframe already shows its own reveal).
  // It does NOT unlock the map location and does NOT reveal the English
  // meaning — translating the clue (below, via the Translator tool) is the
  // only thing that does either of those, exactly like the original
  // Jigsaw -> Translator -> Ohama flow. A puzzle can have `completionReveal`
  // and no `autoNext` (or vice versa) — the two mechanisms don't interact.
  //
  // Regardless of `skipOverlay`, completing a puzzle with `completionReveal`
  // permanently adds its clue to the discovered-clue log (see
  // `discoveredClues` below) — dismissing the popup never removes it from
  // there, since the log is derived from `completedPuzzles`, which this
  // function only ever appends to.
  const completePuzzle = (puzzleId) => {
    const puzzle = puzzleById.current.get(puzzleId);
    if (!puzzle) return;

    setCompletedPuzzles((current) => {
      if (current.includes(puzzleId)) return current;
      applyEffects(puzzle.onComplete);
      if (puzzle.autoNext) enterPuzzle(puzzle.autoNext);
      if (puzzle.completionReveal && !puzzle.completionReveal.skipOverlay) {
        setReveal({ japanese: puzzle.completionReveal.japanese });
      }

      // Fire-and-forget: tell the backend so admin monitoring/leaderboard
      // picks it up. Never awaited, never blocks the UI; the client itself
      // swallows all errors (backend down, offline, etc).
      try {
        const teamId = window.localStorage.getItem("cypherquest_team_id");
        if (teamId) reportPuzzleComplete(teamId, puzzleId).catch(() => {});
      } catch {
        // ignore storage access failures (e.g. private browsing)
      }

      return [...current, puzzleId];
    });
  };

  // Every clue discovered so far, in quest order, for the persistent
  // "discovered clues" inventory log. Deliberately a derived value rather
  // than its own state: it reuses `completedPuzzles` (already permanent for
  // the session) instead of tracking a second, parallel copy of the same
  // fact, so dismissing the "Clue Restored" popup can never desync it.
  const discoveredClues = QUEST_STEPS.filter(
    (puzzle) => puzzle.completionReveal && completedPuzzles.includes(puzzle.id)
  ).map((puzzle) => ({ id: puzzle.id, japanese: puzzle.completionReveal.japanese }));

  // Stable across renders (useCallback + [] deps) so it can safely be
  // listed as an effect dependency at call sites (e.g. GameplayScreen's
  // Escape-key handler) without that effect re-running on every render.
  const dismissReveal = useCallback(() => setReveal(null), []);

  // Validate a clue/answer against every puzzle's unlock requirement. Only
  // an exact match unlocks its map location — wrong input unlocks nothing.
  // This is the ONLY place a map location gets unlocked: neither puzzle
  // completion nor the reveal overlay unlock anything by themselves — the
  // player must bring the revealed Japanese clue here, to the Translator.
  //
  // Two independent sources feed this lookup:
  //   unlockTranslation      the original per-destination field (e.g.
  //                          karakuri's "大浜漁村" -> its own mapLocationId)
  //   completionReveal.japanese   a completed puzzle's own revealed clue,
  //                          unlocking whatever mapLocationId it names —
  //                          which may or may not have a puzzle behind it
  //                          yet (see three-hidden-differences' entry).
  const handleTranslation = (japaneseInput) => {
    const viaUnlockTranslation = QUEST_STEPS.find(
      (puzzle) => puzzle.unlockTranslation === japaneseInput
    );
    const viaCompletionReveal = QUEST_STEPS.find(
      (puzzle) => puzzle.completionReveal?.japanese === japaneseInput
    );

    const mapLocationId =
      viaUnlockTranslation?.mapLocationId ?? viaCompletionReveal?.completionReveal.mapLocationId;
    if (!mapLocationId) return;

    setUnlockedLocations((current) =>
      current.includes(mapLocationId) ? current : [...current, mapLocationId]
    );
  };

  // Call when a map location marker is clicked. Returns true if it was
  // unlocked and successfully entered (so the caller can e.g. close the map).
  //
  // The physical map has a fixed set of dots but the quest may eventually
  // have 20+ puzzles, so a dot is not a permanent gateway to one puzzle —
  // it's a reusable gate. Entering successfully CONSUMES the location by
  // removing it from `unlockedLocations`: the dot stays visible on the map
  // (map visuals are untouched) but is no longer in the unlocked set the
  // next time the iframe reloads, so clicking it again does nothing — it
  // reads as "locked" again rather than as some separate "visited" state,
  // which is all that's needed since both render identically (not
  // clickable). No separate consumed/visited set is tracked: consumption
  // IS removal from `unlockedLocations`, so a later quest step whose own
  // `completionReveal`/`unlockTranslation` names this same `mapLocationId`
  // can unlock (re-add) it again through the exact same handleTranslation
  // path above — reuse of a physical dot for a future puzzle just works,
  // with no extra state or special-casing.
  const enterLocation = (locationId) => {
    if (!unlockedLocations.includes(locationId)) return false;

    const puzzle = puzzleByLocationId.current.get(locationId);
    if (!puzzle) return false;

    enterPuzzle(puzzle.id);
    setUnlockedLocations((current) => current.filter((id) => id !== locationId));
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
    reveal,
    dismissReveal,
    discoveredClues,
    completePuzzle,
    handleTranslation,
    enterLocation,
  };
}
