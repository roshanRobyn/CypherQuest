import { useEffect, useRef } from "react";

function MapOverlay({ isOpen, onClose, unlockedLocationIds, onLocationClick }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === "cq:location-click") {
        onLocationClick(event.data.id);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onLocationClick]);

  const handleIframeLoad = () => {
    const win = iframeRef.current && iframeRef.current.contentWindow;
    if (win && typeof win.CQ_setLocationsUnlocked === "function") {
      win.CQ_setLocationsUnlocked(unlockedLocationIds);
    }
  };

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
              ref={iframeRef}
              src="/Maps/izuhara_reference.html"
              title="Izuhara Map"
              className="gp-map-iframe"
              onLoad={handleIframeLoad}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default MapOverlay;
