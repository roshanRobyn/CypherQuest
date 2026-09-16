import { useEffect, useState } from "react";
import tableImage from "../../assets/gameplay/table.jpeg";
import MapButton from "./MapButton";
import MapOverlay from "./MapOverlay";
import ToolsPanel from "./ToolsPanel";
import InventoryPanel from "./InventoryPanel";
import GameplayArea from "./GameplayArea";
import "./GameplayScreen.css";

function GameplayScreen({ teamName }) {
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMapOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      className="gp-tabletop"
      style={{ backgroundImage: `url(${tableImage})` }}
    >
      <div className="gp-vignette" />

      <ToolsPanel />

      <GameplayArea teamName={teamName} />

      <InventoryPanel />

      <MapButton isOpen={mapOpen} onToggle={() => setMapOpen((open) => !open)} />

      <MapOverlay isOpen={mapOpen} onClose={() => setMapOpen(false)} />
    </div>
  );
}

export default GameplayScreen;
