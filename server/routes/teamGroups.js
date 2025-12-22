const express = require("express");
const Team = require("../models/Team");
const Group = require("../models/Group");
const GroupMessage = require("../models/GroupMessage");

const router = express.Router({ mergeParams: true });

function getMember(team, userId) {
  return team.members.find((member) => member.user.toString() === userId);
}

async function ensureGroupAccess(teamId, groupId, userId) {
  const group = await Group.findOne({ _id: groupId, team: teamId });
  if (!group) return null;
  if (group.isPublic) return group;
  if (group.createdBy.toString() === userId) return group;
  const member = group.members.some((item) => item.toString() === userId);
  return member ? group : null;
}

router.get("/", async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "team not found" });
    const member = getMember(team, userId.toString());
    if (!member) return res.status(403).json({ message: "not a team member" });

    let groups = await Group.find({ team: teamId }).sort({ createdAt: -1 }).lean();
    if (groups.length === 0) {
      const fallback = await Group.create({
        team: teamId,
        name: "عمومی",
        isPublic: true,
        createdBy: userId,
        members: [],
      });
      groups = [fallback.toObject()];
    }
    const filteredGroups = groups.filter(
      (group) =>
        group.isPublic || group.members?.some((memberId) => memberId.toString() === userId)
    );
    res.json(filteredGroups);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId, name, memberIds, isPublic } = req.body;
    if (!userId || !name) {
      return res.status(400).json({ message: "userId and name are required" });
    }
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "team not found" });
    const member = getMember(team, userId);
    if (!member || member.status === "disabled") {
      return res.status(403).json({ message: "not allowed" });
    }

    const normalizedMembers = Array.isArray(memberIds) ? memberIds : [];
    const allowedMembers = team.members
      .map((m) => m.user.toString())
      .filter((id) => normalizedMembers.includes(id));
    const mergedMembers = Array.from(new Set([userId, ...allowedMembers]));

    const group = await Group.create({
      team: teamId,
      name: name.trim(),
      isPublic: Boolean(isPublic),
      createdBy: userId,
      members: isPublic ? [] : mergedMembers,
    });
    res.status(201).json(group);
  } catch (err) {
    next(err);
  }
});

router.get("/:groupId/messages", async (req, res, next) => {
  try {
    const { teamId, groupId } = req.params;
    const { userId, beforeMessageId, limit } = req.query;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "team not found" });
    const member = getMember(team, userId.toString());
    if (!member) return res.status(403).json({ message: "not a team member" });

    const group = await ensureGroupAccess(teamId, groupId, userId.toString());
    if (!group) return res.status(403).json({ message: "no access to group" });

    const query = { group: groupId };
    if (beforeMessageId) {
      query._id = { $lt: beforeMessageId };
    }
    const pageSize = Math.min(Number(limit) || 30, 100);
    const messages = await GroupMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .populate("sender", "username phone")
      .lean();

    res.json({ messages: messages.reverse() });
  } catch (err) {
    next(err);
  }
});

router.post("/:groupId/messages", async (req, res, next) => {
  try {
    const { teamId, groupId } = req.params;
    const { userId, type, text, fileUrl, fileName, taskId, replyTo } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "team not found" });
    const member = getMember(team, userId.toString());
    if (!member || member.status === "disabled") {
      return res.status(403).json({ message: "not allowed" });
    }

    const group = await ensureGroupAccess(teamId, groupId, userId.toString());
    if (!group) return res.status(403).json({ message: "no access to group" });

    const payload = {
      group: groupId,
      sender: userId,
      type: type || "text",
      text: text?.trim(),
      fileUrl: fileUrl?.trim(),
      fileName: fileName?.trim(),
      taskId: taskId?.trim(),
      replyTo: replyTo || undefined,
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

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

router.patch("/:groupId/messages/:messageId", async (req, res, next) => {
  try {
    const { teamId, groupId, messageId } = req.params;
    const { userId, text } = req.body;
    if (!userId || !text) {
      return res.status(400).json({ message: "userId and text are required" });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "team not found" });
    const member = getMember(team, userId.toString());
    if (!member || member.status === "disabled") {
      return res.status(403).json({ message: "not allowed" });
    }

    const group = await ensureGroupAccess(teamId, groupId, userId.toString());
    if (!group) return res.status(403).json({ message: "no access to group" });

    const message = await GroupMessage.findOne({ _id: messageId, group: groupId });
    if (!message) return res.status(404).json({ message: "message not found" });
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: "only sender can edit" });
    }
    message.text = text.trim();
    message.editedAt = new Date();
    await message.save();

    const populated = await message.populate("sender", "username phone");
    const io = req.app.get("io");
    if (io) {
      io.to(`group:${groupId}`).emit("group.message.updated", {
        groupId,
        message: populated,
      });
    }
    res.json(populated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:groupId/messages/:messageId", async (req, res, next) => {
  try {
    const { teamId, groupId, messageId } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "team not found" });
    const member = getMember(team, userId.toString());
    if (!member || member.status === "disabled") {
      return res.status(403).json({ message: "not allowed" });
    }

    const group = await ensureGroupAccess(teamId, groupId, userId.toString());
    if (!group) return res.status(403).json({ message: "no access to group" });

    const message = await GroupMessage.findOne({ _id: messageId, group: groupId });
    if (!message) return res.status(404).json({ message: "message not found" });
    const isOwner = team.owner.toString() === userId;
    if (message.sender.toString() !== userId && !isOwner) {
      return res.status(403).json({ message: "only sender or owner can delete" });
    }
    await message.deleteOne();

    const io = req.app.get("io");
    if (io) {
      io.to(`group:${groupId}`).emit("group.message.deleted", {
        groupId,
        messageId,
      });
    }

    res.json({ message: "deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
