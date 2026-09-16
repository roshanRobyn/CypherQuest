function GameplayArea({ teamName }) {
  return (
    <div className="gp-central">
      <div className="gp-central-frame">
        <div className="gp-central-inner">
          <span className="gp-central-corner gp-corner-tl" />
          <span className="gp-central-corner gp-corner-tr" />
          <span className="gp-central-corner gp-corner-bl" />
          <span className="gp-central-corner gp-corner-br" />

          <p className="gp-central-label">TEAM · {teamName || "UNKNOWN"}</p>
          <div className="gp-central-glyph">暗</div>
        </div>
      </div>
    </div>
  );
}

export default GameplayArea;
