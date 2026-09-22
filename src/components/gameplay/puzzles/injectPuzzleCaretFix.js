// Every puzzle is a standalone document loaded via <iframe> — CSS from the
// parent React page (see src/index.css's own copy of this exact rule)
// never crosses that boundary, so each puzzle document has historically
// needed to declare this rule itself. That's exactly what got missed for
// a few puzzles added later (nothing enforced it), which is what let the
// browser's default text-insertion caret start appearing on ordinary
// puzzle text again.
//
// Injecting it here instead — once, from the one shared host every
// iframe-based puzzle stage already funnels through — means no future
// puzzle integration can miss it again, without hand-copying this block
// into every new puzzle HTML file.
const CARET_FIX_CSS = `
  * { caret-color: transparent; }
  input, textarea, [contenteditable="true"], [contenteditable=""] { caret-color: auto; }
`;

const STYLE_ID = "cq-caret-fix";

// Call from an iframe's onLoad. Same-origin only (every puzzle here is
// served from this app's own origin); if that's ever not true,
// contentDocument access throws and this silently no-ops rather than
// breaking the puzzle.
export function injectPuzzleCaretFix(iframe) {
  try {
    const doc = iframe?.contentDocument;
    if (!doc || !doc.head || doc.getElementById(STYLE_ID)) return;

    const style = doc.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CARET_FIX_CSS;
    doc.head.appendChild(style);
  } catch {
    // Cross-origin or not-yet-ready document — nothing to do.
  }
}
