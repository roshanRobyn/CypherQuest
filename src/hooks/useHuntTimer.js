import { useEffect, useRef, useState } from "react";
import { getEventState } from "../api/cypherQuestClient";

// Same adaptive-cadence idea as useEventGate.js's pollDelayFor — tighter
// near the 5-minute warning and the expiry moment, relaxed otherwise.
function pollDelayFor(msRemaining) {
  if (msRemaining <= 10_000) return 1000;
  if (msRemaining <= 5 * 60_000) return 5000;
  return 20_000;
}

const UNREACHABLE_RETRY_MS = 5000;
const WARNING_THRESHOLD_MS = 5 * 60_000;

/**
 * Polls the SAME backend endpoint useEventGate.js uses (GET /api/event/state
 * — see eventService.js's computeHuntState) for the authoritative in-
 * gameplay hunt-duration clock, and exposes it as one status:
 * "checking" | "pending" | "active" | "warning" | "expired" | "unreachable",
 * plus `displayMsRemaining` — a countdown value that only ever exists while
 * status === "warning" (null otherwise), since HuntTimer.jsx only ever
 * shows a countdown during the final 5 minutes, never before.
 *
 * Mirrors useEventGate's security model exactly: the backend's huntStatus
 * field is the ONLY thing that ever sets status="expired"/"warning" —
 * displayMsRemaining (synced-offset, ticked locally once a second) is
 * purely cosmetic and never itself decides the hunt is over or that the
 * warning has started. A local clock change cannot affect either; it can
 * only make the displayed number wrong until the next poll corrects it.
 * Deliberately independent of useEventGate — that hook only runs pre-game
 * (WaitingGate unmounts it once gameplay starts); this one is mounted for
 * the lifetime of GameplayScreen instead.
 *
 * `onExpire`, if given, fires exactly once — from inside this hook's own
 * poll loop, the instant the backend first reports EXPIRED — so the
 * caller's reaction (closing overlays, forcing the final-treasure stage)
 * lives in the caller, not duplicated here; same shape as WaitingGate's
 * `onUnlocked` prop for the event gate's ACTIVE transition.
 */
export function useHuntTimer({ onExpire } = {}) {
  const [status, setStatus] = useState("checking");
  const [huntEndTime, setHuntEndTime] = useState(null);
  const [displayMsRemaining, setDisplayMsRemaining] = useState(null);

  const offsetRef = useRef(0); // serverTime - Date.now(), from the latest successful poll
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    let mounted = true;
    let timeoutId;

    async function poll() {
      const result = await getEventState();
      if (!mounted) return;

      if (!result.ok) {
        setStatus("unreachable");
        timeoutId = setTimeout(poll, UNREACHABLE_RETRY_MS);
        return;
      }

      const { serverTime, huntStatus, huntEndTime: endsAt, huntMsRemaining } = result.data;
      offsetRef.current = new Date(serverTime).getTime() - Date.now();
      setHuntEndTime(endsAt);

      if (huntStatus === "EXPIRED") {
        setStatus("expired");
        onExpireRef.current?.();
        return; // hunt is over — stop polling
      }

      if (huntStatus === "PENDING") {
        setStatus("pending");
      } else {
        setStatus(huntMsRemaining <= WARNING_THRESHOLD_MS ? "warning" : "active");
      }

      timeoutId = setTimeout(poll, pollDelayFor(huntMsRemaining));
    }

    poll();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // Cosmetic 1s ticker — ONLY while status === "warning" (never "active"/
  // "pending"), so the countdown value never exists before the 5-minute
  // mark. Never touches `status` itself.
  useEffect(() => {
    if (status !== "warning" || !huntEndTime) return undefined;

    const huntEndMs = new Date(huntEndTime).getTime();
    const tick = () => {
      const syncedNow = Date.now() + offsetRef.current;
      setDisplayMsRemaining(Math.max(0, huntEndMs - syncedNow));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [status, huntEndTime]);

  return { status, displayMsRemaining, isExpired: status === "expired" };
}
