import { useRef, useState } from "react";
import "./App.css";

import outsideImage from "./assets/outside.png";
import GameplayScreen from "./components/gameplay/GameplayScreen";

function App() {
  const [scene, setScene] = useState("home");
  const [teamName, setTeamName] = useState("");
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

    // Go to black transition
    setScene("blackout");

    // Show game screen after 1.5 seconds
    setTimeout(() => {
      setScene("game");
    }, 1500);
  };

  return (
    <main
      className="app"
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