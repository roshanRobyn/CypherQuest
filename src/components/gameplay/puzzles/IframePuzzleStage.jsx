import { useEffect } from "react";

// Generic host for a standalone puzzle HTML page loaded via iframe. The
// page notifies completion with:
//   window.parent.postMessage({ type: "cq:puzzle-complete", id: "<puzzleId>" }, "*")
// Reused by every iframe-based puzzle stage so wiring a new one up is just
// picking a puzzleId/src, not writing new message-listener plumbing.
function IframePuzzleStage({ puzzleId, label, title, src, onComplete }) {
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === "cq:puzzle-complete" && event.data?.id === puzzleId) {
        onComplete?.();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [puzzleId, onComplete]);

  return (
    <>
      <p className="gp-puzzle-label">{label}</p>
      <div className="gp-puzzle-frame">
        <iframe src={src} title={title} className="gp-puzzle-iframe" />
      </div>
    </>
  );
}

export default IframePuzzleStage;
