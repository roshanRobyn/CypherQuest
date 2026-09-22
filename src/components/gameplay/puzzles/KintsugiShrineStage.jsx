import IframePuzzleStage from "./IframePuzzleStage";

function KintsugiShrineStage({ onComplete }) {
  return (
    <IframePuzzleStage
      puzzleId="kintsugi-shrine"
      label="THE KINTSUGI SHRINE"
      title="The Kintsugi Shrine"
      src="/puzzles/kintsugi-shrine.html"
      onComplete={onComplete}
    />
  );
}

export default KintsugiShrineStage;
