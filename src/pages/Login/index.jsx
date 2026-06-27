import { useRef, useState, useTransition } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiPhone } from "react-icons/fi";
import Loading from "../../components/Loading";
import { HotToast } from "../../utils/HotToast";
import { authApi } from "../../services/api";
import { setCredentials } from "../../store/authSlice";

const OTP_LENGTH = 5;

export default function LoginPage() {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [name, setName] = useState("");
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [isPending, startPending] = useTransition();
  const otpRefs = useRef([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function handlePhoneChange(e) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 11);
    setPhone(val);
  }

  function handleSendCode(e) {
    e.preventDefault();
    if (phone.length !== 11) {
      HotToast("error", "شماره موبایل را کامل وارد کنید");
      return;
    }
    startPending(async () => {
      try {
        const data = await authApi.sendCode({ phone });
        setIsNewUser(data.newUser);
        setStep("otp");
        setTimeout(() => {
          if (data.newUser) return;
          otpRefs.current[0]?.focus();
        }, 50);
      } catch (err) {
        HotToast("error", err.message);
      }
    });
  }

  function handleOtpChange(index, value) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
    if (e.key === "ArrowRight" && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const text = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH).fill("");
    [...text].forEach((ch, i) => {
      next[i] = ch;
    });
    setOtp(next);
    const lastIdx = Math.min(text.length, OTP_LENGTH - 1);
    otpRefs.current[lastIdx]?.focus();
  }

  function handleVerify(e) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      HotToast("error", "کد تایید را کامل وارد کنید");
      return;
    }
    if (isNewUser && !name.trim()) {
      HotToast("error", "لطفاً نام خود را وارد کنید");
      return;
    }
    startPending(async () => {
      try {
        const payload = { phone, code };
        if (isNewUser) payload.name = name.trim();
        const data = await authApi.verify(payload);
        dispatch(setCredentials({ token: data.token, user: data.user }));
        navigate("/planner", { replace: true });
      } catch (err) {
        HotToast("error", err.message);
      }
    });
  }

  function handleBack() {
    setStep("phone");
    setOtp(Array(OTP_LENGTH).fill(""));
    setName("");
  }

  if (isPending) return <Loading />;

  return (
    <div className="auth-page" dir="rtl">
      {step === "phone" ? (
        <form className="auth-card" onSubmit={handleSendCode}>
          <div className="auth-card__icon">
            <FiPhone />
          </div>
          <h2 style={{ fontSize: 28, textAlign: "center" }}>Task Mentor</h2>
          <p className="auth-card__subtitle">
            برای ورود یا ثبت‌نام، شماره موبایل خود را وارد کنید
          </p>
          <label className="auth-label">
            شماره موبایل
            <input
              type="tel"
              inputMode="numeric"
              placeholder="09xxxxxxxxx"
              value={phone}
              onChange={handlePhoneChange}
              autoFocus
              dir="ltr"
              className="auth-phone-input"
            />
          </label>
          <button
            className="primary"
            type="submit"
            disabled={phone.length !== 11}
          >
            دریافت کد تایید
          </button>
        </form>
      ) : (
        <form className="auth-card" onSubmit={handleVerify}>
          <div className="auth-card__icon">
            <FiPhone />
          </div>
          <h2 style={{ fontSize: 28, textAlign: "center" }}>
            {isNewUser ? "ثبت‌نام" : "ورود"}
          </h2>
          <p className="auth-card__subtitle">
            کد ارسال شده به{" "}
            <span className="auth-card__phone" dir="ltr">
              {phone}
            </span>{" "}
            را وارد کنید
          </p>

          {isNewUser && (
            <label className="auth-label">
              نام
              <input
                type="text"
                placeholder="نام خود را وارد کنید"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </label>
          )}

          <div className="otp-inputs" onPaste={handleOtpPaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  otpRefs.current[idx] = el;
                }}
                className={[
                  "otp-input",
                  digit ? "otp-input--filled" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                autoFocus={!isNewUser && idx === 0}
              />
            ))}
          </div>

          <button className="primary" type="submit">
            {isNewUser ? "ساخت حساب" : "ورود"}
          </button>
          <button
            type="button"
            className="auth-card__back"
            onClick={handleBack}
          >
            تغییر شماره
          </button>
        </form>
      )}
    </div>
  );
}
