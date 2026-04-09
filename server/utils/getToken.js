import Users from "../models/User.js";
import HandleError from "./HandleError.js";
import jwt from "jsonwebtoken";

const getToken = async (req, next) => {
  try {
    const token = req.headers.authorization.split(" ");
    if (!token) {
      return next(new HandleError("token is not provided", 401));
    }
    if (token.length !== 2 || token[0]?.toLowerCase() !== "bearer") {
      return next(new HandleError("فرمت Authorization نامعتبر است", 401));
    }
    const validateToken = jwt.verify(token[1], process.env.JWT_SECRET);
    const user = await Users.findById(validateToken?.id);
    if (!user) {
      return next(new HandleError("دوباره وارد شوید", 401));
    }
    return validateToken;
  } catch (err) {
    return next(new HandleError("Token Is Expired !", 401));
  }
};

export default getToken;
