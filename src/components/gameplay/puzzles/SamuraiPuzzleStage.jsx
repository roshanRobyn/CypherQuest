import IframePuzzleStage from "./IframePuzzleStage";

function SamuraiPuzzleStage({ onComplete }) {
  return (
    <IframePuzzleStage
      puzzleId="samurai-puzzle"
      label="THE FIVE BLADES"
      title="The Five Blades"
      src="/puzzles/samurai-puzzle.html"
      onComplete={onComplete}
    />
  );
}

export default SamuraiPuzzleStage;
