import ShreddedCluePuzzle from "./puzzles/ShreddedCluePuzzle";
import KarakuriStage from "./puzzles/KarakuriStage";
import ForgottenSpiritStage from "./puzzles/ForgottenSpiritStage";
import LanternSwitchStage from "./puzzles/LanternSwitchStage";
import SamuraiPuzzleStage from "./puzzles/SamuraiPuzzleStage";
import ThreeHiddenDifferencesStage from "./puzzles/ThreeHiddenDifferencesStage";
import KintsugiShrineStage from "./puzzles/KintsugiShrineStage";

function GameplayArea({
  stage,
  onFirstPuzzleComplete,
  onKarakuriComplete,
  onForgottenSpiritComplete,
  onLanternSwitchComplete,
  onSamuraiPuzzleComplete,
  onThreeHiddenDifferencesComplete,
  onKintsugiShrineComplete,
}) {
  return (
    <div className="gp-central">
      <div className="gp-central-frame">
        <div className="gp-central-inner gp-central-inner-puzzle">
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
            <ForgottenSpiritStage onComplete={onForgottenSpiritComplete} />
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
        </div>
      </div>
    </div>
  );
}

export default GameplayArea;
