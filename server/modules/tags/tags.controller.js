import catchAsync from "../../utils/catchAsync.js";
import getToken from "../../utils/getToken.js";
import HandleError from "../../utils/HandleError.js";
import Tags from "./tags.model.js";
import * as yup from "yup";

export const getAllTags = catchAsync(async (req, res, next) => {
  const token = getToken(req, next);

  const tags = await Tags.find({ userId: token?.id });

  return res.status(200).json({
    success: true,
    data: tags,
  });
});

// Continue With DELETE,PUT,ADD routes baby ;)

const validateAddTag = yup.object({
  label: yup.string().required("عنوان تگ الزامی میباشد"),
  color: yup.string(),
});

export const addNewTag = catchAsync(async (req, res, next) => {
  const token = await getToken(req, next);

  const body = await validateAddTag.validate(req.body, {
    stripUnknown: true,
    abortEarly: true,
  });

  const newTag = await Tags.create({ ...body, userId: token?.id });

  return res.status(200).json({
    success: true,
    message: "تگ با موفقیت اضافه شد",
    data: newTag,
  });
});

export const deleteTag = catchAsync(async (req, res, next) => {
  const token = await getToken(req, next);
  const { id } = req.query;

  const tag = await Tags.findOne({ _id: id, userId: token?.id });
  if (!tag) {
    return HandleError("tag is not defind", 400);
  }

  await Tags.findByIdAndDelete(id);

  return res.status(200).json({
    success: true,
    message: "تگ با موفقیت حذف شد",
  });
});
