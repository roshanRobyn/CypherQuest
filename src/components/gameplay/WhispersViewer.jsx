import { WHISPERS_CLUES } from "../../data/whispersClues";

function WhispersViewer({ isOpen, onClose }) {
  return (
    <div
      className={`gp-riddle-overlay ${isOpen ? "gp-riddle-overlay-open" : ""}`}
      aria-hidden={!isOpen}
    >
      <div className="gp-riddle-scrim" onClick={onClose} />

      <div className="gp-whispers-stage">
        <button
          type="button"
          className="gp-riddle-close"
          onClick={onClose}
          aria-label="Close whispers of the spirit"
        >
          ✕
        </button>

        <div className="gp-whispers-card">
          <p className="gp-whispers-heading">Whispers of the Spirit</p>

          <div className="gp-whispers-list">
            {WHISPERS_CLUES.map((clue) => (
              <div className="gp-whispers-clue" key={clue.numeral}>
                <span className="gp-whispers-number">{clue.numeral}</span>
                <span>{clue.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhispersViewer;
