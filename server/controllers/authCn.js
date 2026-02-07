import Users from "../models/User.js";
import catchAsync from "../utils/catchAsync.js";
import HandleError from "../utils/HandleError.js";

const MAGIC_CODE = "000000";

export const login = catchAsync(async (req, res, next) => {
  const phone = req.body.phone?.trim();
  const phoneRegex = /^09[0-9]{9}$/;

  if (!phone) {
    return res.status(400).json({ message: "phone is required" });
  }

  if (!phoneRegex.test(phone)) {
    return next(new HandleError("شماره موبایل وارد شده معتبر نیست !", 400));
  }
  
  const user = await Users.findOne({ phone });
  res.json({
    success: true,
    step: "code",
    message: "کد ارسال شد",
    newUser: !user,
  });
});

export const verify = catchAsync(async (req, res, next) => {
  const phone = req.body.phone?.trim();
  const code = req.body.code?.trim();
  const name = req.body.name?.trim();
  if (!phone || !code) {
    return res.status(400).json({ message: "phone و code اجباری هستند" });
  }
  let user = await Users.findOne({ phone });
  if (!user) {
    if (!name) {
      return res
        .status(400)
        .json({ message: "برای ثبت‌نام نام خود را وارد کنید" });
    }
    user = await Users.create({ phone, username: name });
  }
  if (code !== MAGIC_CODE) {
    return res.status(401).json({ message: "کد نادرست است" });
  }
  const token = jwt.sign(
    { phone, id: user?.id, subscription: user?.subscription, role: user?.role },
    process.env.JWT_SECRET
  );
  return res.json({
    token,
  });
});
