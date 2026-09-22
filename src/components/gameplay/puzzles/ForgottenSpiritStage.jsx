import IframePuzzleStage from "./IframePuzzleStage";

function ForgottenSpiritStage({ onComplete }) {
  return (
    <IframePuzzleStage
      puzzleId="forgotten-spirit"
      label="THE SACRED TRIAL"
      title="The Forgotten Spirit"
      src="/puzzles/forgotten-spirit.html"
      onComplete={onComplete}
    />
  );
}

export default ForgottenSpiritStage;
