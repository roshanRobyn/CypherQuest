import { useEffect, useRef } from "react";
import { useEventGate } from "../hooks/useEventGate";
import "./WaitingGate.css";

const EVENT_DATE_LABEL = "24 SEPTEMBER 2026";
const EVENT_TIME_LABEL = "1:30 PM IST";

const pad = (n) => String(n).padStart(2, "0");

function splitDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

// Renders the pre-game "sealed shrine" chamber — the only player-facing
// state between team confirmation and the real hunt unlocking. `onUnlocked`
// fires exactly once, the moment the backend itself reports ACTIVE; it is
// never triggered by the countdown reaching zero locally.
function WaitingGate({ teamName, onUnlocked }) {
  const { phase, displayMsRemaining } = useEventGate();
  const firedRef = useRef(false);

  useEffect(() => {
    if (phase === "active" && !firedRef.current) {
      firedRef.current = true;
      onUnlocked();
    }
  }, [phase, onUnlocked]);

  const { days, hours, minutes, seconds } = splitDuration(displayMsRemaining ?? 0);

  return (
    <section className="waiting-gate">
      <div className="background-overlay"></div>

      <div className="mist mist-one"></div>
      <div className="mist mist-two"></div>
      <div className="mist mist-three"></div>

      <div className="fog-ribbon fog-ribbon-one"></div>
      <div className="fog-ribbon fog-ribbon-two"></div>
      <div className="fog-ribbon fog-ribbon-three"></div>

      <div className="shrine-lantern shrine-lantern-left"></div>
      <div className="shrine-lantern shrine-lantern-right"></div>

      <div className="ember-field">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="ember" style={{ animationDelay: `${i * 1.6}s`, left: `${18 + i * 16}%` }}></span>
        ))}
      </div>

      <div className="waiting-panel">
        <div className="waiting-symbol">封</div>

        {phase === "checking" && (
          <p className="waiting-status">Consulting the shrine keeper&hellip;</p>
        )}

        {phase === "unreachable" && (
          <>
            <h2 className="waiting-title waiting-title-warn">THE SHRINE CANNOT BE REACHED</h2>
            <p className="waiting-status">Checking the connection&hellip;</p>
          </>
        )}

        {(phase === "waiting" || phase === "active") && (
          <>
            <h2 className="waiting-title">THE HUNT REMAINS SEALED</h2>

            <p className="waiting-date">{EVENT_DATE_LABEL}</p>
            <p className="waiting-time">{EVENT_TIME_LABEL}</p>

            <div className="waiting-divider">
              <span></span>
              <b>✦</b>
              <span></span>
            </div>

            <p className="waiting-label">HUNT BEGINS IN</p>

            <div className="waiting-countdown">
              <div className="countdown-segment">
                <span>{pad(days)}</span>
                <small>DAYS</small>
              </div>
              <b className="countdown-colon">:</b>
              <div className="countdown-segment">
                <span>{pad(hours)}</span>
                <small>HRS</small>
              </div>
              <b className="countdown-colon">:</b>
              <div className="countdown-segment">
                <span>{pad(minutes)}</span>
                <small>MIN</small>
              </div>
              <b className="countdown-colon">:</b>
              <div className="countdown-segment">
                <span>{pad(seconds)}</span>
                <small>SEC</small>
              </div>
            </div>
          </>
        )}

        {teamName && (
          <p className="waiting-team">
            Team registered: <strong>{teamName}</strong>
          </p>
        )}
      </div>
    </section>
  );
}

export default WaitingGate;
