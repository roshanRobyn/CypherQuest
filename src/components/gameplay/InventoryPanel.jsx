const TOTAL_SLOTS = 6;

// Visual/behavioral definition for each inventory item id. Purely a lookup
// table — which ids are actually unlocked, and in what order, comes from
// `unlockedItems` (see useQuestProgression.js), not from anything here.
const ITEM_DEFS = {
  clues: { icon: "文", label: "View discovered clues", title: "Discovered clues" },
  riddle: { icon: "謎", label: "View recovered riddle", title: "Recovered riddle" },
  whispers: { icon: "霊", label: "View Whispers of the Spirit", title: "Whispers of the Spirit" },
};

// Items fill slots left-to-right in the order they were unlocked
// (`unlockedItems` is append-only, so its order already IS discovery
// order). Nothing is reserved for a specific item type, and an earlier
// item never moves once placed — a newly discovered item simply becomes
// the next entry in the list, landing in the next slot after it.
function InventoryPanel({ unlockedItems, justUnlockedItem, onOpenRiddle, onOpenWhispers, onOpenClues }) {
  const handlers = { riddle: onOpenRiddle, whispers: onOpenWhispers, clues: onOpenClues };
  const emptySlotCount = Math.max(0, TOTAL_SLOTS - unlockedItems.length);

  return (
    <div className="gp-inventory gp-inventory-open">
      <div className="gp-inventory-drawer">
        <div className="gp-inventory-body">
          {unlockedItems.map((id) => {
            const def = ITEM_DEFS[id];
            if (!def) return null;
            return (
              <button
                key={id}
                type="button"
                className={`gp-slot gp-slot-button ${justUnlockedItem === id ? "gp-slot-unlocked" : ""}`}
                onClick={handlers[id]}
                aria-label={def.label}
                title={def.title}
              >
                {def.icon}
              </button>
            );
          })}

          {Array.from({ length: emptySlotCount }, (_, index) => (
            <span className="gp-slot" key={`empty-${index}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default InventoryPanel;
