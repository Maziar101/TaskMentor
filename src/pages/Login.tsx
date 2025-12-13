import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser } from "react-icons/fi";

type LoginPageProps = {
  setUser: (user: { userId: string; username: string }) => void;
};

export default function LoginPage({ setUser }: LoginPageProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [code, setCode] = useState("");
  const [newUser, setNewUser] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmedPhone = phone.trim();
    if (step === "phone") {
      const trimmedName = name.trim();
      if (!trimmedPhone) {
        setError("شماره تلفن را وارد کنید");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: trimmedPhone, name: trimmedName }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.message || "ارسال کد ناموفق بود");
        } else {
          setStep("code");
          setNewUser(Boolean(data?.newUser));
          setError("");
        }
      } catch (err) {
        setError("خطا در برقراری ارتباط با سرور");
      } finally {
        setLoading(false);
      }
    } else {
      const trimmedCode = code.trim();
      if (!trimmedCode) {
        setError("کد را وارد کنید");
        return;
      }
      setLoading(true);
      try {
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
          setError(data?.message || "کد نادرست است");
        } else {
          const payload = { userId: data.userId, username: data.username };
          setUser(payload);
          localStorage.setItem("taskmentor-user", JSON.stringify(payload));
          navigate("/planner", { replace: true });
        }
      } catch (err) {
        setError("خطا در برقراری ارتباط با سرور");
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-card__icon">
          <FiUser />
        </div>
        <h2>ورود به تسک منیجر</h2>
        <p className="light small">
          {step === "phone"
            ? "برای ادامه فقط شماره تلفن را وارد کنید"
            : newUser
            ? "ثبت‌نام جدید: نام و کد یکبار مصرف را وارد کنید (کد جادویی 000000)"
            : "کد یکبار مصرف را وارد کنید (کد جادویی 000000)"}
        </p>
        {step === "phone" && (
          <label className="auth-label">
            شماره تلفن
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09xxxxxxxxx"
              maxLength={11}
            />
          </label>
        )}
        {step === "code" && (
          <label className="auth-label">
            <div className="auth-label__row">
              <span>کد تایید</span>
              <span className="light small">کد جادویی 000000</span>
            </div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="مثلا 000000"
              maxLength={6}
            />
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
        {error && <p className="error">{error}</p>}
        <button className="primary" type="submit" disabled={loading}>
          {loading
            ? "لطفاً صبر کنید..."
            : step === "phone"
            ? "دریافت کد"
            : "تایید کد"}
        </button>
      </form>
    </div>
  );
}
