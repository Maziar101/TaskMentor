import { Stack, TextField, Typography, InputAdornment } from "@mui/material";
const CustomField = ({
  place,
  name,
  error,
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
}) => {
  return (
    <Stack gap={1} sx={{ width: "100%", ...sx }}>
      {children && (
        <Typography sx={{ color: "txt.white" }}>{children}</Typography>
      )}
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
          transition: "all 0.3s ease",
          "& .MuiInputBase-input": {
            color: "txt.primary",
          },
          direction: "rtl",
        }}
        {...props}
      />
      {error && (
        <Typography
          variant="caption"
          color="error"
          sx={{ fontFamily: "IRANYekanX", fontSize: "15px" }}
        >
          {error}
        </Typography>
      )}
    </Stack>
  );
};
export default CustomField;
