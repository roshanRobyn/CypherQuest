import { useState } from "react";

function InventoryPanel() {
  const [open, setOpen] = useState(false);

  return (
    <div className={`gp-inventory ${open ? "gp-inventory-open" : "gp-inventory-closed"}`}>
      <button
        type="button"
        className="gp-inventory-tab"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Collapse inventory" : "Expand inventory"}
      >
        <span className="gp-inventory-tab-line" />
        <span className="gp-inventory-tab-label">INVENTORY</span>
        <span className="gp-inventory-tab-line" />
      </button>

      <div className="gp-inventory-drawer">
        <div className="gp-inventory-body">
          <span className="gp-slot" />
          <span className="gp-slot" />
          <span className="gp-slot" />
          <span className="gp-slot" />
          <span className="gp-slot" />
          <span className="gp-slot" />
        </div>
      </div>
    </div>
  );
}

export default InventoryPanel;
