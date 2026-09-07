import express from "express";
import { addNewTag, deleteTag, getAllTags } from "./tags.controller.js";

const tagsRoutes = express.Router();

tagsRoutes.route("/").get(getAllTags).post(addNewTag).delete(deleteTag);

export default tagsRoutes;
