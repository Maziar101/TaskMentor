const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    const username = req.body.username?.trim();
    const phone = req.body.phone?.trim();
    if (!username || !phone) {
      return res.status(400).json({ message: "username and phone are required" });
    }
    const user = await User.findOne({ username, phone });
    if (!user) {
      return res.status(401).json({ message: "اطلاعات ورود نادرست است" });
    }
    res.json({
      userId: user.id,
      username: user.username,
      subscription: user.subscription,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
