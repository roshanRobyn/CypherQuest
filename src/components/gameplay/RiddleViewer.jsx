import riddleImage from "../../assets/riddle.png";

function RiddleViewer({ isOpen, onClose }) {
  return (
    <div
      className={`gp-riddle-overlay ${isOpen ? "gp-riddle-overlay-open" : ""}`}
      aria-hidden={!isOpen}
    >
      <div className="gp-riddle-scrim" onClick={onClose} />

      <div className="gp-riddle-stage">
        <button
          type="button"
          className="gp-riddle-close"
          onClick={onClose}
          aria-label="Close riddle"
        >
          ✕
        </button>

        <img
          className="gp-riddle-img"
          src={riddleImage}
          alt="Recovered riddle clue"
        />
      </div>
    </div>
  );
}

export default RiddleViewer;
