const express = require("express");
const bcryptjs = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();
const MAGIC_CODE = "000000";

// Step 1: request login/register with phone
router.post("/login", async (req, res, next) => {
  try {
    const phone = req.body.phone?.trim();
    if (!phone) {
      return res.status(400).json({ message: "phone is required" });
    }
    const user = await User.findOne({ phone });
    res.json({
      step: "code",
      message: "کد ارسال شد",
      magicHint: MAGIC_CODE,
      newUser: !user,
    });
  } catch (err) {
    next(err);
  }
});

// Step 2: verify magic code (and create user if new)
router.post("/verify", async (req, res, next) => {
  try {
    const phone = req.body.phone?.trim();
    const code = req.body.code?.trim();
    const name = req.body.name?.trim();
    if (!phone || !code) {
      return res.status(400).json({ message: "phone و code اجباری هستند" });
    }
    let user = await User.findOne({ phone });
    if (!user) {
      if (!name) {
        return res.status(400).json({ message: "برای ثبت‌نام نام را وارد کنید" });
      }
      user = await User.create({ phone, username: name });
    }
    if (code !== MAGIC_CODE) {
      return res.status(401).json({ message: "کد نادرست است" });
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
