import { useEffect, useRef, useState } from "react";
import { useEventGate } from "../hooks/useEventGate";
import SecretLockPopup from "./SecretLockPopup";
import "./WaitingGate.css";

// Fallback labels while the first /api/event/state poll is in flight. Once
// it answers, the labels show the backend's authoritative eventStartTime
// (which an admin may have changed), formatted in IST.
const EVENT_DATE_LABEL = "24 SEPTEMBER 2026";
const EVENT_TIME_LABEL = "1:30 PM IST";

const IST_DATE = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const IST_TIME = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function startLabels(eventStartTime) {
  const date = eventStartTime ? new Date(eventStartTime) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return { dateLabel: EVENT_DATE_LABEL, timeLabel: EVENT_TIME_LABEL };
  }
  return {
    dateLabel: IST_DATE.format(date).toUpperCase(),
    timeLabel: `${IST_TIME.format(date)} IST`,
  };
}

const pad = (n) => String(n).padStart(2, "0");

// Hidden Easter egg — purely cosmetic, never touches the event gate. The
// same single T (start of "THE") and single D (end of "SEALED") must be
// clicked, in this exact order, alongside the 封 symbol. Any wrong target
// resets the in-progress attempt to empty; nothing about this is persisted
// or reported anywhere.
const SECRET_SEQUENCE = ["T", "D", "T", "D", "D", "T", "封"];
const SECRET_CODE = "1367245";
const FLICKER_MS = 260;

// Correct code shows the success view (below), then calls the SAME
// `onUnlocked` App.jsx already calls when the real backend event gate
// reports ACTIVE. It never touches the backend and never sets a fake server
// time. Short delay since it hands off to the existing unsealing/blackout/
// game transition.
const DEV_UNLOCK_DELAY_MS = 1100;

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
  const { phase, displayMsRemaining, eventStartTime } = useEventGate();
  const { dateLabel, timeLabel } = startLabels(eventStartTime);
  const firedRef = useRef(false);

  useEffect(() => {
    if (phase === "active" && !firedRef.current) {
      firedRef.current = true;
      onUnlocked();
    }
  }, [phase, onUnlocked]);

  const { days, hours, minutes, seconds } = splitDuration(displayMsRemaining ?? 0);

  // --- Hidden Easter egg state (additive, independent of the event gate) ---
  // Only the setter is used — progress itself only ever needs to be read
  // inside its own functional update below.
  const [, setSecretProgress] = useState([]);
  const [flicker, setFlicker] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);
  // Bumped on every completed sequence so <SecretLockPopup key={lockInstance}>
  // remounts fresh each time — the popup then owns its own blank input
  // state internally instead of an effect resetting it.
  const [lockInstance, setLockInstance] = useState(0);
  const [lockResult, setLockResult] = useState("idle"); // idle | wrong | success
  const flickerTimeoutRef = useRef(null);
  const wrongTimeoutRef = useRef(null);
  const successTimeoutRef = useRef(null);

  useEffect(
    () => () => {
      clearTimeout(flickerTimeoutRef.current);
      clearTimeout(wrongTimeoutRef.current);
      clearTimeout(successTimeoutRef.current);
    },
    []
  );

  const handleSecretClick = (symbol) => {
    if (lockOpen) return; // popup already open — ignore background clicks

    setSecretProgress((prev) => {
      const next = [...prev, symbol];
      const isCorrectStep = SECRET_SEQUENCE[next.length - 1] === symbol;

      if (!isCorrectStep) {
        setFlicker(true);
        clearTimeout(flickerTimeoutRef.current);
        flickerTimeoutRef.current = setTimeout(() => setFlicker(false), FLICKER_MS);
        return [];
      }

      if (next.length === SECRET_SEQUENCE.length) {
        setLockOpen(true);
        setLockInstance((n) => n + 1);
        return [];
      }

      return next;
    });
  };

  const handleCodeSubmit = (code) => {
    if (code === SECRET_CODE) {
      setLockResult("success");
      clearTimeout(successTimeoutRef.current);

      // Correct code unlocks gameplay in every build (dev AND production).
      // Previously gated on `import.meta.env.DEV`, which Vite replaces with
      // `false` at build time, so the production bundle silently dropped
      // this onUnlocked() call. Reuses the exact same client-side
      // transition the real event-ACTIVE path uses (see the `phase ===
      // "active"` effect above).
      successTimeoutRef.current = setTimeout(() => {
        setLockOpen(false);
        setLockResult("idle");
        onUnlocked();
      }, DEV_UNLOCK_DELAY_MS);
    } else {
      setLockResult("wrong");
      clearTimeout(wrongTimeoutRef.current);
      wrongTimeoutRef.current = setTimeout(() => setLockResult("idle"), 500);
    }
  };

  const handleLockClose = () => {
    clearTimeout(successTimeoutRef.current);
    clearTimeout(wrongTimeoutRef.current);
    setLockOpen(false);
    setLockResult("idle");
  };

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

      <div className={`waiting-panel${flicker ? " waiting-panel-flicker" : ""}`}>
        <div className="waiting-symbol" onClick={() => handleSecretClick("封")}>
          封
        </div>

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
            <h2 className="waiting-title">
              <span className="secret-glyph" onClick={() => handleSecretClick("T")}>
                T
              </span>
              HE HUNT REMAINS SEALE
              <span className="secret-glyph" onClick={() => handleSecretClick("D")}>
                D
              </span>
            </h2>

            <p className="waiting-date">{dateLabel}</p>
            <p className="waiting-time">{timeLabel}</p>

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

      <SecretLockPopup
        key={lockInstance}
        open={lockOpen}
        result={lockResult}
        onSubmit={handleCodeSubmit}
        onClose={handleLockClose}
      />
    </section>
  );
}

export default WaitingGate;
