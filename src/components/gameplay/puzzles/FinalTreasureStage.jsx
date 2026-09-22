import IframePuzzleStage from "./IframePuzzleStage";

function FinalTreasureStage({ onComplete }) {
  return (
    <IframePuzzleStage
      puzzleId="final-treasure"
      label="THE FINAL TREASURE"
      title="The Final Treasure"
      src="/puzzles/final-treasure.html"
      onComplete={onComplete}
    />
  );
}

export default FinalTreasureStage;
