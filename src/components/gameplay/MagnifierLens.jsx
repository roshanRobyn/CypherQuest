import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const LENS_SIZE = 170;
const LENS_RADIUS = LENS_SIZE / 2;
const ZOOM = 2;
const SNAPSHOT_INTERVAL_MS = 200;

/*
  Reusable, puzzle-agnostic circular magnifier. It only ever looks for a
  ".gp-puzzle-iframe" inside whatever DOM node `containerRef` points to
  (GameplayArea's puzzle-hosting container) — it never imports or refers
  to any individual puzzle stage, so every existing and future
  iframe-based stage gets it automatically, with zero puzzle-specific code.

  WHY THIS DOESN'T DUPLICATE PUZZLE STATE:
  The lens never creates a second <iframe>, never sets/reloads the real
  iframe's src, and never re-runs any of the puzzle's own <script> tags.
  Every ~200ms it takes an INERT DOM snapshot (cloneNode) of the live
  iframe's current <body> — cloned/innerHTML'd <script> elements never
  execute in a browser, so this is not a second running copy of the
  puzzle, just a read-only visual echo of the one real, interactive
  iframe, which stays the sole source of truth throughout. That snapshot,
  plus the puzzle's own inline <style> rules (every puzzle file in this
  project inlines its CSS rather than linking an external stylesheet), is
  painted inside a Shadow DOM root so the puzzle's very generic class
  names (.button, .status, .page, ...) can never leak into or collide
  with the rest of the Cypher Quest UI.

  WHY A CIRCLE, NOT A GLOBAL SCALE:
  The snapshot is rendered at the real puzzle's natural 1:1 size, then a
  single CSS transform (translate → scale → translate) pans+zooms it so
  the exact point under the cursor lands at the center of a small,
  overflow:hidden circular viewport. Everything outside that circle is
  the untouched real iframe, rendered exactly as if the magnifier didn't
  exist — nothing about the real puzzle's size, transform, or layout is
  ever touched by this component.
*/
function MagnifierLens({ active, containerRef }) {
  const lensRef = useRef(null);
  const viewportRef = useRef(null);
  const shadowRef = useRef(null);
  const snapshotRootRef = useRef(null);
  // Last known viewport point (clientX/clientY) the lens should be
  // centered on — the single coordinate source shared by both the lens's
  // visual position and the magnified snapshot's pan/zoom transform, so
  // the two can never drift out of sync with each other.
  const pointerRef = useRef(null);

  // Attach the shadow root exactly once — this component's own markup is
  // always mounted (only `active` toggles behavior/visibility), so the
  // viewport host div never gets torn down and recreated.
  useEffect(() => {
    const host = viewportRef.current;
    if (!host || shadowRef.current) return;
    shadowRef.current = host.attachShadow({ mode: "open" });
  }, []);

  // Positions the lens and pans/zooms the current snapshot to the same
  // viewport point in one call, so the visible frame and the sampled
  // content are always derived from the exact same coordinate.
  const applyPointer = useCallback(
    (clientX, clientY) => {
      const container = containerRef.current;
      const lens = lensRef.current;
      if (!container || !lens) return;

      const iframe = container.querySelector(".gp-puzzle-iframe");
      const frameRect = (iframe || container).getBoundingClientRect();

      const minX = frameRect.left + LENS_RADIUS;
      const maxX = Math.max(minX, frameRect.right - LENS_RADIUS);
      const minY = frameRect.top + LENS_RADIUS;
      const maxY = Math.max(minY, frameRect.bottom - LENS_RADIUS);

      const lensX = Math.min(Math.max(clientX, minX), maxX);
      const lensY = Math.min(Math.max(clientY, minY), maxY);

      lens.style.left = `${lensX}px`;
      lens.style.top = `${lensY}px`;

      // Point under the cursor, in the real puzzle's own coordinate
      // space — this is the point the zoomed snapshot must center on.
      const cx = clientX - frameRect.left;
      const cy = clientY - frameRect.top;

      const root = snapshotRootRef.current;
      if (root) {
        root.style.width = `${frameRect.width}px`;
        root.style.height = `${frameRect.height}px`;
        root.style.transformOrigin = "0 0";
        root.style.transform =
          `translate(${LENS_RADIUS}px, ${LENS_RADIUS}px) scale(${ZOOM}) translate(${-cx}px, ${-cy}px)`;
      }
    },
    [containerRef]
  );

  // Periodically refresh the inert snapshot of the puzzle's current DOM
  // while active. Stopped (interval cleared) the instant it's turned off.
  useEffect(() => {
    if (!active) return undefined;

    // A fresh activation with no prior pointer recorded (first-ever use,
    // or the mouse hasn't crossed the puzzle since) has no real cursor
    // position to sample from — fall back to the lens's own resting spot
    // so the very first frame still has a coordinate to pan/zoom to,
    // instead of waiting for a mousemove. Measured against the SAME
    // element applyPointer itself measures against (the iframe, falling
    // back to the container only if it isn't mounted yet) — the container
    // also includes the puzzle label and its own padding above the
    // iframe, so its center is a different point on screen than the
    // iframe's center, which was the source of the initial-frame offset.
    if (!pointerRef.current) {
      const container = containerRef.current;
      if (container) {
        const iframe = container.querySelector(".gp-puzzle-iframe");
        const rect = (iframe || container).getBoundingClientRect();
        pointerRef.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
    }

    const takeSnapshot = () => {
      const shadow = shadowRef.current;
      const container = containerRef.current;
      const iframe = container && container.querySelector(".gp-puzzle-iframe");
      if (!shadow || !iframe) return;

      let sourceDoc;
      try {
        sourceDoc = iframe.contentDocument;
      } catch {
        return;
      }
      if (!sourceDoc || !sourceDoc.body) return;

      let styleText = Array.from(sourceDoc.querySelectorAll("style"))
        .map((style) => style.textContent)
        .join("\n");

      // ROOT CAUSE of the cross-puzzle offset: Shadow DOM does not give
      // its content an isolated CSS viewport — vw/vh/vmin/vmax units
      // inside the cloned stylesheet resolve against the TOP-LEVEL page's
      // real viewport, not this puzzle's own (much smaller) internal
      // iframe viewport, which is the coordinate space the puzzle was
      // actually laid out and fitStage()-scaled against. Any puzzle that
      // sizes something with these units (a header, or content like Three
      // Hidden Differences' `.cell{font-size:clamp(17px,2.1vw,28px)}` on
      // all 128 grid characters) lays out differently inside the
      // snapshot than in the real iframe, which is exactly what shows up
      // as the lens sampling the wrong area. Rewritten here to fixed px
      // computed from THIS iframe's own real internal viewport — a plain
      // text substitution on whatever CSS came out of whatever puzzle,
      // not tied to any puzzle's markup, id, or layout.
      const iframeWin = iframe.contentWindow;
      if (iframeWin) {
        const unitPx = {
          vw: iframeWin.innerWidth / 100,
          vh: iframeWin.innerHeight / 100,
          vmin: Math.min(iframeWin.innerWidth, iframeWin.innerHeight) / 100,
          vmax: Math.max(iframeWin.innerWidth, iframeWin.innerHeight) / 100,
        };
        styleText = styleText.replace(
          /(-?\d*\.?\d+)(vw|vh|vmin|vmax)\b/g,
          (match, num, unit) => `${(parseFloat(num) * unitPx[unit]).toFixed(3)}px`
        );
      }

      const clonedBody = sourceDoc.body.cloneNode(true);
      clonedBody.style.transform = "none";
      clonedBody.style.margin = "0";
      clonedBody.style.position = "absolute";
      clonedBody.style.top = "0";
      clonedBody.style.left = "0";

      // cloneNode does not copy live form-control values (they're a DOM
      // property, not an HTML attribute) — copy those across by hand.
      // Generic (input/textarea/select), no puzzle-specific field names.
      const liveControls = sourceDoc.querySelectorAll("input, textarea, select");
      const clonedControls = clonedBody.querySelectorAll("input, textarea, select");
      liveControls.forEach((el, index) => {
        const target = clonedControls[index];
        if (!target) return;
        if ("value" in el) target.value = el.value;
        if ("checked" in el) target.checked = el.checked;
      });

      shadow.replaceChildren();
      const styleEl = document.createElement("style");
      styleEl.textContent = `:host{all:initial;display:block;position:relative;width:100%;height:100%;overflow:hidden;}\n${styleText}`;
      shadow.appendChild(styleEl);
      shadow.appendChild(clonedBody);
      snapshotRootRef.current = clonedBody;

      // Every snapshot replaces the DOM node the pan/zoom transform lives
      // on, so the fresh clone starts out untransformed (1:1, top-left)
      // until something re-applies it. Do that immediately here, using
      // the last known pointer, instead of waiting for the next
      // mousemove — otherwise each refresh (including the very first
      // one, right on activation) would briefly show the wrong area.
      if (pointerRef.current) {
        applyPointer(pointerRef.current.x, pointerRef.current.y);
      }
    };

    takeSnapshot();
    const interval = setInterval(takeSnapshot, SNAPSHOT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [active, containerRef, applyPointer]);

  // Cursor tracking: pans/zooms the existing snapshot and repositions the
  // lens frame. Listens on `window`, not the puzzle container — the lens
  // itself is portaled to document.body (see the return below) and, once
  // visible, sits ON TOP of the puzzle at the cursor's own position, so a
  // listener scoped to the container would stop receiving events the
  // moment the cursor is hit-tested against the lens instead of whatever
  // is beneath it (the lens is no longer a DOM descendant of the
  // container after the portal, so that mousemove wouldn't bubble there
  // at all). `window` always receives it regardless of which element on
  // screen was actually hit. applyPointer's own frameRect-based clamping
  // (above) is what keeps the lens confined to the real puzzle frame —
  // this listener itself does not need to be scoped to stay correct.
  useEffect(() => {
    if (!active) return undefined;

    const handleMove = (event) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      applyPointer(event.clientX, event.clientY);
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [active, applyPointer]);

  // ROOT CAUSE OF THE CROSS-PUZZLE MISALIGNMENT:
  // App.jsx applies `transform: scale(zoomScale)` to the app's root
  // ".app" element (see useZoomLock.js) to counteract browser zoom. Per
  // the CSS spec, ANY transform value other than "none" on an ancestor —
  // even a visual no-op like scale(1) — makes that ancestor the
  // containing block for `position: fixed` descendants instead of the
  // true viewport. This component lives inside that subtree, so its
  // `position: fixed` left/top (set from raw event.clientX/clientY, i.e.
  // TRUE viewport coordinates) was being resolved against ".app"'s box
  // instead — correct only in the coincidental case where ".app" exactly
  // fills the true viewport (no active zoom offset), and drifting
  // whenever it doesn't. This has nothing to do with which puzzle is
  // open — every puzzle shares this same ".app" ancestor — which is
  // exactly why it could look fine for one test and off for another: the
  // discrepancy tracks browser zoom / window state, not puzzle content.
  // MapOverlay.jsx already solves this identically ("portaled straight
  // to <body>, outside the app's zoom-locked root") — reusing that same
  // fix here keeps every coordinate this component ever computes
  // (frameRect, clientX/clientY) in one consistent, true-viewport space.
  return createPortal(
    <div
      ref={lensRef}
      className={`gp-magnifier-lens ${active ? "gp-magnifier-lens-active" : ""}`}
      aria-hidden="true"
    >
      <div ref={viewportRef} className="gp-magnifier-viewport" />
      <span className="gp-magnifier-handle" />
    </div>,
    document.body
  );
}

export default MagnifierLens;
