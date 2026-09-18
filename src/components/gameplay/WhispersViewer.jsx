const CLUES = [
  { numeral: "I", text: <>Where the shrine's four directions find their balance, the <strong>Fox</strong> keeps watch.</> },
  { numeral: "II", text: <>The <strong>Moon</strong> follows the Fox's northern path. Only one silent space separates them.</> },
  { numeral: "III", text: <>The Moon's western companion bears the colour of the deep winter sky.</> },
  { numeral: "IV", text: <>On the Moon's road stands the <strong>Black</strong> stone. Three silent spaces lie between them.</> },
  { numeral: "V", text: <>The <strong>Red</strong> stone rests on the <strong>4th row, first square</strong>.</> },
  { numeral: "VI", text: <>Red is not alone. Its <strong>Purple</strong> companion rests beside it, toward the rising sun.</> },
  { numeral: "VII", text: <>The Fox looks eastward. After two silent spaces, <strong>Green</strong> answers its gaze.</> },
  { numeral: "VIII", text: <>The <strong>White</strong> stone claims the place where the eastern and southern edges meet.</> },
  { numeral: "IX", text: <>The <strong>Bell</strong> rings on White's vertical road. One levels separate its voice from White.</> },
  { numeral: "X", text: <>Before the Bell can be heard, the <strong>Crow</strong> watches from above.</> },
  { numeral: "XI", text: <>The <strong>Sun</strong> rests on the <strong>4th row, fifth square</strong>.</> },
  { numeral: "XII", text: <>What rises above the Fox casts its opposite below. There the <strong>Leaf</strong> takes root.</> },
  { numeral: "XIII", text: <>From the Leaf, follow the shrine floor toward the rising sun. After one silent stone, <strong>Rain</strong> waits.</> },
  { numeral: "XIV", text: <>Rain and the <strong>Skull</strong> belong to the same vertical trail. Between them lies one untouched place.</> },
  { numeral: "XV", text: <>The <strong>Lotus</strong> rests on the <strong>9th row, seventh square</strong>.</> },
];

function WhispersViewer({ isOpen, onClose }) {
  return (
    <div
      className={`gp-riddle-overlay ${isOpen ? "gp-riddle-overlay-open" : ""}`}
      aria-hidden={!isOpen}
    >
      <div className="gp-riddle-scrim" onClick={onClose} />

      <div className="gp-whispers-stage">
        <button
          type="button"
          className="gp-riddle-close"
          onClick={onClose}
          aria-label="Close whispers of the spirit"
        >
          ✕
        </button>

        <div className="gp-whispers-card">
          <p className="gp-whispers-heading">Whispers of the Spirit</p>

          <div className="gp-whispers-list">
            {CLUES.map((clue) => (
              <div className="gp-whispers-clue" key={clue.numeral}>
                <span className="gp-whispers-number">{clue.numeral}</span>
                <span>{clue.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhispersViewer;
