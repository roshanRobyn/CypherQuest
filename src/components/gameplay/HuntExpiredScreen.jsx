import "./HuntExpiredScreen.css";

// Terminal state for a team that had NOT completed the quest (see
// GameplayScreen.jsx: quest.completedPuzzles.includes("final-treasure") is
// the only true completion marker) by the moment the authoritative hunt
// timer expired. Fully static — no buttons, no gameplay controls, nothing
// to interact with; it exists purely to communicate that the hunt is over.
function HuntExpiredScreen() {
  return (
    <div className="gp-hunt-expired">
      <div className="mist mist-one"></div>
      <div className="mist mist-two"></div>
      <div className="mist mist-three"></div>

      <div className="gp-hunt-expired-panel">
        <div className="gp-hunt-expired-symbol">封</div>
        <h1 className="gp-hunt-expired-title">THE HUNT HAS ENDED</h1>
        <p className="gp-hunt-expired-subtitle">TIME HAS EXPIRED</p>

        <div className="gp-hunt-expired-divider">
          <span></span>
          <b>✦</b>
          <span></span>
        </div>

        <p className="gp-hunt-expired-line">The final seal remains unbroken.</p>
        <p className="gp-hunt-expired-thanks">
          Thank you for taking part in
          <br />
          CYPHER QUEST.
        </p>
      </div>
    </div>
  );
}

export default HuntExpiredScreen;
