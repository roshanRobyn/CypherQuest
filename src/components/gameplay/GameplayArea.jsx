import { useRef } from "react";
import ShreddedCluePuzzle from "./puzzles/ShreddedCluePuzzle";
import KarakuriStage from "./puzzles/KarakuriStage";
import ForgottenSpiritStage from "./puzzles/ForgottenSpiritStage";
import LanternSwitchStage from "./puzzles/LanternSwitchStage";
import SamuraiPuzzleStage from "./puzzles/SamuraiPuzzleStage";
import ThreeHiddenDifferencesStage from "./puzzles/ThreeHiddenDifferencesStage";
import KintsugiShrineStage from "./puzzles/KintsugiShrineStage";
import MagnifierLens from "./MagnifierLens";

function GameplayArea({
  stage,
  magnifierActive,
  onFirstPuzzleComplete,
  onKarakuriComplete,
  onForgottenSpiritComplete,
  forgottenSpiritClue,
  onLanternSwitchComplete,
  onSamuraiPuzzleComplete,
  onThreeHiddenDifferencesComplete,
  onKintsugiShrineComplete,
}) {
  const containerRef = useRef(null);

  return (
    <div className="gp-central">
      <div className="gp-central-frame">
        <div ref={containerRef} className="gp-central-inner gp-central-inner-puzzle">
          <span className="gp-central-corner gp-corner-tl" />
          <span className="gp-central-corner gp-corner-tr" />
          <span className="gp-central-corner gp-corner-bl" />
          <span className="gp-central-corner gp-corner-br" />

          {stage === "shredded-clue" && (
            <ShreddedCluePuzzle onComplete={onFirstPuzzleComplete} />
          )}

          {stage === "karakuri" && (
            <KarakuriStage onComplete={onKarakuriComplete} />
          )}

          {stage === "forgotten-spirit" && (
            <ForgottenSpiritStage onComplete={onForgottenSpiritComplete} clueJapanese={forgottenSpiritClue} />
          )}

          {stage === "lantern-switch" && (
            <LanternSwitchStage onComplete={onLanternSwitchComplete} />
          )}

          {stage === "samurai-puzzle" && (
            <SamuraiPuzzleStage onComplete={onSamuraiPuzzleComplete} />
          )}

          {stage === "three-hidden-differences" && (
            <ThreeHiddenDifferencesStage onComplete={onThreeHiddenDifferencesComplete} />
          )}

          {stage === "kintsugi-shrine" && (
            <KintsugiShrineStage onComplete={onKintsugiShrineComplete} />
          )}

          <MagnifierLens active={magnifierActive} containerRef={containerRef} />
        </div>
      </div>
    </div>
  );
}

export default GameplayArea;
