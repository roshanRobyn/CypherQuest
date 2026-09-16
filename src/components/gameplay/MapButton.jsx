import mapIcon from "../../assets/gameplay/mapIcon.png";

function MapButton({ isOpen, onToggle }) {
  return (
    <button
      type="button"
      className={`gp-map-button ${isOpen ? "gp-map-button-active" : ""}`}
      onClick={onToggle}
      aria-label={isOpen ? "Close map" : "Open map"}
    >
      <img src={mapIcon} alt="Map scroll" />
    </button>
  );
}

export default MapButton;
