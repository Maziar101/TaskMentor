import mongoose from "mongoose";

const tagsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "userId is required"],
    },
    label: {
      type: String,
      required: [true, "label is required"],
    },
    color: {
      type: String,
    },
  },
  { timestamps: true },
);

const Tags = mongoose.model("tags", tagsSchema);
export default Tags;
