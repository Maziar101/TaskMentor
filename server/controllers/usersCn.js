import Users from "../models/User.js";
import catchAsync from "../utils/catchAsync.js";
import getToken from "../utils/getToken.js";
import HandleError from "../utils/HandleError.js";

export const getAllUsers = catchAsync(async (req, res, next) => {
  const { id: userId } = req.query;
  const { role, id } = getToken(req, next);
  if (id) {
    if (role !== "owner" || userId !== id) {
      return next(
        new HandleError("you dont have permission to do this action", 403)
      );
    }
    const user = await Users.findById(userId);
    if (!user) return next(new HandleError("user not found !", 404));
    return res.status(200).json({
      success: true,
      data: user,
    });
  }
  if (role !== "owner") {
    return next(
      new HandleError("you dont have permission to do this action", 403)
    );
  }
  const users = await Users.find().sort({ createdAt: -1 });
  return res.status(200).json({
    success: true,
    data: users,
  });
});

export const createUser = catchAsync(async (req, res, next) => {
  const {
    username,
    phone,
    age,
    gender,
    workField,
    subscription,
    permissions,
    role,
  } = req.body;
  if (!username || !phone) {
    return next(new HandleError("username and phone are required", 400));
  }

  const userExist = await Users.exists({ username });
  if (userExist) {
    return next(new HandleError("username already exist", 400));
  }

  const user = await Users.create({
    phone: phone.trim(),
    username: username.trim(),
    age,
    gender,
    workField,
    subscription,
    role,
    permissions: permissions,
  });

  return res.status(201).json({
    success: true,
    data: user,
  });
});

export const updateUser = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  const updates = {};

  if (token.id !== req.query.id || token.role !== "owner") {
    return next(
      new HandleError("you dont have permission to this action", 403)
    );
  }

  if (typeof req.body.age !== "undefined") updates.age = req.body.age;

  ["username", "phone", "gender", "workField", "subscription"].forEach(
    (field) => {
      if (typeof req.body[field] === "string")
        updates[field] = req.body[field].trim();
    }
  );

  const user = await Users.findByIdAndUpdate(req.query.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) return next(new HandleError("user not found", 404));
  return res.status(200).json({
    success: true,
    data: user,
  });
});

export const deleteUser = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);
  if (!req.query.id) {
    return next(new HandleError("user id is required", 400));
  }
  if (req.query.id !== token.id || token.role !== "owner") {
    return next(
      new HandleError("you dont have permission to do this action", 403)
    );
  }
  const deleted = await Users.findByIdAndDelete(req.query.id);
  if (!deleted) {
    return next(new HandleError("user not found", 404));
  }
  return res.status(200).json({
    success: true,
    message: "user deleted !",
  });
});
