function InventoryPanel({
  riddleUnlocked,
  riddleJustUnlocked,
  onOpenRiddle,
  whispersUnlocked,
  whispersJustUnlocked,
  onOpenWhispers,
  cluesUnlocked,
  onOpenClues,
}) {
  return (
    <div className="gp-inventory gp-inventory-open">
      <div className="gp-inventory-drawer">
        <div className="gp-inventory-body">
          {riddleUnlocked ? (
            <button
              type="button"
              className={`gp-slot gp-slot-button ${riddleJustUnlocked ? "gp-slot-unlocked" : ""}`}
              onClick={onOpenRiddle}
              aria-label="View recovered riddle"
              title="Recovered riddle"
            >
              謎
            </button>
          ) : (
            <span className="gp-slot" />
          )}

          {whispersUnlocked ? (
            <button
              type="button"
              className={`gp-slot gp-slot-button ${whispersJustUnlocked ? "gp-slot-unlocked" : ""}`}
              onClick={onOpenWhispers}
              aria-label="View Whispers of the Spirit"
              title="Whispers of the Spirit"
            >
              霊
            </button>
          ) : (
            <span className="gp-slot" />
          )}

          {cluesUnlocked ? (
            <button
              type="button"
              className="gp-slot gp-slot-button"
              onClick={onOpenClues}
              aria-label="View discovered clues"
              title="Discovered clues"
            >
              文
            </button>
          ) : (
            <span className="gp-slot" />
          )}

          <span className="gp-slot" />
          <span className="gp-slot" />
          <span className="gp-slot" />
        </div>
      </div>
    </div>
  );
}

export default InventoryPanel;
