import Users from "../models/User.js";
import { ChatGroup } from "../modules/chat/chat.model.js";
import catchAsync from "../utils/catchAsync.js";

const USER_FIELDS = "username phone avatarUrl role subscription isActive createdAt";

function serializeUser(user) {
  return { ...user, isActive: user.isActive !== false };
}

export const getAdminDashboard = catchAsync(async (_req, res) => {
  const [users, groups] = await Promise.all([
    Users.find().select(USER_FIELDS).sort({ createdAt: -1 }).lean(),
    ChatGroup.find().select("createdAt").sort({ createdAt: -1 }).lean(),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      users: users.map(serializeUser),
      groups,
    },
  });
});
