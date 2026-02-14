import AuditLog from "../models/AuditLog.js";
import Team from "../models/Team.js";
import catchAsync from "../utils/catchAsync.js";
import getToken from "../utils/getToken.js";
import HandleError from "../utils/HandleError.js";

function getMember(team, userId) {
  return team.members.find((member) => member.user.toString() === userId);
}

function ensureOwner(team, userId) {
  return team.owner.toString() === userId;
}

export const getTeamMembers = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const { teamId } = req.query;
  const { role, status, search } = req.query;

  const team = Team.findById(teamId).populate("members.user", "username phone");
  if (!team) return next(new HandleError("team not found", 404));

  const member = getMember(team, token.id);
  if (!member) return next(new HandleError("not a team member", 403));

  let members = team.members.map((item) => ({
    user: item.user,
    role: item.role,
    nickname: item.nickname,
    status: item.status || "active",
    joinedAt: item.joinedAt,
  }));

  if (role) {
    members = members.filter((item) => item.role === role);
  }
  if (status) {
    members = members.filter((item) => item.status === status);
  }
  if (search) {
    const needle = search.trim().toLowerCase();
    members = members.filter((item) => {
      const username = item.user?.username?.toLowerCase() || "";
      const phone = item.user?.phone?.toLowerCase() || "";
      const nickname = item.nickname?.toLowerCase() || "";
      return (
        username.includes(needle) ||
        phone.includes(needle) ||
        nickname.includes(needle)
      );
    });
  }
  return res.status(200).json({
    success: true,
    data: { members, teamId: team.id, owner: team.owner },
  });
});

// This route is already writed in Teams Controller ; Named : inviteUser
// Old Code :
// export const addMemberToTeam = catchAsync(async (req, res, next) => {
//   const { teamId } = req.params;
//   const { userId, phone, role, nickname } = req.body;
//   if (!userId || !phone) {
//     return res.status(400).json({ message: "userId and phone are required" });
//   }
//   const team = await Team.findById(teamId);
//   if (!team) return res.status(404).json({ message: "team not found" });
//   if (!ensureOwner(team, userId)) {
//     return res.status(403).json({ message: "only owner can add members" });
//   }
//   const target = await User.findOne({ phone: phone.trim() });
//   if (!target) return res.status(404).json({ message: "user not found" });

//   const existing = getMember(team, target.id);
//   if (existing)
//     return res.status(409).json({ message: "user already in team" });

//   const memberPayload = {
//     user: target.id,
//     role: role?.trim() || "member",
//     nickname: nickname?.trim() || undefined,
//     status: "active",
//   };
//   team.members.push(memberPayload);
//   await team.save();

//   await AuditLog.create({
//     team: team.id,
//     actor: userId,
//     action: "member.add",
//     targetType: "member",
//     targetId: target.id,
//     before: null,
//     after: memberPayload,
//   });

//   await Notification.create({
//     user: target.id,
//     type: "member_status",
//     title: "افزوده شدید",
//     body: `به تیم ${team.name} اضافه شدید`,
//     data: { teamId: team.id, role: memberPayload.role },
//   });

//   res.status(201).json({ message: "member added" });
// });

// this route is unusefull too :
// router.patch("/:memberId", async (req, res, next) => {
// //   try {
// // const { teamId, memberId } = req.params;
// // const { userId, role, status, nickname } = req.body;
// // if (!userId) return res.status(400).json({ message: "userId is required" });
//
// // const team = await Team.findById(teamId);
// // if (!team) return res.status(404).json({ message: "team not found" });
// // if (!ensureOwner(team, userId)) {
// //   return res.status(403).json({ message: "only owner can update members" });
// // }
//
// // const member = getMember(team, memberId);
// // if (!member) return res.status(404).json({ message: "member not found" });
//
// // const before = {
// //   role: member.role,
// //   status: member.status,
// //   nickname: member.nickname,
// // };
// // if (role !== undefined) member.role = role.trim();
// // if (status !== undefined) member.status = status === "disabled" ? "disabled" : "active";
// // if (nickname !== undefined) member.nickname = nickname?.trim() || undefined;
//
// // await team.save();
//
// // await AuditLog.create({
// //   team: team.id,
// //   actor: userId,
// //   action: "member.update",
// //   targetType: "member",
// //   targetId: memberId,
// //   before,
// //   after: { role: member.role, status: member.status, nickname: member.nickname },
// // });
//
// // if (role !== undefined) {
// //   await Notification.create({
// // user: memberId,
// // type: "member_role",
// // title: "نقش شما تغییر کرد",
// // body: `نقش جدید: ${member.role}`,
// // data: { teamId: team.id, role: member.role },
// //   });
// // }
//
// // if (status !== undefined) {
// //   const io = req.app.get("io");
// //   if (io) {
// // io.to(`team:${teamId}`).emit("member.status.changed", {
// //   memberId,
// //   status: member.status === "disabled" ? "offline" : "online",
// // });
// //   }
// // }
//
// res.json({ message: "member updated" });
//   } catch (err) {
// next(err);
//   }
// });

export const deleteMemberFromGroup = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const { memberId, teamId } = req.query;

  const team = await Team.findById(teamId);
  if (!team) return next(new HandleError("team not found", 404));

  if (!ensureOwner(teamId, token.id)) {
    return next(
      new HandleError("only owner can remove members from group", 403)
    );
  }

  const member = getMember(team, memberId);
  if (!member) return next(new HandleError("member not found", 404));

  team.members = team.members.filter((item) => item.user !== memberId);
  await team.save();

  await AuditLog.create({
    team: team.id,
    actor: token.id,
    action: "member.remove",
    targetType: "member",
    targetId: memberId,
    before: {
      role: member.role,
      status: member.status,
      nickname: member.nickname,
    },
    after: null,
  });

  return res.status(200).json({
    success: true,
    message: "member removed from group",
  });
});
