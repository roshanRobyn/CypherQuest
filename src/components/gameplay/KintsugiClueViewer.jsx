import kintsugiClueImage from "../../kinshugi shrine clue.png";

function KintsugiClueViewer({ isOpen, onClose }) {
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
          aria-label="Close Kintsugi Shrine clue"
        >
          ✕
        </button>

        <img
          className="gp-riddle-img"
          src={kintsugiClueImage}
          alt="Kintsugi Shrine clue"
        />
      </div>
    </div>
  );
}

export default KintsugiClueViewer;
