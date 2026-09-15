import { useState } from "react";

function ToolsPanel() {
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
          <span className="gp-slot" />
        </div>
      </div>
    </div>
  );
}

export default ToolsPanel;
