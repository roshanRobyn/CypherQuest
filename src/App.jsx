import { useCallback, useRef, useState } from "react";
import "./App.css";

import outsideImage from "./assets/outside.png";
import GameplayScreen from "./components/gameplay/GameplayScreen";
import WaitingGate from "./components/WaitingGate";
import { useZoomLock } from "./hooks/useZoomLock";
import { clearSession, loadSession, saveSession } from "./data/persistence";
import { registerTeam, startGame } from "./api/cypherQuestClient";

// Read once, before first render, so a refresh resumes into the right
// scene instead of flashing the team-entry screen first. Two saved shapes:
//  - { teamName, quest: {...} }  — a game that had actually started
//    (useQuestProgression writes this once GameplayScreen mounts, which
//    only ever happens after the backend's event gate reported ACTIVE —
//    see handleUnlocked below) => resume straight into "game".
//  - { teamName }                — team confirmed, still waiting on the
//    event gate (see startQuest below) => resume into "waiting" rather
//    than forcing the team to re-enter their name.
// Either way this can never resume into "game" before the real event
// start, because that saved shape is only ever written after unlock.
const savedSession = loadSession();
const initialScene = savedSession?.quest ? "game" : savedSession ? "waiting" : "home";

function App() {
  const zoomLock = useZoomLock();
  const [scene, setScene] = useState(initialScene);
  const [teamName, setTeamName] = useState(savedSession?.teamName ?? "");
  const [error, setError] = useState("");
  const [ripples, setRipples] = useState([]);
  const cursorRef = useRef(null);

  const handleMouseMove = (event) => {
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    }
  };

  const handleMouseDown = (event) => {
    if (scene !== "home") return;

    const id = Date.now() + Math.random();
    setRipples((current) => [...current.slice(-4), { id, x: event.clientX, y: event.clientY }]);

    setTimeout(() => {
      setRipples((current) => current.filter((ripple) => ripple.id !== id));
    }, 900);
  };

  const startQuest = () => {
    const name = teamName.trim();

    if (name === "") {
      setError("Please enter your team name");
      return;
    }

    setError("");

    // A genuinely new session starts here — clear any previous team's
    // saved progress so it can't accidentally carry over into this one.
    clearSession();

    // Fire-and-forget: register the team so admin dashboards pick it up.
    // Never awaited and never allowed to delay the scene transition below —
    // the client itself swallows all errors (backend down, offline, etc).
    // Deliberately NOT starting the game session here — that only happens
    // in handleUnlocked, once the backend's event gate actually reports
    // ACTIVE (see gameController.start's server-side enforcement).
    registerTeam(name)
      .then((result) => {
        if (result.ok) {
          try {
            window.localStorage.setItem("cypherquest_team_id", result.data.teamId);
          } catch {
            // ignore storage failures (e.g. private browsing)
          }
        }
      })
      .catch(() => {});

    // Marks this team as "confirmed, waiting on the gate" so a refresh
    // before unlock resumes straight into "waiting" (see initialScene
    // above) instead of forcing the team to re-enter their name.
    saveSession({ teamName: name });

    setScene("waiting");
  };

  // Fires exactly once, from WaitingGate, the moment the backend's event
  // gate reports ACTIVE. Starts the real game session server-side (now
  // that it will actually be accepted) and plays the existing blackout
  // transition into gameplay — unchanged in spirit from the old fixed
  // 1.5s timer, just now triggered by the authoritative unlock instead.
  const handleUnlocked = useCallback(() => {
    try {
      const teamId = window.localStorage.getItem("cypherquest_team_id");
      if (teamId) startGame(teamId).catch(() => {});
    } catch {
      // ignore storage access failures (e.g. private browsing)
    }

    setScene("unsealing");

    setTimeout(() => setScene("blackout"), 1200);
    setTimeout(() => setScene("game"), 1200 + 1500);
  }, []);

  return (
    <main
      className={`app${zoomLock.isTablet ? " app-tablet" : ""}${zoomLock.isMobile ? " app-mobile" : ""}`}
      style={zoomLock.style}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
    >
      {scene !== "game" && (
        <div ref={cursorRef} className="cursor-orb">
          <span className="cursor-compass-ring"></span>
          <span className="cursor-cross cursor-cross-top"></span>
          <span className="cursor-cross cursor-cross-right"></span>
          <span className="cursor-cross cursor-cross-bottom"></span>
          <span className="cursor-cross cursor-cross-left"></span>
          <span className="cursor-diamond"></span>
        </div>
      )}

      {scene !== "game" &&
        ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="cursor-ripple"
            style={{ left: ripple.x, top: ripple.y }}
          ></span>
        ))}

      {/* =====================================================
          HOME SCREEN
      ===================================================== */}

      {scene === "home" && (
        <section className="home-scene">

          {/* Background */}
          <div className="image-container">
            <img
              src={outsideImage}
              alt="Japanese shrine"
              className="outside-image"
            />
          </div>

          {/* Slight dark overlay */}
          <div className="background-overlay"></div>
          {/* Moving mist */}
          <div className="mist mist-one"></div>
          <div className="mist mist-two"></div>
          <div className="mist mist-three"></div>

          <div className="fog-ribbon fog-ribbon-one"></div>
          <div className="fog-ribbon fog-ribbon-two"></div>
          <div className="fog-ribbon fog-ribbon-three"></div>



          {/* =================================================
              LEFT SIDE TEXT
          ================================================= */}

          <div className="side-text left-side">

            <div>CLUES</div>
            <div>BEYOND</div>
            <div>BOUNDARIES</div>

            <div className="side-line"></div>

          </div>


          {/* =================================================
              RIGHT SIDE TEXT
          ================================================= */}

          <div className="side-text right-side">

            <div>ONLY</div>
            <div>THE CURIOUS</div>
            <div>FIND THE WAY</div>

            <div className="side-line"></div>

          </div>


          {/* =================================================
              CENTER CONTENT
          ================================================= */}

          <div className="center-content">

            {/* Small Japanese symbol */}
            <div className="mystery-symbol">
              暗
            </div>


            {/* Intro */}
            <div className="mystery-intro">
              ✦ &nbsp; A NEW MYSTERY AWAITS &nbsp; ✦
            </div>


            {/* Event name */}
<h1 className="event-title">
  {"CYPHER QUEST".split("").map((letter, index) => (
    <span
      key={index}
      style={{
        animationDelay: `${index * 0.28}s`,
      }}
    >
      {letter === " " ? "\u00A0" : letter}
    </span>
  ))}
</h1>

            {/* Japanese subtitle */}
            <div className="event-subtitle">
              暗号の旅
            </div>


            {/* Decorative divider */}
            <div className="title-divider">

              <span></span>

              <b>✦</b>

              <span></span>

            </div>


            {/* Description */}
            <div className="event-description">


              <p>
                Explore. Discover. Decode. Unlock.
              </p>

            </div>


            {/* =================================================
                TEAM ENTRY
            ================================================= */}

            <div className="team-section">


              <p className="team-description">
                BEGIN YOUR JOURNEY INTO THE UNKNOWN
              </p>


              {/* Team input */}

              <div className="team-input">

                <span className="team-icon">
                  ♟
                </span>

                <input
                  type="text"
                  placeholder="Team Name"
                  value={teamName}
                  onChange={(event) => {
                    setTeamName(event.target.value);
                    setError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      startQuest();
                    }
                  }}
                />

              </div>


              {/* Error */}

              {error && (
                <p className="error-message">
                  {error}
                </p>
              )}


              {/* Enter button */}

              <button
                type="button"
                className="enter-button"
                onClick={startQuest}
              >

                <span>
                  ENTER THE QUEST
                </span>

                <span className="arrow">
                  →
                </span>

              </button>

            </div>

          </div>


          {/* =================================================
              QUOTE
          ================================================= */}

          <div className="quote">

            <p>
              “Every path hides a story.”
            </p>

            <span>
              — TSUSHIMA
            </span>

          </div>

        </section>
      )}


      {/* =====================================================
          WAITING GATE — team confirmed, sealed shrine / countdown
      ===================================================== */}

      {scene === "waiting" && (
        <WaitingGate teamName={teamName} onUnlocked={handleUnlocked} />
      )}


      {/* =====================================================
          UNSEALING — brief unlock flourish, then blackout -> game
      ===================================================== */}

      {scene === "unsealing" && (
        <section className="unsealing">

          <p>HUNT BEGINS</p>

        </section>
      )}


      {/* =====================================================
          BLACKOUT
      ===================================================== */}

      {scene === "blackout" && (
        <section className="blackout">

          <p>
            THE JOURNEY HAS BEGUN...
          </p>

        </section>
      )}


      {/* =====================================================
          GAME SCREEN
      ===================================================== */}

      {scene === "game" && <GameplayScreen teamName={teamName} />}

    </main>
  );
}

export default App;