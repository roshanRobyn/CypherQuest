import {
  findTeamById,
  findTeamByName,
  createTeam as repoCreateTeam,
  listTeams as repoListTeams,
  updateTeam,
  resetAll as repoResetAll,
  deleteTeam as repoDeleteTeam,
} from "./teamRepository.js";
import {
  PUZZLES,
  isValidPuzzleId,
  getFirstPuzzleId,
  getNextPuzzleId,
  isLastPuzzle,
} from "../config/puzzles.js";
import { generateId } from "../utils/id.js";
import { Errors } from "../utils/errors.js";

export function registerTeam({ teamName, leader, institution, registrationId, members }) {
  if (!teamName || typeof teamName !== "string" || teamName.trim() === "") {
    throw Errors.validation("teamName is required and must be a non-empty string");
  }

  // Idempotent-ish convenience: if a team with this exact name already
  // exists, return it instead of creating a duplicate. This keeps the
  // frontend's fire-and-forget register+start flow safe to call more than
  // once (e.g. re-render, retry) without spawning duplicate teams.
  const existing = findTeamByName(teamName.trim());
  if (existing) return existing;

  return repoCreateTeam({
    teamName: teamName.trim(),
    leader,
    institution,
    registrationId,
    members,
  });
}

export function listTeams() {
  return repoListTeams();
}

export function getTeam(teamId) {
  const team = findTeamById(teamId);
  if (!team) throw Errors.teamNotFound(teamId);
  return team;
}

export function getTeamProgress(teamId) {
  const team = getTeam(teamId);
  const completedIds = new Set(team.completedPuzzles.map((p) => p.puzzleId));

  const puzzles = PUZZLES.map((p, index) => {
    const completedEntry = team.completedPuzzles.find((c) => c.puzzleId === p.puzzleId);
    return {
      puzzleId: p.puzzleId,
      name: p.name,
      order: index + 1,
      status: completedEntry
        ? "COMPLETED"
        : team.currentPuzzle === p.puzzleId
        ? "CURRENT"
        : "LOCKED",
      completedAt: completedEntry?.completedAt ?? null,
      timeTakenMs: completedEntry?.timeTakenMs ?? null,
    };
  });

  return {
    teamId: team.teamId,
    teamNumber: team.teamNumber,
    teamName: team.teamName,
    status: team.status,
    currentPuzzle: team.currentPuzzle,
    puzzlesCompleted: completedIds.size,
    totalPuzzles: PUZZLES.length,
    puzzles,
  };
}

export function getTeamSession(teamId) {
  const team = getTeam(teamId);
  return team.session;
}

export function startGame({ teamId }) {
  if (!teamId || typeof teamId !== "string") {
    throw Errors.validation("teamId is required");
  }

  const team = getTeam(teamId);
  const now = new Date().toISOString();

  // Idempotent: if a session is already active, just return current state.
  // A COMPLETED team is also returned unchanged — re-entering the team name
  // must never reset a finished hunt back to ACTIVE.
  if ((team.status === "ACTIVE" && team.session) || team.status === "COMPLETED") {
    return team;
  }

  const updated = updateTeam(teamId, (t) => ({
    ...t,
    status: "ACTIVE",
    startedAt: t.startedAt ?? now,
    currentPuzzle: t.currentPuzzle ?? getFirstPuzzleId(),
    session: {
      sessionId: generateId("session"),
      startedAt: now,
      status: "ACTIVE",
    },
  }));

  return updated;
}

