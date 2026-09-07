import catchAsync from "../../utils/catchAsync.js";
import Notes from "./notes.model.js";
import Tags from "../tags/tags.model.js";
import getToken from "../../utils/getToken.js";
import * as yup from "yup";
import HandleError from "../../utils/HandleError.js";

export const getAllNotes = catchAsync(async (req, res, next) => {
  const token = await getToken(req, next);

  const notes = await Notes.find({ userId: token?.id })
    .populate("tags")
    .sort({ createdAt: -1 });
  const tags = await Tags.find({ userId: token?.id }).sort({ createdAt: -1 });

  return res.status(200).json({
    success: true,
    data: { notes: notes || [], tags: tags || [] },
  });
});

const validateNote = yup.object({
  title: yup.string(),
  note: yup.string(),
  bgcolor: yup.string(),
  date: yup.number(),
  tags: yup.array(),
  textColor: yup.string(),
  isPinned: yup.boolean(),
});

const normalizeNote = (note) => ({
  ...note,
  tags: note.tags?.map((tag) => tag?._id || tag),
});

export const addNote = catchAsync(async (req, res, next) => {
  const token = await getToken(req, next);
  const newNote = await validateNote.validate(req.body, {
    abortEarly: true,
    stripUnknown: true,
  });

  const note = await Notes.create({ ...normalizeNote(newNote), userId: token?.id });

  return res.status(200).json({
    success: true,
    message: "یادداشت اضافه شد",
    note,
  });
});

export const updateNote = catchAsync(async (req, res, next) => {
  const { id } = req.query;
  const token = await getToken(req, next);
  const body = await validateNote.validate(req.body, {
    stripUnknown: true,
    abortEarly: true,
  });
  if (!id) {
    return next(new HandleError("error", "آیدی یادداشت وارد نشده !"));
  }
  const note = await Notes.findOne({ userId: token?.id, _id: id });
  if (!note) {
    return next(new HandleError("error", "یادداشتی با این آیدی یافت نشد"));
  }
  const updatedNote = await Notes.findByIdAndUpdate(note?._id, normalizeNote(body), {
    new: true,
    runValidators: true,
  });
  return res.status(200).json({
    success: true,
    message: "یادداشت با موفقیت آپدیت شد",
  });
});

export const deleteNote = catchAsync(async (req, res, next) => {
  const token = await getToken(req, next);
  const { id } = req.query;

  const userNote = await Notes.findOne({ userId: token?.id, _id: id });

  if (!userNote) {
    return HandleError(
      next(new HandleError("یادداشتی با این آیدی یافت نشد", "error")),
    );
  }

  await Notes.findOneAndDelete({ userId: token?.id, _id: id });

  return res.status(200).json({
    success: true,
    message: "یادداشت با موفقیت حذف شد.",
  });
});
