// Persistent "discovered clues" log — reopenable from the inventory at any
// time. Dismissing the one-time "Clue Restored" popup (ClueRevealOverlay)
// never deletes a clue; every completed puzzle's Japanese clue lives here
// for the rest of the session. Same parchment visual language as the
// Jigsaw's own internal reveal and ClueRevealOverlay — Japanese only, the
// English meaning is never shown here (that's the Translator's job alone).
function ClueLogViewer({ isOpen, onClose, clues }) {
  return (
    <div
      className={`gp-riddle-overlay ${isOpen ? "gp-riddle-overlay-open" : ""}`}
      aria-hidden={!isOpen}
    >
      <div className="gp-riddle-scrim" onClick={onClose} />

      <div className="gp-cluelog-stage">
        <button
          type="button"
          className="gp-riddle-close"
          onClick={onClose}
          aria-label="Close discovered clues"
        >
          ✕
        </button>

        <div className="gp-cluelog-frame">
          <p className="gp-cluelog-title">Discovered clues</p>

          <div className="gp-cluelog-list">
            {clues.map((clue, index) => (
              <div
                className="gp-cluelog-card"
                key={clue.id}
                style={{ "--tilt": index % 2 === 0 ? "-0.6deg" : "0.5deg" }}
              >
                <p className="gp-cluelog-eyebrow">Clue restored</p>
                <p className="gp-cluelog-japanese">{clue.japanese}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClueLogViewer;
