import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUser } from "react-icons/fi";

type LoginPageProps = {
  setUser: (user: { userId: string; username: string }) => void;
};

export default function LoginPage({ setUser }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmedUsername = username.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedUsername || !trimmedPhone) {
      setError("نام کاربری و تلفن را وارد کنید");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedUsername, phone: trimmedPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "ورود ناموفق بود");
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

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-card__icon">
          <FiUser />
        </div>
        <h2>ورود به تسک منیجر</h2>
        <p className="light small">برای ادامه ابتدا وارد حساب شوید</p>
        <label className="auth-label">
          نام کاربری
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="مثلا: maziar"
          />
        </label>
        <label className="auth-label">
          شماره تلفن
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09xxxxxxxxx"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary" type="submit" disabled={loading}>
          {loading ? "در حال ورود..." : "ورود"}
        </button>
      </form>
    </div>
  );
}
