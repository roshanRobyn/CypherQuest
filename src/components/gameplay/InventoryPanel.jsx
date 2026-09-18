import riddleImage from "../../assets/riddle.png";

function InventoryPanel({
  riddleUnlocked,
  riddleJustUnlocked,
  onOpenRiddle,
  whispersUnlocked,
  whispersJustUnlocked,
  onOpenWhispers,
}) {
  return (
    <div className="gp-inventory gp-inventory-open">
      <div className="gp-inventory-drawer">
        <div className="gp-inventory-body">
          {riddleUnlocked ? (
            <button
              type="button"
              className={`gp-slot gp-slot-item ${riddleJustUnlocked ? "gp-slot-unlocked" : ""}`}
              onClick={onOpenRiddle}
              aria-label="View recovered riddle"
              title="Recovered riddle"
            >
              <img src={riddleImage} alt="" />
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
