import express from "express";
import {
  createUser,
  deleteUser,
  getAllUsers,
  updateUser,
} from "../controllers/usersCn.js";

const usersRoutes = express.Router();

usersRoutes
  .route("/")
  .get(getAllUsers)
  .post(createUser)
  .patch(updateUser)
  .delete(deleteUser);


export default usersRoutes;