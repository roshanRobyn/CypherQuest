import { useEffect, useRef, useState } from "react";

// Browser zoom (Ctrl +/-, Ctrl+wheel) changes window.devicePixelRatio in
// lockstep with the zoom factor, while leaving the physical screen alone.
// A real window/monitor resize changes innerWidth/innerHeight but NOT the
// devicePixelRatio. That difference is how we tell "the player zoomed" apart
// from "the window actually got bigger/smaller".
function getDPR() {
  return window.devicePixelRatio || 1;
}

// Freezes the whole app's composition at its size when the page first
// loaded, then applies a counter-scale whenever the browser's zoom level
// changes so the app always renders at that original physical scale.
// Returns CSS custom properties + a transform to apply to the app's root
// "stage" wrapper. Anything rendered outside that wrapper (e.g. the map
// overlay, mounted via a portal) is left alone and keeps following normal
// browser zoom.
export function useZoomLock() {
  const baseDPR = useRef(getDPR());
  const baseSize = useRef({ w: window.innerWidth, h: window.innerHeight });

  const [zoomScale, setZoomScale] = useState(1);
  const [baseline, setBaseline] = useState(baseSize.current);

  useEffect(() => {
    function applyZoom() {
      const dpr = getDPR();
      const zoomFactor = dpr / baseDPR.current;
      setZoomScale(1 / zoomFactor);
    }

    function handleResize() {
      // devicePixelRatio unchanged => this is a genuine resize, not a zoom
      // change. Re-baseline so the layout adapts to the new window size.
      if (getDPR() === baseDPR.current) {
        baseSize.current = { w: window.innerWidth, h: window.innerHeight };
        setBaseline(baseSize.current);
      }
    }

    let mql = window.matchMedia(`(resolution: ${getDPR()}dppx)`);
    function handleZoomChange() {
      applyZoom();
      // matchMedia only fires once per crossing; re-subscribe at the new dpr.
      mql.removeEventListener("change", handleZoomChange);
      mql = window.matchMedia(`(resolution: ${getDPR()}dppx)`);
      mql.addEventListener("change", handleZoomChange);
    }

    mql.addEventListener("change", handleZoomChange);
    window.addEventListener("resize", handleResize);

    return () => {
      mql.removeEventListener("change", handleZoomChange);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // The tablet/mobile CSS breakpoints key off this frozen baseline width
  // instead of the live (zoom-shifting) viewport, so zooming in on a normal
  // desktop window can no longer make the layout think it's a narrow/mobile
  // screen. A genuine window resize still re-baselines (see handleResize
  // above) and updates these normally.
  const isTablet = baseline.w <= 1000;
  const isMobile = baseline.w <= 650;

  return {
    scale: zoomScale,
    isTablet,
    isMobile,
    style: {
      "--gp-vw": `${baseline.w / 100}px`,
      "--gp-vh": `${baseline.h / 100}px`,
      transform: `scale(${zoomScale})`,
    },
  };
}