export function completePuzzle({ teamId, puzzleId }) {
  if (!teamId || typeof teamId !== "string") {
    throw Errors.validation("teamId is required");
  }
  if (!puzzleId || typeof puzzleId !== "string") {
    throw Errors.validation("puzzleId is required");
  }
  if (!isValidPuzzleId(puzzleId)) {
    throw Errors.puzzleNotFound(puzzleId);
  }

  const team = getTeam(teamId);

  // Idempotency: if this puzzle was already completed, return the existing
  // recorded result rather than erroring or recording it twice.
  const existing = team.completedPuzzles.find((p) => p.puzzleId === puzzleId);
  if (existing) {
    return { team, completion: existing, alreadyCompleted: true };
  }

  if (team.status !== "ACTIVE" || !team.session || team.session.status !== "ACTIVE") {
    throw Errors.sessionNotActive(teamId);
  }

  const isLast = isLastPuzzle(puzzleId);

  // The Final Treasure is the actual end of the hunt, so it only counts
  // once every level before it has been recorded server-side. Loading
  // final-treasure.html (or posting its puzzleId directly) without that
  // progress cannot mark a team COMPLETED.
  if (isLast) {
    const completedIds = new Set(team.completedPuzzles.map((p) => p.puzzleId));
    const missing = PUZZLES.slice(0, -1).some((p) => !completedIds.has(p.puzzleId));
    if (missing) throw Errors.finalNotUnlocked(teamId);
  }

  const now = new Date();
  const nowIso = now.toISOString();

  // Time taken = now - (previous puzzle completion time, or session start).
  const previousTimestamp =
    team.completedPuzzles.length > 0
      ? team.completedPuzzles[team.completedPuzzles.length - 1].completedAt
      : team.session.startedAt;
  const timeTakenMs = Math.max(0, now.getTime() - new Date(previousTimestamp).getTime());

  const completion = { puzzleId, completedAt: nowIso, timeTakenMs };

  const nextPuzzleId = getNextPuzzleId(puzzleId);

  const updated = updateTeam(teamId, (t) => {
    const completedPuzzles = [...t.completedPuzzles, completion];
    // Total hunt time = server finishedAt - server session start. Never
    // derived from anything the client sends.
    const totalTimeMs = isLast
      ? Math.max(0, now.getTime() - new Date(t.session.startedAt).getTime())
      : t.totalTimeMs;

    return {
      ...t,
      completedPuzzles,
      currentPuzzle: isLast ? null : nextPuzzleId,
      status: isLast ? "COMPLETED" : t.status,
      finishedAt: isLast ? nowIso : t.finishedAt,
      totalTimeMs: isLast ? totalTimeMs : t.totalTimeMs,
      session: isLast ? { ...t.session, status: "COMPLETED" } : t.session,
    };
  });

  return { team: updated, completion, alreadyCompleted: false };
}

export function getLeaderboard() {
  const teams = repoListTeams();

  const completed = teams
    .filter((t) => t.status === "COMPLETED")
    .map((t) => ({
      teamName: t.teamName,
      teamNumber: t.teamNumber,
      teamId: t.teamId,
      puzzlesCompleted: t.completedPuzzles.length,
      totalTimeMs: t.totalTimeMs,
      completionTimestamp: t.finishedAt,
    }))
    .sort((a, b) => a.totalTimeMs - b.totalTimeMs)
    .map((entry, index) => ({ rank: index + 1, ...entry }));

  const active = teams
    .filter((t) => t.status === "ACTIVE" || t.status === "PAUSED")
    .map((t) => ({
      teamName: t.teamName,
      teamNumber: t.teamNumber,
      teamId: t.teamId,
      status: t.status,
      puzzlesCompleted: t.completedPuzzles.length,
      currentPuzzle: t.currentPuzzle,
      // Timestamp the team reached its current furthest point (last puzzle
      // completion, or session start if none completed yet). Used to break
      // ties between teams stuck on the same stage: whoever got there
      // first ranks higher, since not every team is guaranteed to finish.
      reachedCurrentAt:
        t.completedPuzzles.length > 0
          ? t.completedPuzzles[t.completedPuzzles.length - 1].completedAt
          : t.session?.startedAt ?? t.startedAt ?? null,
    }))
    .sort((a, b) => {
      if (a.puzzlesCompleted !== b.puzzlesCompleted) return b.puzzlesCompleted - a.puzzlesCompleted;
      const timeA = a.reachedCurrentAt ? new Date(a.reachedCurrentAt).getTime() : Infinity;
      const timeB = b.reachedCurrentAt ? new Date(b.reachedCurrentAt).getTime() : Infinity;
      return timeA - timeB;
    });

  return { completed, active };
}

// Admin-only: removes exactly one team by its authoritative teamId. The
// leaderboard and the dashboard's progress/stream are all derived from the
// team records, so nothing else needs cleaning up.
export function removeTeam(teamId) {
  if (!teamId || typeof teamId !== "string") {
    throw Errors.validation("teamId is required");
  }
  const removed = repoDeleteTeam(teamId);
  if (!removed) throw Errors.teamNotFound(teamId);
  return removed;
}

export function resetAllData() {
  repoResetAll();
}
