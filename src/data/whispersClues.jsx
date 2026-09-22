// The Forgotten Spirit / Shogi puzzle-solving clues — the actual
// instructions the player needs while placing stones on the board.
// Single source of truth: shown from the Inventory (WhispersViewer.jsx)
// AND from inside the Shogi puzzle itself (ForgottenSpiritStage.jsx), so
// both places can never drift out of sync with each other.
export const WHISPERS_CLUES = [
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
