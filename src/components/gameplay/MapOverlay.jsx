function MapOverlay({ isOpen, onClose }) {
  return (
    <div
      className={`gp-map-overlay ${isOpen ? "gp-map-overlay-open" : ""}`}
      aria-hidden={!isOpen}
    >
      <div className="gp-map-scrim" onClick={onClose} />

      <div className="gp-map-parchment">
        <button
          type="button"
          className="gp-map-close"
          onClick={onClose}
          aria-label="Close map"
        >
          ✕
        </button>

        <p className="gp-map-title">THE MAP</p>
        <div className="gp-map-placeholder">
          <span>No territory charted yet</span>
        </div>
      </div>
    </div>
  );
}

export default MapOverlay;
