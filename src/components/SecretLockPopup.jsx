import { useEffect, useRef, useState } from "react";
import "./SecretLockPopup.css";

const CODE_LENGTH = 7;

// Cinematic "ancient mechanism" popup for the hidden waiting-screen Easter
// egg. Purely decorative — the code it checks (owned by WaitingGate) never
// touches the event gate, team session, or countdown.
function SecretLockPopup({ open, result, onSubmit, onClose }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  // No effect resets `value` on open/close — the parent remounts this
  // component fresh each time it opens (see WaitingGate's `key={lockInstance}`),
  // so useState("") above is already a clean slate every time.
  useEffect(() => {
    if (!open) return undefined;
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(focusTimer);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleChange = (event) => {
    setValue(event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (value.length !== CODE_LENGTH) return;
    onSubmit(value);
    // Clear immediately rather than waiting on a `result` prop round-trip:
    // irrelevant on success (the input stops rendering once `result` flips
    // to "success"), and gives a clean slate to retry on wrong.
    setValue("");
  };

  return (
    <div className="secret-lock-overlay">
      <div className="secret-lock-scrim" onClick={onClose}></div>

      <form
        className={`secret-lock-card${result === "wrong" ? " secret-lock-card-wrong" : ""}`}
        onSubmit={handleSubmit}
      >
        <button type="button" className="secret-lock-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {result === "success" ? (
          <>
            <p className="secret-lock-eyebrow">封印</p>
            <h3 className="secret-lock-title">THE SEAL ACKNOWLEDGES YOU</h3>
            <p className="secret-lock-note">A hidden mark is left upon the shrine.</p>
          </>
        ) : (
          <>
            <p className="secret-lock-eyebrow">THE SEALED HUNT</p>
            <h3 className="secret-lock-title">ENTER THE SEQUENCE</h3>

            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              className="secret-lock-input"
              value={value}
              onChange={handleChange}
              placeholder="_ _ _ _ _ _ _"
              maxLength={CODE_LENGTH}
            />

            <button type="submit" className="secret-lock-submit" disabled={value.length !== CODE_LENGTH}>
              UNSEAL
            </button>
          </>
        )}
      </form>
    </div>
  );
}

export default SecretLockPopup;
