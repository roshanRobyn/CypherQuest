import { useState } from "react";
import IframePuzzleStage from "./IframePuzzleStage";

// `clueJapanese` is never owned here — it's forwarded from
// useQuestProgression's existing `discoveredClues` (GameplayScreen ->
// GameplayArea -> here), the same persistent, session-restored log every
// other puzzle's clue already lives in. This component only adds a
// convenient, in-board way to re-read that ALREADY-discovered clue
// without leaving the Shogi screen or opening the Inventory's clue log —
// it never stores, duplicates, or mutates the clue itself. Undefined
// until "forgotten-spirit" is actually completed, exactly like every
// other discovered-clue consumer in the app.
function ForgottenSpiritStage({ onComplete, clueJapanese }) {
  const [clueOpen, setClueOpen] = useState(false);

  return (
    <IframePuzzleStage
      puzzleId="forgotten-spirit"
      label="THE SACRED TRIAL"
      title="The Forgotten Spirit"
      src="/puzzles/forgotten-spirit.html"
      onComplete={onComplete}
    >
      {clueJapanese && (
        <button
          type="button"
          className="gp-fs-clue-note"
          onClick={() => setClueOpen((open) => !open)}
          aria-label={clueOpen ? "Close discovered clue" : "View discovered clue"}
          title="Discovered clue"
        >
          文
        </button>
      )}

      {clueJapanese && clueOpen && (
        <div className="gp-fs-clue-overlay">
          <div className="gp-fs-clue-card">
            <button
              type="button"
              className="gp-fs-clue-close"
              onClick={() => setClueOpen(false)}
              aria-label="Close clue"
            >
              ✕
            </button>
            <p className="gp-fs-clue-eyebrow">Clue restored</p>
            <p className="gp-fs-clue-japanese">{clueJapanese}</p>
          </div>
        </div>
      )}
    </IframePuzzleStage>
  );
}

export default ForgottenSpiritStage;
