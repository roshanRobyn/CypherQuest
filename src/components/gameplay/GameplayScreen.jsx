import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import tableImage from "../../assets/gameplay/table.jpeg";
import MapButton from "./MapButton";
import Compass from "./Compass";
import MapOverlay from "./MapOverlay";
import ToolsPanel from "./ToolsPanel";
import InventoryPanel from "./InventoryPanel";
import GameplayArea from "./GameplayArea";
import RiddleViewer from "./RiddleViewer";
import WhispersViewer from "./WhispersViewer";
import KintsugiClueViewer from "./KintsugiClueViewer";
import ClueRevealOverlay from "./ClueRevealOverlay";
import ClueLogViewer from "./ClueLogViewer";
import TranslationPanel from "./TranslationPanel";
import { useQuestProgression } from "../../hooks/useQuestProgression";
import "./GameplayScreen.css";

function GameplayScreen({ teamName }) {
  const quest = useQuestProgression(teamName);
  const { dismissReveal } = quest;
  const [mapOpen, setMapOpen] = useState(false);
  const [riddleOpen, setRiddleOpen] = useState(false);
  const [whispersOpen, setWhispersOpen] = useState(false);
  const [translationOpen, setTranslationOpen] = useState(false);
  const [clueLogOpen, setClueLogOpen] = useState(false);
  const [kintsugiClueOpen, setKintsugiClueOpen] = useState(false);
  const [magnifierActive, setMagnifierActive] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMapOpen(false);
        setRiddleOpen(false);
        setWhispersOpen(false);
        setTranslationOpen(false);
        setClueLogOpen(false);
        setKintsugiClueOpen(false);
        setMagnifierActive(false);
        dismissReveal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dismissReveal]);

  // Gameplay is always open: no hunt timer and no expiry screen.
  const handleLocationClick = (locationId) => {
    if (quest.enterLocation(locationId)) {
      setMapOpen(false);
    }
  };

  // Magnifying glass and Translator share the same "one active tool"
  // convention: selecting either one turns the other off, rather than
  // building a separate tool-selection system.
  const handleToggleMagnifier = () => {
    setMagnifierActive((active) => !active);
    setTranslationOpen(false);
  };

  const handleOpenTranslation = () => {
    setMagnifierActive(false);
    setTranslationOpen(true);
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
        onOpenTranslation={handleOpenTranslation}
        magnifierActive={magnifierActive}
        onToggleMagnifier={handleToggleMagnifier}
      />

      <GameplayArea
        stage={quest.currentStage}
        magnifierActive={magnifierActive}
        onFirstPuzzleComplete={() => quest.completePuzzle("jigsaw")}
        onKarakuriComplete={() => quest.completePuzzle("karakuri")}
        onForgottenSpiritComplete={() => quest.completePuzzle("forgotten-spirit")}
        onLanternSwitchComplete={() => quest.completePuzzle("lantern-switch")}
        onSamuraiPuzzleComplete={() => quest.completePuzzle("samurai-puzzle")}
        onThreeHiddenDifferencesComplete={() => quest.completePuzzle("three-hidden-differences")}
        onKintsugiShrineComplete={() => quest.completePuzzle("kintsugi-shrine")}
        onFinalTreasureComplete={() => quest.completePuzzle("final-treasure")}
      />

      <InventoryPanel
        unlockedItems={quest.unlockedItems}
        justUnlockedItem={quest.justUnlockedItem}
        onOpenRiddle={() => setRiddleOpen(true)}
        onOpenWhispers={() => setWhispersOpen(true)}
        onOpenClues={() => setClueLogOpen(true)}
        onOpenKintsugiClue={() => setKintsugiClueOpen(true)}
      />

      <MapButton isOpen={mapOpen} onToggle={() => setMapOpen((open) => !open)} />
      <Compass />

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

      <WhispersViewer isOpen={whispersOpen} onClose={() => setWhispersOpen(false)} />

      <KintsugiClueViewer isOpen={kintsugiClueOpen} onClose={() => setKintsugiClueOpen(false)} />

      <ClueLogViewer
        isOpen={clueLogOpen}
        onClose={() => setClueLogOpen(false)}
        clues={quest.discoveredClues}
      />

      <ClueRevealOverlay
        isOpen={!!quest.reveal}
        japanese={quest.reveal?.japanese}
        onClose={quest.dismissReveal}
      />

      <TranslationPanel
        isOpen={translationOpen}
        onClose={() => setTranslationOpen(false)}
        onTranslated={quest.handleTranslation}
      />

    </div>
  );
}

export default GameplayScreen;
