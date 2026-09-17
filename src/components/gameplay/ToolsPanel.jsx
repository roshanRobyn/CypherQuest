import { useState } from "react";

function ToolsPanel({ translationUnlocked, translationJustUnlocked, onOpenTranslation }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`gp-tools ${open ? "gp-tools-open" : "gp-tools-closed"}`}>
      <button
        type="button"
        className="gp-tools-tab"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Collapse tools" : "Expand tools"}
      >
        ⚒
      </button>

      <div className="gp-tools-body">
        <p className="gp-tools-title">TOOLS</p>
        <div className="gp-tools-slots">
          <span className="gp-slot" />
          <span className="gp-slot" />
          <span className="gp-slot" />
          {translationUnlocked ? (
            <button
              type="button"
              className={`gp-slot gp-slot-button ${translationJustUnlocked ? "gp-slot-unlocked" : ""}`}
              aria-label="Translation tool"
              title="Translation tool"
              onClick={onOpenTranslation}
            >
              訳
            </button>
          ) : (
            <span className="gp-slot" />
          )}
        </div>
      </div>
    </div>
  );
}

export default ToolsPanel;
