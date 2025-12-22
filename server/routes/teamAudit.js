const express = require("express");
const Team = require("../models/Team");
const AuditLog = require("../models/AuditLog");

const router = express.Router({ mergeParams: true });

router.get("/", async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "team not found" });
    if (team.owner.toString() !== userId) {
      return res.status(403).json({ message: "only owner can view audit log" });
    }

    const logs = await AuditLog.find({ team: teamId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("actor", "username phone");

    res.json(logs);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
