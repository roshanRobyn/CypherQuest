export class ApiError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const Errors = {
  validation: (message) => new ApiError(400, "VALIDATION_ERROR", message),
  teamNotFound: (teamId) =>
    new ApiError(404, "TEAM_NOT_FOUND", `No team found with id "${teamId}"`),
  puzzleNotFound: (puzzleId) =>
    new ApiError(404, "PUZZLE_NOT_FOUND", `No puzzle found with id "${puzzleId}"`),
  sessionNotActive: (teamId) =>
    new ApiError(409, "SESSION_NOT_ACTIVE", `Team "${teamId}" does not have an active session`),
  eventNotStarted: () =>
    new ApiError(403, "EVENT_LOCKED", "The event has not started yet — gameplay is sealed"),
  forbidden: (message) => new ApiError(403, "FORBIDDEN", message),
  notFound: (message) => new ApiError(404, "NOT_FOUND", message),
};
