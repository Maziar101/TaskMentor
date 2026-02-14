import { Stack, TextField, Typography, InputAdornment } from "@mui/material";
import React from "react";

type props = {
  place: string;
  name: string;
  error: string;
  touched: any;
  handleBlur: any;
  type: string;
  handleChange: any;
  value: any;
  onClick: any;
  sx: any;
  onInput: any;
  readOnly: boolean;
  children: any;
  start: any;
  end: any;
  maxLength: any;
};

const CustomField = ({
  place,
  name,
  error,
  touched,
  handleBlur,
  type = "text",
  handleChange,
  value,
  onClick,
  sx = {},
  onInput,
  readOnly = false,
  children,
  start,
  end,
  maxLength,
  ...props
}: props) => {
  return (
    <Stack gap={1} sx={{ width: "100%", ...sx }}>
      <Typography sx={{ color: "txt.white" }}>{children}</Typography>
      <TextField
        fullWidth
        name={name}
        type={type}
        onClick={onClick}
        placeholder={place}
        value={value}
        onChange={handleChange}
        variant="standard"
        inputProps
        slotProps={{
          htmlInput: {
            maxLength,
          },
          input: {
            disableUnderline: true,
            readOnly,
            startAdornment: start && (
              <InputAdornment position="start">{start}</InputAdornment>
            ),
            endAdornment: end && (
              <InputAdornment position="end">{end}</InputAdornment>
            ),
          },
        }}
        onInput={onInput}
        sx={{
          fieldset: { border: "none" },
          borderRadius: "4px",
          direction: "ltr",
          transition: "all 0.3s ease",
          //   "& .MuiInputBase-root": {
          //     direction: "rtl",
          //   },
          "& .MuiInputBase-input": {
            color: "txt.primary",
          },
          ...sx,
        }}
        {...props}
      />
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Stack>
  );
};

export default CustomField;
