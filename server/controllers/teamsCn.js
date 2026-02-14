import catchAsync from "../utils/catchAsync.js";
import Team from "../models/Team.js";
import getToken from "../utils/getToken.js";
import HandleError from "../utils/HandleError.js";
import Group from "../models/Group.js";
import Users from "../models/User.js";
import Notification from "../models/Notification.js";

export const getAllTeams = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);

  const teams = await Team.find({
    $or: [{ owner: token.id }, { "members.user": token.id }],
  })
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({
    success: true,
    data: teams,
  });
});

export const createTeam = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const { name } = req.body;
  if (!name) return next(new HandleError("user not found", 404));

  const team = await Team.create({
    name: name.trim(),
    owner: token.id,
    members: [{ user: token.id, role: "owner", status: "active" }],
  });

  await Group.create({
    team: team.id,
    name: "عمومی",
    isPublic: true,
    createdBy: token.id,
    members: [],
  });

  return res.status(201).json({
    success: true,
    data: team,
  });
});

export const inviteMember = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const { phone, role, nickname } = req.body;
  if (!phone) return next(new HandleError("phone is required", 400));

  const team = await Team.findById(token.id);
  if (!team) return next(new HandleError("team not found", 404));

  if (team.owner !== token.id) {
    return next(new HandleError("only owner can invite", 403));
  }

  const target = await Users.findOne({ phone: phone.trim() });

  if (!target) return next(new HandleError("invited user not found", 404));

  const alreadyMember = team.members.some((m) => m.user === target.id);
  const alreadyInvited = team.invites.some(
    (i) => i.user === target.id && i.status === "pending"
  );

  if (alreadyMember) {
    return res.status(409).json({ message: "user already in team" });
  }
  if (alreadyInvited) {
    return res.status(409).json({ message: "invite already pending" });
  }

  team.invites.push({
    user: target.id,
    role: role?.trim() || "member",
    nickname: nickname?.trim(),
    status: "pending",
  });

  await team.save();
  await Notification.create({
    user: target.id,
    type: "team_invite",
    title: "دعوت به تیم",
    body: `به تیم ${team.name} دعوت شدی`,
    data: {
      teamId: team.id,
      teamName: team.name,
      role: role || "member",
      nickname: nickname || "",
    },
  });

  return res.status(200).json({
    success: true,
    message: "invite sent",
  });
});

export const acceptInvite = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const { teamId } = req.query;

  const team = await Team.findById(teamId);
  if (!team) return next(new HandleError("team not found", 404));

  const invite = team.invites.find(
    (i) => i.user === token.id && i.status === "pending"
  );

  if (!invite) {
    return next(new HandleError("invite not found", 404));
  }

  const alreadyMember = team.members.some((m) => m.user === token.id);

  if (alreadyMember) {
    invite.status = "accepted";
    team.invites = team.invites.filter((i) => i.user !== token.id);
    await team.save();
    return res.status(200).json({
      success: true,
      message: "already joined",
    });
  }

  team.members.push({
    user: token.id,
    role: invite.role || "member",
    nickname: invite.nickname,
  });

  invite.status = "accepted";
  team.invites = team.invites.filter((i) => i.user !== token.id);
  await team.save();
  return res.status(200).json({
    success: true,
    data: team,
  });
});
