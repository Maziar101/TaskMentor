import { useRef, useState, useTransition } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiEye, FiEyeOff, FiPhone } from "react-icons/fi";
import Loading from "../../components/Loading";
import { HotToast } from "../../utils/HotToast";
import { authApi } from "../../services/api";
import { setCredentials } from "../../store/authSlice";

const OTP_LENGTH = 5;

export default function LoginPage() {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        setNeedsPasswordSetup(data.needsPasswordSetup);
        setStep("otp");
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
    if (password.length < 6) {
      HotToast("error", "رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }
    startPending(async () => {
      try {
        const payload = { phone, code, password };
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
    setPassword("");
    setShowPassword(false);
    setNeedsPasswordSetup(false);
  }

  if (isPending) return <Loading />;

  return (
    <div className="auth-page" dir="rtl">
      {step === "phone" ? (
        <form className="auth-card" onSubmit={handleSendCode}>
          <div className="auth-card__header">
            <div className="auth-card__icon" aria-hidden="true">
              <FiPhone />
            </div>
            <div className="auth-card__title-group">
              <h1 className="auth-card__title">Task Mentor</h1>
              <p className="auth-card__subtitle">
                برای ورود یا ثبت‌نام، شماره موبایل خود را وارد کنید.
              </p>
            </div>
          </div>
          <label className="auth-label">
            <span>شماره موبایل</span>
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
          <div className="auth-card__header">
            <div className="auth-card__icon" aria-hidden="true">
              <FiPhone />
            </div>
            <div className="auth-card__title-group">
              <h1 className="auth-card__title">
                {isNewUser
                  ? "تکمیل ثبت‌نام"
                  : needsPasswordSetup
                    ? "تعریف رمز عبور"
                    : "ورود به حساب"}
              </h1>
              <p className="auth-card__subtitle">
                رمز عبور و کد تایید شماره{" "}
                <span className="auth-card__phone" dir="ltr">
                  {phone}
                </span>{" "}
                را وارد کنید. کد فعلی ۰۰۰۰۰ است.
              </p>
            </div>
          </div>

          {isNewUser && (
            <label className="auth-label">
              <span>نام</span>
              <input
                type="text"
                placeholder="نام خود را وارد کنید"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </label>
          )}

          <label className="auth-label">
            <span>
              {isNewUser || needsPasswordSetup
                ? "ساخت رمز عبور"
                : "رمز عبور"}
            </span>
            <span className="auth-password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="حداقل ۶ کاراکتر"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                autoComplete={
                  isNewUser || needsPasswordSetup
                    ? "new-password"
                    : "current-password"
                }
                autoFocus={!isNewUser}
                dir="ltr"
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
                title={showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </span>
          </label>

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
            <FiArrowRight aria-hidden="true" />
            تغییر شماره
          </button>
        </form>
      )}
    </div>
  );
}
