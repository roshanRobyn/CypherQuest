import IframePuzzleStage from "./IframePuzzleStage";

function ThreeHiddenDifferencesStage({ onComplete }) {
  return (
    <IframePuzzleStage
      puzzleId="three-hidden-differences"
      label="THREE HIDDEN DIFFERENCES"
      title="Three Hidden Differences"
      src="/puzzles/three-hidden-differences.html"
      onComplete={onComplete}
    />
  );
}

export default ThreeHiddenDifferencesStage;
