import ShreddedCluePuzzle from "./puzzles/ShreddedCluePuzzle";
import KarakuriStage from "./puzzles/KarakuriStage";

function GameplayArea({ stage, onFirstPuzzleComplete, onKarakuriComplete }) {
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
        </div>
      </div>
    </div>
  );
}

export default GameplayArea;
