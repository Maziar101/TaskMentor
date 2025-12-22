const express = require("express");
const Team = require("../models/Team");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const Notification = require("../models/Notification");

const router = express.Router({ mergeParams: true });

function getMember(team, userId) {
  return team.members.find((member) => member.user.toString() === userId);
}

function ensureOwner(team, userId) {
  return team.owner.toString() === userId;
}

router.get("/", async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId, role, status, search } = req.query;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const team = await Team.findById(teamId).populate("members.user", "username phone");
    if (!team) return res.status(404).json({ message: "team not found" });

    const member = getMember(team, userId.toString());
    if (!member) return res.status(403).json({ message: "not a team member" });

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
      const needle = search.toString().trim().toLowerCase();
      members = members.filter((item) => {
        const username = item.user?.username?.toLowerCase() || "";
        const phone = item.user?.phone?.toLowerCase() || "";
        const nickname = item.nickname?.toLowerCase() || "";
        return username.includes(needle) || phone.includes(needle) || nickname.includes(needle);
      });
    }

    res.json({ members, teamId: team.id, owner: team.owner });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId, phone, role, nickname } = req.body;
    if (!userId || !phone) {
      return res.status(400).json({ message: "userId and phone are required" });
    }
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "team not found" });
    if (!ensureOwner(team, userId)) {
      return res.status(403).json({ message: "only owner can add members" });
    }
    const target = await User.findOne({ phone: phone.trim() });
    if (!target) return res.status(404).json({ message: "user not found" });

    const existing = getMember(team, target.id);
    if (existing) return res.status(409).json({ message: "user already in team" });

    const memberPayload = {
      user: target.id,
      role: role?.trim() || "member",
      nickname: nickname?.trim() || undefined,
      status: "active",
    };
    team.members.push(memberPayload);
    await team.save();

    await AuditLog.create({
      team: team.id,
      actor: userId,
      action: "member.add",
      targetType: "member",
      targetId: target.id,
      before: null,
      after: memberPayload,
    });

    await Notification.create({
      user: target.id,
      type: "member_status",
      title: "افزوده شدید",
      body: `به تیم ${team.name} اضافه شدید`,
      data: { teamId: team.id, role: memberPayload.role },
    });

    res.status(201).json({ message: "member added" });
  } catch (err) {
    next(err);
  }
});

router.patch("/:memberId", async (req, res, next) => {
  try {
    const { teamId, memberId } = req.params;
    const { userId, role, status, nickname } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "team not found" });
    if (!ensureOwner(team, userId)) {
      return res.status(403).json({ message: "only owner can update members" });
    }

    const member = getMember(team, memberId);
    if (!member) return res.status(404).json({ message: "member not found" });

    const before = {
      role: member.role,
      status: member.status,
      nickname: member.nickname,
    };
    if (role !== undefined) member.role = role.trim();
    if (status !== undefined) member.status = status === "disabled" ? "disabled" : "active";
    if (nickname !== undefined) member.nickname = nickname?.trim() || undefined;

    await team.save();

    await AuditLog.create({
      team: team.id,
      actor: userId,
      action: "member.update",
      targetType: "member",
      targetId: memberId,
      before,
      after: { role: member.role, status: member.status, nickname: member.nickname },
    });

    if (role !== undefined) {
      await Notification.create({
        user: memberId,
        type: "member_role",
        title: "نقش شما تغییر کرد",
        body: `نقش جدید: ${member.role}`,
        data: { teamId: team.id, role: member.role },
      });
    }

    if (status !== undefined) {
      const io = req.app.get("io");
      if (io) {
        io.to(`team:${teamId}`).emit("member.status.changed", {
          memberId,
          status: member.status === "disabled" ? "offline" : "online",
        });
      }
    }

    res.json({ message: "member updated" });
  } catch (err) {
    next(err);
  }
});

router.delete("/:memberId", async (req, res, next) => {
  try {
    const { teamId, memberId } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "team not found" });
    if (!ensureOwner(team, userId)) {
      return res.status(403).json({ message: "only owner can remove members" });
    }

    const member = getMember(team, memberId);
    if (!member) return res.status(404).json({ message: "member not found" });

    team.members = team.members.filter((item) => item.user.toString() !== memberId);
    await team.save();

    await AuditLog.create({
      team: team.id,
      actor: userId,
      action: "member.remove",
      targetType: "member",
      targetId: memberId,
      before: { role: member.role, status: member.status, nickname: member.nickname },
      after: null,
    });

    res.json({ message: "member removed" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
