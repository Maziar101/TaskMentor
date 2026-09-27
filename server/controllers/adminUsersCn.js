import Users from "../models/User.js";
import catchAsync from "../utils/catchAsync.js";

export const getAdminUsers = catchAsync(async (_req, res) => {
  const users = await Users.find()
    .select("username phone avatarUrl role subscription createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json({
    success: true,
    data: users,
  });
});
