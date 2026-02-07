import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser } from "react-icons/fi";
import { useAuth } from "../../store/authStore";
import { Stack } from "@mui/material";
import { Form, Formik } from "formik";
import CustomField from "../../components/CustomField";
import * as yup from "yup";
import { useTransition } from "react";

const initialValues = {
  phone: "",
};

const validationSchema = yup.object().shape({
  phone: yup
    .string()
    .required("شماره موبایل اجباری میباشد !")
    .matches(/^09[0-9]{9}$/, "شماره موبایل معتبر نیست"),
});

export default function LoginPage() {
  const [isPending, startPending] = useTransition();
  const { setUser } = useAuth();
  const [name, setName] = useState("");
  const [step, setStep] = useState("phone");
  const [newUser, setNewUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpValues, setOtpValues] = useState(Array(6).fill(""));
  const otpRefs = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (step === "code" && otpRefs.current[0]) {
      otpRefs.current[0]?.focus();
    }
  }, [step]);

  const otpCode = otpValues.join("");

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

  const handleSubmit = (values) => {
    startPending(async () => {
      console.log(values)
      if (step === "phone") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: values.phone }),
        });
        const data = await res.json();
        if (!res.ok) {
        } else {
          setStep("code");
          setNewUser(Boolean(data?.newUser));
          setOtpValues(Array(6).fill(""));
        }
      } else {
        const trimmedCode = otpCode.trim();
        setLoading(true);
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: trimmedPhone,
            code: trimmedCode,
            name: newUser ? name.trim() : undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          HotToast("error", "کد اشتباه است !");
        } else {
          const payload = { userId: data.userId, username: data.username };
          setUser(payload);
          localStorage.setItem("taskmentor-user", JSON.stringify(payload));
          navigate("/planner", { replace: true });
        }
      }
    });
  };

  return (
    <Stack
      className="auth-page"
      sx={{ height: "100vh", justifyContent: "center", alignItems: "center" }}
    >
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, handleBlur, handleChange, errors }) => (
          <Form className="auth-card">
            <div className="auth-card__icon">
              <FiUser />
            </div>
            <h2 style={{ fontSize: "32px" }}>Task Mentor</h2>
            <p className="light small">
              {step === "phone"
                ? "برای ادامه فقط شماره تلفن را وارد کنید"
                : newUser
                ? "ثبت‌نام جدید: نام و کد یکبار مصرف را وارد کنید (کد جادویی 000000)"
                : "کد یکبار مصرف را وارد کنید (کد جادویی 000000)"}
            </p>
            {step === "phone" && (
              <label className="auth-label">
                <CustomField
                  name="phone"
                  handleBlur={handleBlur}
                  handleChange={handleChange}
                  error={errors.phone}
                >
                  شماره تلفن
                </CustomField>
              </label>
            )}
            {step === "code" && (
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
            )}
            {step === "code" && newUser && (
              <label className="auth-label">
                نام
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلا: مازیار"
                />
              </label>
            )}
            <button className="primary" type="submit" disabled={loading}>
              {step === "phone" ? "دریافت کد" : "تایید کد"}
            </button>
          </Form>
        )}
      </Formik>
    </Stack>
  );
}
