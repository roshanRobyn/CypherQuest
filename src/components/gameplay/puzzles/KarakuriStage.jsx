import { useEffect } from "react";

function KarakuriStage({ onComplete }) {
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === "cq:karakuri-complete") {
        onComplete?.();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onComplete]);

  return (
    <>
      <p className="gp-puzzle-label">KARAKURI SEQUENCE</p>
      <div className="gp-puzzle-frame">
        <iframe
          src="/puzzles/karakuri-sequence.html"
          title="Karakuri Sequence"
          className="gp-puzzle-iframe"
        />
      </div>
    </>
  );
}

export default KarakuriStage;
