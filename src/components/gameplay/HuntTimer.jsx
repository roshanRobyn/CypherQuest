function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Global HUD piece — lives alongside MapButton/Compass/ToolsPanel/
// InventoryPanel in GameplayScreen, outside the puzzle iframe/central frame.
// Deliberately silent/invisible for "checking"/"pending"/"active"/
// "unreachable"/"expired" — the countdown only ever exists during the final
// 5 minutes (status === "warning"; see useHuntTimer.js, which only ever
// populates displayMsRemaining in that same window). The underlying
// end-time detection keeps polling and firing the final-treasure
// transition regardless of whether anything is on screen here.
function HuntTimer({ status, displayMsRemaining }) {
  if (status !== "warning") return null;

  return (
    <div className="gp-hunt-timer gp-hunt-timer-warning">
      <p className="gp-hunt-timer-label">5 MINUTES REMAINING</p>
      <p className="gp-hunt-timer-value">{formatRemaining(displayMsRemaining ?? 0)} REMAINING</p>
    </div>
  );
}

export default HuntTimer;
