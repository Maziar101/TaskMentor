import { useState } from "react";
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import { Avatar, Box, Typography } from "@mui/material";

export const GROUP_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export default function GroupImageDropzone({ imagePreview, onFileSelect }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.types.includes("Files")) setDragActive(true);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!event.currentTarget.contains(event.relatedTarget)) setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  };

  const handleInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) onFileSelect(file);
    event.target.value = "";
  };

  return (
    <>
      <Box
        component="label"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-label="انتخاب یا رها کردن تصویر گروه"
        sx={{ position: "relative", cursor: "pointer" }}
      >
        <Avatar
          src={imagePreview || undefined}
          sx={{
            width: 96,
            height: 96,
            border: "2px dashed",
            borderColor: dragActive ? "var(--tm-accent)" : "var(--tm-accent-border)",
            bgcolor: dragActive ? "var(--tm-accent-soft)" : "var(--tm-accent-tint)",
            color: "var(--tm-accent)",
            boxShadow: dragActive
              ? "0 0 0 6px var(--tm-accent-tint), 0 16px 34px rgba(0, 0, 0, 0.38)"
              : "0 12px 28px rgba(0, 0, 0, 0.3)",
            transform: dragActive ? "scale(1.05)" : "scale(1)",
            transition:
              "border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
          }}
        >
          <AddPhotoAlternateRoundedIcon sx={{ fontSize: 34 }} />
        </Avatar>
        <Box
          component="input"
          type="file"
          accept={GROUP_IMAGE_MIME_TYPES.join(",")}
          onChange={handleInputChange}
          sx={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        />
      </Box>
      <Typography sx={{ color: "var(--tm-text-muted)", fontSize: "0.76rem", textAlign: "center" }}>
        تصویر گروه اختیاری است؛ کلیک کنید یا تصویر را بکشید و رها کنید
      </Typography>
    </>
  );
}
