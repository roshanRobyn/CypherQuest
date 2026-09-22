// Purely decorative/reference HUD element, sitting directly beneath the
// Map button. No orientation/heading state exists anywhere in the current
// progression system (useQuestProgression, questSteps) to drive it, so it
// renders as a static antique compass for now — kept as its own small
// component (rather than inline JSX in GameplayScreen) so a future
// `heading` prop could rotate the needle without touching anything else.
function Compass() {
  return (
    <div className="gp-compass" aria-hidden="true">
      <div className="gp-compass-face">
        <span className="gp-compass-letter gp-compass-n">N</span>
        <span className="gp-compass-letter gp-compass-e">E</span>
        <span className="gp-compass-letter gp-compass-s">S</span>
        <span className="gp-compass-letter gp-compass-w">W</span>

        <span className="gp-compass-tick gp-compass-tick-ne" />
        <span className="gp-compass-tick gp-compass-tick-se" />
        <span className="gp-compass-tick gp-compass-tick-sw" />
        <span className="gp-compass-tick gp-compass-tick-nw" />

        <span className="gp-compass-needle">
          <span className="gp-compass-needle-north" />
          <span className="gp-compass-needle-south" />
        </span>
        <span className="gp-compass-pivot" />
      </div>
    </div>
  );
}

export default Compass;
