import { Button, Stack, Typography } from "@mui/material";
import { Form } from "formik";
import React from "react";
import { FiUser } from "react-icons/fi";
import CustomField from "../../../components/CustomField";

export default function StepOne({
  formik: { handleBlur, handleChange, errors },
}) {
  return (
    <Form>
      <Stack
        sx={{
          gap: "20px",
          border: "1px solid #453874",
          width: { xxl: "30%", xl: "30%", lg: "30%", md: "40%", xs: "100%" },
          p: "20px",
          borderRadius: "16px",
          bgcolor: "#18122A",
        }}
      >
        <Stack sx={{ justifyContent: "center" }} className="auth-card__icon">
          <FiUser />
        </Stack>

        <Typography
          variant="h2"
          style={{ fontSize: "32px", textAlign: "center" }}
        >
          Task Mentor
        </Typography>

        <Typography className="light small" sx={{ textAlign: "center" }}>
          برای ادامه شماره موبایل را وارد کنید
        </Typography>

        <label className="auth-label">
          <CustomField
            name="phone"
            handleBlur={handleBlur}
            handleChange={handleChange}
            error={errors.phone}
            place="0912345678"
          >
            شماره موبایل
          </CustomField>
        </label>

        <Button
          className="primary"
          type="submit"
          sx={{
            color: "#120B27",
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "8px",
          }}
        >
          دریافت کد
        </Button>
      </Stack>
    </Form>
  );
}
