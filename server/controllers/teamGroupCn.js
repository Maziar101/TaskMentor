import Group from "../models/Group.js";
import GroupMessage from "../models/GroupMessage.js";
import Team from "../models/Team.js";
import catchAsync from "../utils/catchAsync.js";
import getToken from "../utils/getToken.js";
import HandleError from "../utils/HandleError.js";

const DEFAULT_GROUP_NAME = "عمومی";

function getMember(team, userId) {
  return team.members.find((member) => member.user.toString() === userId);
}

function isDefaultGroupName(name) {
  return name?.trim() === DEFAULT_GROUP_NAME;
}

async function ensureGeneralGroup(teamId, userId) {
  let group = await Group.findOne({ team: teamId, name: DEFAULT_GROUP_NAME });
  if (!group) {
    group = await Group.create({
      team: teamId,
      name: DEFAULT_GROUP_NAME,
      isPublic: true,
      createdBy: userId,
      members: [],
    });
  } else if (!group.isPublic) {
    group.isPublic = true;
    group.members = [];
    await group.save();
  }
  return group;
}

async function ensureGroupAccess(teamId, groupId, userId) {
  const group = await Group.findOne({ _id: groupId, team: teamId });
  if (!group) return null;
  if (group.isPublic) return group;
  if (group.createdBy.toString() === userId) return group;
  const member = group.members.some((item) => item.toString() === userId);
  return member ? group : null;
}

export const getTeamGroup = catchAsync(async (req, res, next) => {
  const { teamId } = req.query;
  const token = getToken(req, next);
  const team = await Team.findById(teamId);
  if (!team) return next(new HandleError("team not found", 404));

  const member = getMember(team, token.id);
  if (!member) return next(new HandleError("not a team member", 403));

  const generalGroup = await ensureGeneralGroup(teamId);
  let groups = await Group.find({ team: teamId }).sort({ createdAt: -1 });

  const filteredGroups = groups.filter(
    (group) =>
      group.isPublic ||
      group.members.some((memberId) => memberId.toString() === token?.id)
  );

  const generalId = generalGroup?._id?.toString();
  let orderedGroups = generalId
    ? [
        ...filteredGroups.filter((group) => group._id.toString() === generalId),
        ...filteredGroups.filter((group) => group._id.toString() !== generalId),
      ]
    : filteredGroups;

  return res.status(200).json({
    success: true,
    data: orderedGroups,
  });
});

export const createTeamGroup = catchAsync(async (req, res, next) => {
  const { teamId } = req.query;
  const token = getToken(req, next);
  const { userId, name, memberIds, isPublic } = req.body;
  if (!userId || !name) {
    return res.status(400).json({ message: "userId and name are required" });
  }
  const team = await Team.findById(teamId);
  if (!team) return next(new HandleError("team not found", 404));
  const member = getMember(team, token?.id);
  if (!member || member.status === "disabled") {
    return HandleError("Not Allowed", 403);
  }

  const trimmedName = name.trim();

  if (isDefaultGroupName(trimmedName)) {
    const generalGroup = await ensureGeneralGroup(teamId, token?.id);
    return res.status(200).json({
      success: true,
      data: generalGroup,
    });
  }

  const normalizedMembers = Array.from(memberIds) ? memberIds : [];
  const allowedMembers = team.members
    ?.map((m) => m.user.toString())
    .filter((id) => normalizedMembers.includes(id));
  const mergedMembers = Array.from(new Set([userId, ...allowedMembers]));

  const group = await Group.create({
    team: teamId,
    name: trimmedName,
    isPublic: Boolean(isPublic),
    members: isPublic ? [] : mergedMembers,
  });

  return res.status(201).json({
    success: true,
    data: group,
  });
});

export const getGroupMessaged = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const { teamId, groupId, beforeMessageId, limit } = req.query;

  const team = await Team.findById(teamId);
  if (!team) return next(new HandleError("team Not Found", 404));

  const member = getMember(team, token?.id?.toString());
  if (!member) return next(new HandleError("not a team member", 403));

  const group = await ensureGroupAccess(teamId, groupId, token?.id);
  if (!group) return next(new HandleError("no access to group", 403));

  const query = { group: groupId };
  if (beforeMessageId) {
    query._id = { $lt: beforeMessageId };
  }
  const pageSize = Math.min(+limit || 30, 100);
  const messages = await GroupMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(pageSize)
    .populate("sender", "username phone")
    .lean();

  return res.status(200).json({ success: true, data: messages.reverse() });
});

