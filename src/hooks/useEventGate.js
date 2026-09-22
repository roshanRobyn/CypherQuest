import { useEffect, useRef, useState } from "react";
import { getEventState } from "../api/cypherQuestClient";

// Adaptive poll cadence: far from the release moment there's no need to
// check often; close to it, tighten up so the unlock feels prompt without
// hammering the backend the whole time it's waiting.
function pollDelayFor(msRemaining) {
  if (msRemaining <= 10_000) return 1000;
  if (msRemaining <= 60_000) return 5000;
  return 15_000;
}

const UNREACHABLE_RETRY_MS = 5000;

/**
 * Polls the backend's authoritative event-gate state and exposes it as
 * { phase: "checking" | "waiting" | "active" | "unreachable", displayMsRemaining, eventStartTime }.
 *
 * The backend's `status` field is the ONLY thing that ever sets
 * phase="active" — displayMsRemaining (derived from a synced server-clock
 * offset, ticked locally once a second) is purely cosmetic countdown text
 * and never itself decides the gate is open. A local clock change therefore
 * cannot unlock anything; it can only make the displayed number wrong until
 * the next poll corrects it.
 */
export function useEventGate() {
  const [phase, setPhase] = useState("checking");
  const [eventStartTime, setEventStartTime] = useState(null);
  const [displayMsRemaining, setDisplayMsRemaining] = useState(null);

  const offsetRef = useRef(0); // serverTime - Date.now(), from the latest successful poll

  // The recursive poll loop lives entirely inside this effect (a hoisted
  // local function, not a useCallback) so it never needs to be a stable
  // identity shared across renders — it's only ever called from here and
  // from its own recursive setTimeout.
  useEffect(() => {
    let mounted = true;
    let timeoutId;

    async function poll() {
      const result = await getEventState();
      if (!mounted) return;

      if (!result.ok) {
        setPhase("unreachable");
        timeoutId = setTimeout(poll, UNREACHABLE_RETRY_MS);
        return;
      }

      const { status, serverTime, eventStartTime: startsAt, msRemaining } = result.data;
      offsetRef.current = new Date(serverTime).getTime() - Date.now();
      setEventStartTime(startsAt);

      if (status === "ACTIVE") {
        setPhase("active");
        return; // gate is open — stop polling, caller transitions away from it
      }

      setPhase("waiting");
      timeoutId = setTimeout(poll, pollDelayFor(msRemaining));
    }

    poll();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // Cosmetic 1s ticker: recomputes the displayed countdown from the synced
  // offset between polls. Never touches `phase`.
  useEffect(() => {
    if (phase !== "waiting" || !eventStartTime) return undefined;

    const eventStartMs = new Date(eventStartTime).getTime();
    const tick = () => {
      const syncedNow = Date.now() + offsetRef.current;
      setDisplayMsRemaining(Math.max(0, eventStartMs - syncedNow));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [phase, eventStartTime]);

  return { phase, displayMsRemaining, eventStartTime };
}
