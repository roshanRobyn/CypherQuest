// Reusable "Clue Restored" completion presentation — the same visual
// design the Jigsaw puzzle's own internal reveal uses (eyebrow / heading /
// Japanese clue / explanatory text), reused for every later puzzle's
// completion. Only the japanese/english pair changes per puzzle; this
// component and its markup never change to accommodate a new result.
function ClueRevealOverlay({ isOpen, japanese, english, onClose }) {
  return (
    <div
      className={`gp-riddle-overlay ${isOpen ? "gp-riddle-overlay-open" : ""}`}
      aria-hidden={!isOpen}
    >
      <div className="gp-riddle-scrim" onClick={onClose} />

      <div className="gp-reveal-stage">
        <button
          type="button"
          className="gp-riddle-close"
          onClick={onClose}
          aria-label="Close clue"
        >
          ✕
        </button>

        <div className="gp-reveal-card">
          <p className="gp-reveal-eyebrow">Clue restored</p>
          <h2 className="gp-reveal-heading">A new marking emerges</h2>
          <p className="gp-reveal-japanese">{japanese}</p>
          <p className="gp-reveal-english">{english}</p>
          <p className="gp-reveal-note">Seek this place upon the map.</p>
        </div>
      </div>
    </div>
  );
}

export default ClueRevealOverlay;
