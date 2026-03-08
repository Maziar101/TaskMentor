import { Button, Stack, Typography } from "@mui/material";
import { Form } from "formik";
import React, { useRef, useState } from "react";
import CustomField from "../../../components/CustomField";
import { FiUser } from "react-icons/fi";
import { useUserStore } from "../../../store/userStore";

export default function StepTwo({
  formik: { handleSubmit, setFieldValue, values },
}) {
  const {
    tmpData: { newUser },
  } = useUserStore();
  const [otpValues, setOtpValues] = useState(Array(6).fill(""));
  const otpRefs = useRef([]);
  function handleOtpKeyDown(e, index) {
    if (
      e.key === "Backspace" &&
      !otpValues[index] &&
      otpRefs.current[index - 1]
    ) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && otpRefs.current[index - 1]) {
      e.preventDefault();
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && otpRefs.current[index + 1]) {
      e.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  }
  console.log(otpValues);
  function updateOtpValue(index, raw) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setOtpValues((prev) => {
      const next = [...prev];
      next[index] = digit ?? "";
      return next;
    });
    if (digit && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1]?.focus();
    }
  }
  function handleOtpPaste(e) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    setOtpValues((prev) => {
      const next = [...prev];
      for (let i = 0; i < Math.min(6, text.length); i += 1) {
        next[i] = text[i];
      }
      return next;
    });
    const targetIndex = Math.min(text.length, 5);
    otpRefs.current[targetIndex]?.focus();
  }
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
        </Typography>{" "}
        <Typography className="light small" sx={{ textAlign: "center" }}>
          {newUser
            ? "ثبت‌نام جدید: نام و کد یکبار مصرف را وارد کنید"
            : "کد یکبار مصرف را وارد کنید"}
        </Typography>
        <label className="auth-label">
          <div className="auth-label__row">
            <span>کد تایید</span>
            <span className="light small">کد جادویی 000000</span>
          </div>

          <div className="otp" onPaste={handleOtpPaste} dir="ltr">
            {otpValues.map((val, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  otpRefs.current[idx] = el;
                }}
                className="otp__box"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={val}
                onChange={(e) => updateOtpValue(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(e, idx)}
              />
            ))}
          </div>
        </label>
        {newUser && (
          <Stack component="label" className="auth-label" sx={{ gap: "0px" }}>
            <Typography>نام :</Typography>
            <CustomField
              value={values.name}
              handleChange={(e) => setFieldValue("name", e.target.value)}
              place="..."
              sx={{ direction: "rtl" }}
            />
          </Stack>
        )}
        <Button
          className="primary"
          type="submit"
          onClick={() => {
            setFieldValue("otp", otpValues?.join(""));
            handleSubmit({ otp: otpValues.join("") });
          }}
          sx={{
            color: "#120B27",
            fontSize: "16px",
            fontWeight: "bold",
            borderRadius: "8px",
          }}
        >
          تایید کد
        </Button>
      </Stack>
    </Form>
  );
}
