import mongoose from "mongoose";

const notesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "userId is Required"],
    },
    title: {
      type: String,
    },
    note: {
      type: String,
    },
    bgcolor: {
      type: String,
    },
    textColor: {
      type: String,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Number,
    },
    tags: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "tags",
    },
  },
  { timestamps: true },
);

const Notes = mongoose.model("notes", notesSchema);
export default Notes;
