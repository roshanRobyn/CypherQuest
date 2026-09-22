import { useState } from "react";
import { translate } from "../../data/translations";

function TranslationPanel({ isOpen, onClose, onTranslated }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const handleInputChange = (event) => {
    setInput(event.target.value);
    // The displayed result must always correspond to the current input —
    // any edit invalidates the previous translation immediately, rather
    // than leaving a stale result on screen until the next Translate press.
    setResult(null);
    setNotFound(false);
  };

  const handleTranslate = () => {
    const key = input.trim();
    const found = translate(key);
    if (found) {
      setResult(found);
      setNotFound(false);
      onTranslated?.(key);
    } else {
      setResult(null);
      setNotFound(true);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") handleTranslate();
  };

  return (
    <div
      className={`gp-map-overlay ${isOpen ? "gp-map-overlay-open" : ""}`}
      aria-hidden={!isOpen}
    >
      <div className="gp-map-scrim" onClick={onClose} />

      <div className="gp-translation-card">
        <button
          type="button"
          className="gp-map-close"
          onClick={onClose}
          aria-label="Close translation"
        >
          ✕
        </button>

        <p className="gp-translation-label">TRANSLATOR</p>

        <input
          type="text"
          className="gp-translation-input"
          placeholder="Enter Japanese word or phrase"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />

        <button
          type="button"
          className="gp-translation-btn"
          onClick={handleTranslate}
        >
          Translate
        </button>

        {result && (
          <div className="gp-translation-result">
            <p className="gp-translation-jp">{input.trim()}</p>
            {result.romaji && (
              <p className="gp-translation-romaji">{result.romaji}</p>
            )}
            <p className="gp-translation-en">"{result.en}"</p>
          </div>
        )}

        {notFound && (
          <p className="gp-translation-notfound">No translation found.</p>
        )}
      </div>
    </div>
  );
}

export default TranslationPanel;
