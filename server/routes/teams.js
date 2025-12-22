const express = require("express");
const Team = require("../models/Team");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Group = require("../models/Group");

const router = express.Router();

async function ensureUser(userId) {
  if (!userId) return false;
  return Boolean(await User.exists({ _id: userId }));
}

router.get("/", async (req, res, next) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const userExists = await ensureUser(userId);
    if (!userExists) return res.status(404).json({ message: "user not found" });

    const teams = await Team.find({
      $or: [{ owner: userId }, { "members.user": userId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(teams);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, userId } = req.body;
    if (!name || !userId) {
      return res.status(400).json({ message: "name and userId are required" });
    }
    const userExists = await ensureUser(userId);
    if (!userExists) return res.status(404).json({ message: "user not found" });
    const team = await Team.create({
      name: name.trim(),
      owner: userId,
      members: [{ user: userId, role: "owner", status: "active" }],
    });
    await Group.create({
      team: team.id,
      name: "عمومی",
      isPublic: true,
      createdBy: userId,
      members: [],
    });
    res.status(201).json(team);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/invite", async (req, res, next) => {
  try {
    const { userId, phone, role, nickname } = req.body;
    if (!userId || !phone) {
      return res.status(400).json({ message: "userId and phone are required" });
    }
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "team not found" });
    if (team.owner.toString() !== userId) {
      return res.status(403).json({ message: "only owner can invite" });
    }
    const target = await User.findOne({ phone: phone.trim() });
    if (!target) return res.status(404).json({ message: "invitee not found" });
    const alreadyMember = team.members.some((m) => m.user.toString() === target.id);
    const alreadyInvited = team.invites.some((i) => i.user.toString() === target.id && i.status === "pending");
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
      data: { teamId: team.id, teamName: team.name, role: role || "member", nickname: nickname || "" },
    });
    res.status(200).json({ message: "invite sent" });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/accept", async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "team not found" });
    const invite = team.invites.find((i) => i.user.toString() === userId && i.status === "pending");
    if (!invite) {
      return res.status(404).json({ message: "invite not found" });
    }
    const alreadyMember = team.members.some((m) => m.user.toString() === userId);
    if (alreadyMember) {
      invite.status = "accepted";
      team.invites = team.invites.filter((i) => i.user.toString() !== userId);
      await team.save();
      return res.json({ message: "already joined" });
    }
    team.members.push({
      user: userId,
      role: invite.role || "member",
      nickname: invite.nickname,
    });
    invite.status = "accepted";
    team.invites = team.invites.filter((i) => i.user.toString() !== userId);
    await team.save();
    res.json(team);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
