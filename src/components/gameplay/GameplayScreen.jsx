import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import tableImage from "../../assets/gameplay/table.jpeg";
import MapButton from "./MapButton";
import Compass from "./Compass";
import MapOverlay from "./MapOverlay";
import ToolsPanel from "./ToolsPanel";
import InventoryPanel from "./InventoryPanel";
import GameplayArea from "./GameplayArea";
import HuntTimer from "./HuntTimer";
import HuntExpiredScreen from "./HuntExpiredScreen";
import RiddleViewer from "./RiddleViewer";
import WhispersViewer from "./WhispersViewer";
import KintsugiClueViewer from "./KintsugiClueViewer";
import ClueRevealOverlay from "./ClueRevealOverlay";
import ClueLogViewer from "./ClueLogViewer";
import TranslationPanel from "./TranslationPanel";
import { useQuestProgression } from "../../hooks/useQuestProgression";
import { useHuntTimer } from "../../hooks/useHuntTimer";
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

  // The ONE true completion marker (see questSteps.js / GameplayArea's
  // onFinalTreasureComplete below): set only when the player actually
  // solves the final-treasure.html iframe's own win condition, never by
  // merely reaching that stage. Reaching Kintsugi Shrine, Sakimori
  // Overlook, or even the final-treasure stage itself is NOT completion.
  const questCompleted = quest.completedPuzzles.includes("final-treasure");

  // Fired by useHuntTimer itself, exactly once, the instant the backend
  // authoritatively reports the hunt EXPIRED (never from a local countdown
  // reaching zero — see useHuntTimer.js). Closes every open overlay/tool
  // the same way Escape already does above, then branches on
  // questCompleted:
  //   - completed: forces the SAME final-treasure stage the map's last
  //     location normally leads to (quest.enterPuzzle, the existing
  //     stage-switch function — no second/parallel ending page); harmless
  //     no-op if already there.
  //   - not completed: leaves the current stage alone — HuntExpiredScreen
  //     (rendered below, gated on huntExpired && !questCompleted) covers
  //     the whole screen regardless of what's mounted underneath.
  // Also covers "already expired on mount": a refresh (or the dev-unlock
  // path) after the hunt has ended fires this the same way, on that first
  // poll, using whatever completedPuzzles sessionStorage restored.
  const huntTimer = useHuntTimer({
    onExpire: () => {
      setMapOpen(false);
      setRiddleOpen(false);
      setWhispersOpen(false);
      setTranslationOpen(false);
      setClueLogOpen(false);
      setKintsugiClueOpen(false);
      setMagnifierActive(false);
      dismissReveal();
      if (quest.completedPuzzles.includes("final-treasure")) {
        quest.enterPuzzle("final-treasure");
      }
    },
  });
  const huntExpired = huntTimer.isExpired;
  const huntFailed = huntExpired && !questCompleted;

  const handleLocationClick = (locationId) => {
    if (huntExpired) return;
    if (quest.enterLocation(locationId)) {
      setMapOpen(false);
    }
  };

  // Magnifying glass and Translator share the same "one active tool"
  // convention: selecting either one turns the other off, rather than
  // building a separate tool-selection system.
  const handleToggleMagnifier = () => {
    if (huntExpired) return;
    setMagnifierActive((active) => !active);
    setTranslationOpen(false);
  };

  const handleOpenTranslation = () => {
    if (huntExpired) return;
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
        onOpenRiddle={() => !huntExpired && setRiddleOpen(true)}
        onOpenWhispers={() => !huntExpired && setWhispersOpen(true)}
        onOpenClues={() => !huntExpired && setClueLogOpen(true)}
        onOpenKintsugiClue={() => !huntExpired && setKintsugiClueOpen(true)}
      />

      <MapButton isOpen={mapOpen} onToggle={() => !huntExpired && setMapOpen((open) => !open)} />
      <Compass />
      <HuntTimer status={huntTimer.status} displayMsRemaining={huntTimer.displayMsRemaining} />

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

      {huntFailed && <HuntExpiredScreen />}
    </div>
  );
}

export default GameplayScreen;
