import { useState } from "react";
import IframePuzzleStage from "./IframePuzzleStage";
import { WHISPERS_CLUES } from "../../../data/whispersClues";

// The Shogi board's OWN puzzle-solving clues ("Whispers of the Spirit") —
// static content the player needs WHILE placing stones, always available
// the instant this stage mounts. Same content already granted to the
// Inventory's Whispers item (via onEnter, see questSteps.js) and shown by
// WhispersViewer.jsx — both read from the one shared WHISPERS_CLUES
// module, so this is a second PRESENTATION of that content, not a second
// copy of it.
//
// This is deliberately unrelated to the puzzle's COMPLETION clue (磯撫で):
// that's quest-progression state (quest.discoveredClues), produced only
// once this puzzle is solved, and continues to use the exact same
// CLUE RESTORED -> persistent Inventory -> Translator flow every other
// puzzle uses (see completePuzzle in useQuestProgression.js) — nothing
// about that path is touched here.
function ForgottenSpiritStage({ onComplete }) {
  const [clueOpen, setClueOpen] = useState(false);

  return (
    <IframePuzzleStage
      puzzleId="forgotten-spirit"
      label="THE SACRED TRIAL"
      title="The Forgotten Spirit"
      src="/puzzles/forgotten-spirit.html"
      onComplete={onComplete}
    >
      <button
        type="button"
        className="gp-fs-clue-note"
        onClick={() => setClueOpen((open) => !open)}
        aria-label={clueOpen ? "Close Whispers of the Spirit" : "View Whispers of the Spirit"}
        title="Whispers of the Spirit"
      >
        霊
      </button>

      {/*
        A small floating parchment note, NOT a full-screen modal — no
        backdrop/scrim element exists here at all, so nothing outside
        this note's own small box ever captures a click. The Shogi board,
        its stones, and the reset button stay fully interactive with the
        note open; only clicking inside the note itself does anything.
      */}
      {clueOpen && (
        <div className="gp-fs-clue-panel">
          <button
            type="button"
            className="gp-fs-clue-panel-close"
            onClick={() => setClueOpen(false)}
            aria-label="Close Whispers of the Spirit"
          >
            ✕
          </button>

          <p className="gp-fs-clue-panel-heading">Whispers of the Spirit</p>

          <div className="gp-fs-clue-panel-list">
            {WHISPERS_CLUES.map((clue) => (
              <div className="gp-fs-clue-panel-item" key={clue.numeral}>
                <span className="gp-fs-clue-panel-number">{clue.numeral}</span>
                <span>{clue.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </IframePuzzleStage>
  );
}

export default ForgottenSpiritStage;
