import AuditLog from "../models/AuditLog.js";
import Team from "../models/Team.js";
import catchAsync from "../utils/catchAsync.js";
import getToken from "../utils/getToken.js";
import HandleError from "../utils/HandleError.js";

export const getTeamAudit = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const team = await Team.findById(req.query.teamId);
  if (!team) return next(new HandleError("team not found", 404));

  if (team.owner.toString() !== token?.id) {
    return next(new HandleError("only owner can view audit log", 403));
  }

  const logs = await AuditLog.find({ team: req.query.teamId })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("actor", "username phone");

  return res.status(200).json({
    success: true,
    data: logs,
  });
});
