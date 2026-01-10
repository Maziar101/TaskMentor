import HandleError from "./HandleError.js";
import jwt from "jsonwebtoken";

const getToken = (req, next) => {
  try {
    const token = req.headers.authorization.split(" ")[0];
    if (!token) {
      return next(new HandleError("token is not provided", 401));
    }
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      return next(new HandleError("فرمت Authorization نامعتبر است", 401));
    }
    const validateToken = jwt.verify(token, process.env.JWT_SECRET);
    return (token = validateToken);
  } catch (err) {
    return next(new HandleError("Token Is Expired !", 401));
  }
};

export default getToken;
