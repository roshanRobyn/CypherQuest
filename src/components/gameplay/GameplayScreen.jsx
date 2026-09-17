import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import tableImage from "../../assets/gameplay/table.jpeg";
import MapButton from "./MapButton";
import MapOverlay from "./MapOverlay";
import ToolsPanel from "./ToolsPanel";
import InventoryPanel from "./InventoryPanel";
import GameplayArea from "./GameplayArea";
import RiddleViewer from "./RiddleViewer";
import TranslationPanel from "./TranslationPanel";
import { useQuestProgression } from "../../hooks/useQuestProgression";
import "./GameplayScreen.css";

function GameplayScreen() {
  const quest = useQuestProgression();
  const [mapOpen, setMapOpen] = useState(false);
  const [riddleOpen, setRiddleOpen] = useState(false);
  const [translationOpen, setTranslationOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMapOpen(false);
        setRiddleOpen(false);
        setTranslationOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLocationClick = (locationId) => {
    if (quest.enterLocation(locationId)) {
      setMapOpen(false);
    }
  };

  return (
    <div
      className="gp-tabletop"
      style={{ backgroundImage: `url(${tableImage})` }}
    >
      <div className="gp-vignette" />

      <ToolsPanel
        translationUnlocked={quest.availableTools.includes("translator")}
        translationJustUnlocked={quest.justUnlockedTool === "translator"}
        onOpenTranslation={() => setTranslationOpen(true)}
      />

      <GameplayArea
        stage={quest.currentStage}
        onFirstPuzzleComplete={() => quest.completePuzzle("jigsaw")}
        onKarakuriComplete={() => quest.completePuzzle("karakuri")}
        onForgottenSpiritComplete={() => quest.completePuzzle("forgotten-spirit")}
        onLanternSwitchComplete={() => quest.completePuzzle("lantern-switch")}
      />

      <InventoryPanel
        riddleUnlocked={quest.unlockedItems.includes("riddle")}
        riddleJustUnlocked={quest.justUnlockedItem === "riddle"}
        onOpenRiddle={() => setRiddleOpen(true)}
      />

      <MapButton isOpen={mapOpen} onToggle={() => setMapOpen((open) => !open)} />

      {/*
        The map has its own independent internal zoom (Leaflet). It is
        portaled straight to <body>, outside the app's zoom-locked root, so
        the app-wide browser-zoom counter-scale never touches it.
      */}
      {createPortal(
        <MapOverlay
          isOpen={mapOpen}
          onClose={() => setMapOpen(false)}
          unlockedLocationIds={quest.unlockedLocations}
          onLocationClick={handleLocationClick}
        />,
        document.body
      )}

      <RiddleViewer isOpen={riddleOpen} onClose={() => setRiddleOpen(false)} />

      <TranslationPanel
        isOpen={translationOpen}
        onClose={() => setTranslationOpen(false)}
        onTranslated={quest.handleTranslation}
      />
    </div>
  );
}

export default GameplayScreen;