export const sendMessageInGroup = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const { groupId, teamId } = req.query;
  const { userId, type, text, fileUrl, fileName, taskId, replyTo } = req.body;

  const team = await Team.findById(teamId);
  if (!team) return next(new HandleError("team not Found", 404));

  const member = getMember(team, token?.id);

  if (!member || member.status === "disabled") {
    return next(new HandleError("not allowed", 403));
  }

  const group = await ensureGroupAccess(teamId, groupId, token?.id);
  if (!group) return next(new HandleError("no access to group", 403));

  const generalGroup = await ensureGeneralGroup(teamId, token?.id);

  const payload = {
    group: groupId,
    sender: token?.id,
    type: type || "text",
    text: text?.trim(),
    fileUrl: fileUrl?.trim(),
    taskId: taskId?.trim(),
    replyTo: replyTo || null,
  };

  if (payload.type === "text" && !payload.text) {
    return res.status(400).json({ message: "text is required" });
  }
  if (payload.type === "file" && !payload.fileUrl) {
    return res.status(400).json({ message: "fileUrl is required" });
  }
  if (payload.type === "task_link" && !payload.taskId) {
    return res.status(400).json({ message: "taskId is required" });
  }

  const message = await GroupMessage.create(payload);
  const populated = await message.populate("sender", "username phone");

  const io = req.app.get("io");
  if (io) {
    io.to(`group:${groupId}`).emit("group.message.created", {
      groupId,
      message: populated,
    });
  }

  if (generalGroup && generalGroup._id !== groupId) {
    const generalMessage = await GroupMessage.create({
      ...payload,
      group: generalGroup?._id,
      replyTo: null,
      originGroup: groupId,
      originMessage: message._id,
    });
    const populatedGeneral = await generalMessage.populate(
      "sender",
      "username phone"
    );
    if (io) {
      io.to(`group:${generalGroup._id}`).emit("group.message.updated", {
        groupId: generalGroup._id,
        message: populatedGeneral,
      });
    }
  }
  return res.status(200).json({
    success: true,
    data: populated,
  });
});

export const deleteMessageFromGroup = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const { teamId, groupId, messageId } = req.query;

  const team = await Team.findById(teamId);
  if (!team) return next(new HandleError("team not found", 404));

  const member = await getMember(team, token?.id);
  if (!member || member.status === "disabled") {
    return next(new HandleError("not allowed", 403));
  }

  const group = await ensureGeneralAccess(teamId, groupId, token.id);
  if (!group) return next(new HandleError("no access to group", 403));

  const message = await GroupMessage.findOne({
    _id: messageId,
    group: groupId,
  });

  const isOwner = team.owner === token.id;
  if (message.sender !== token.id && !isOwner) {
    return next(
      new HandleError("only sender or owner can delete message !", 403)
    );
  }
  await message.deleteOne();

  const io = req.app.get("io");

  if (io) {
    io.to(`group:${groupId}`).emit("group.message.deleted", {
      groupId,
      messageId,
    });
  }

  const generalGroup = await ensureGeneralGroup(teamId, token.id);
  if (generalGroup && generalGroup._id.toString() !== groupId) {
    const generalCopy = await GroupMessage.findOneAndDelete({
      group: generalGroup._id,
      originMessage: messageId,
    });
    if (generalCopy && io) {
      io.to(`group:${generalGroup._id}`).emit("group.message.deleted", {
        groupId: generalGroup._id.toString(),
        messageId: generalCopy._id.toString(),
      });
    }
  }

  return res.status(200).json({
    success: true,
    message: "Message Deleted",
  });
});

export const deleteGroup = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const { teamId, groupId } = req.query;

  const team = await Team.findById(teamId);
  if (!team) return next(new HandleError("team not found", 404));

  const member = getMember(team, token.id);
  if (!member || member.status === "disabled") {
    return next(new HandleError("not allowed", 403));
  }

  const group = await Group.findOne({ _id: groupId, team: teamId });
  if (!group) return next(new HandleError("group not found"));

  if (isDefaultGroupName(group.name)) {
    return next(new HandleError("default group cannot be deleted", 403));
  }

  const isOwner = team.owner === token.id;
  const isCreator = group.createdBy === token.id;

  if (!isOwner && !isCreator) {
    return next(new HandleError("only owner or creator can delete", 403));
  }

  await GroupMessage.deleteMany({ group: groupId });
  await group.deleteOne();

  return res.status(200).json({
    success: true,
    message: "group deleted",
  });
});
