import Users from "../models/User.js";
import HandleError from "../utils/HandleError.js";
import jwt from "jsonwebtoken";

export const protect = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return next(new HandleError("برای ادامه وارد شوید", 401));
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Users.findById(payload.id).select("-__v");

    if (!user) {
      return next(new HandleError("کاربر پیدا نشد. دوباره وارد شوید", 401));
    }

    req.user = user;
    return next();
  } catch {
    return next(new HandleError("نشست شما منقضی شده است", 401));
  }
};
