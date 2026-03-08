import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HotToast } from "../../utils/HotToast";
import { Stack } from "@mui/material";
import { Form, Formik } from "formik";
import CustomField from "../../components/CustomField";
import * as yup from "yup";
import { useTransition } from "react";
import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import Loading from "../../components/Loading";
import { useFetch } from "../../hooks/useFetch";
import { useUserStore } from "../../store/userStore";

const initialValues = {
  phone: "",
};

const initialValues2 = {
  otp: ["", "", "", "", "", ""],
};

const validationSchema = yup.object().shape({
  phone: yup
    .string()
    .required("شماره موبایل اجباری میباشد !")
    .matches(/^09[0-9]{9}$/, "شماره موبایل معتبر نیست"),
});

const validationSchema2 = yup.object().shape({
  otp: yup.array().min(6, "کد ۶ رقمیست"),
});

export default function LoginPage() {
  const [isPending, startPending] = useTransition();
  const [step, setStep] = useState("phone");
  const [otpValues, setOtpValues] = useState(Array(6).fill(""));
  const otpRefs = useRef([]);
  const { fetchData } = useFetch();
  const { setTmpData, tmpData, login } = useUserStore();

  useEffect(() => {
    if (step === "code" && otpRefs.current[0]) {
      otpRefs.current[0]?.focus();
    }
  }, [step]);

  const handleSubmit = (values) => {
    startPending(async () => {
      if (step === "phone") {
        const { res, status } = await fetchData("/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ phone: values.phone }),
        });
        if (status !== 200) {
          return HotToast("error", res?.message);
        }
        setStep("code");
        setTmpData({ phone: values.phone, newUser: res?.newUser });
      } else {
        console.log(values.otp);
        const { res, status } = await fetchData("/api/auth/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            phone: tmpData?.phone?.trim(),
            code: values?.otp,
            name: values?.name?.trim(),
          }),
        });
        if (status !== 200) {
          return HotToast("error", res?.message);
        }
        login({ token: res?.token, username: res?.username });
      }
    });
  };

  if (isPending) return <Loading />;
  return (
    <Stack
      className="auth-page"
      sx={{
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
        "& form": {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        },
      }}
    >
      <Formik
        initialValues={step === "phone" ? initialValues : initialValues2}
        validationSchema={
          step === "phone" ? validationSchema : validationSchema2
        }
        onSubmit={handleSubmit}
      >
        {(formik) =>
          step === "phone" ? (
            <StepOne formik={formik} />
          ) : (
            <StepTwo formik={formik} />
          )
        }
      </Formik>
    </Stack>
  );
}
