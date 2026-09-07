import express from "express";
import { addNote, deleteNote, getAllNotes, updateNote } from "./notes.controller.js";

const notesRoutes = express.Router();

notesRoutes.route("/").get(getAllNotes).post(addNote).patch(updateNote).delete(deleteNote);

export default notesRoutes;
