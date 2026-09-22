import { useEffect, useRef } from "react";

function ShreddedCluePuzzle({ onComplete }) {
  const iframeRef = useRef(null);
  const completedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (completedRef.current) return;

      const iframe = iframeRef.current;
      if (!iframe) return;

      try {
        const doc = iframe.contentDocument;
        const complete = doc && doc.getElementById("complete");

        if (complete && complete.classList.contains("show")) {
          completedRef.current = true;
          onComplete();
        }
      } catch (err) {
        // Same-origin iframe expected; ignore transient access errors during load.
      }
    }, 500);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <>
      <p className="gp-puzzle-label">THE SHREDDED CLUE</p>
      <div className="gp-puzzle-frame">
        <iframe
          ref={iframeRef}
          src="/puzzles/shredded-clue.html"
          title="The Shredded Clue"
          className="gp-puzzle-iframe"
        />
      </div>
    </>
  );
}

export default ShreddedCluePuzzle;
