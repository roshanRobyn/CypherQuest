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
        <div className="gp-map-frame">
          {isOpen && (
            <iframe
              src="/Maps/izuhara_reference.html"
              title="Izuhara Map"
              className="gp-map-iframe"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default MapOverlay;
