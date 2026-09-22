import * as gameplayService from "../services/gameplayService.js";
import { PUZZLES } from "../config/puzzles.js";

function serializeTeam(team) {
  return {
    teamId: team.teamId,
    teamNumber: team.teamNumber,
    teamName: team.teamName,
    leader: team.leader,
    institution: team.institution,
    registrationId: team.registrationId,
    members: team.members,
    status: team.status,
    currentPuzzle: team.currentPuzzle,
    completedPuzzles: team.completedPuzzles,
    startedAt: team.startedAt,
    finishedAt: team.finishedAt,
    totalTimeMs: team.totalTimeMs,
    createdAt: team.createdAt,
  };
}

export async function register(req, reply) {
  const body = req.body ?? {};
  const team = gameplayService.registerTeam(body);
  reply.code(201).send({ success: true, data: serializeTeam(team) });
}

export async function list(req, reply) {
  const teams = gameplayService.listTeams().map(serializeTeam);
  reply.send({ success: true, data: teams });
}

export async function getOne(req, reply) {
  const team = gameplayService.getTeam(req.params.teamId);
  reply.send({ success: true, data: serializeTeam(team) });
}

export async function progress(req, reply) {
  const progressData = gameplayService.getTeamProgress(req.params.teamId);
  reply.send({ success: true, data: progressData });
}

export async function session(req, reply) {
  const teamSession = gameplayService.getTeamSession(req.params.teamId);
  reply.send({ success: true, data: teamSession });
}

export async function puzzleCatalog(req, reply) {
  reply.send({ success: true, data: PUZZLES });
}
