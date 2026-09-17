import IframePuzzleStage from "./IframePuzzleStage";

function LanternSwitchStage({ onComplete }) {
  return (
    <IframePuzzleStage
      puzzleId="lantern-switch"
      label="LANTERN TRIAL"
      title="Lantern Switch"
      src="/puzzles/lantern-switch.html"
      onComplete={onComplete}
    />
  );
}

export default LanternSwitchStage;
