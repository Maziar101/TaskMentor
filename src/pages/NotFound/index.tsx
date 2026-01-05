import { Link, useNavigate } from "react-router-dom";
import { FiAlertTriangle, FiArrowRight, FiHome } from "react-icons/fi";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="not-found" dir="rtl">
      <div className="panel not-found__card">
        <div className="not-found__badge">
          <FiAlertTriangle />
          <span>۴۰۴</span>
        </div>
        <h1>صفحه پیدا نشد</h1>
        <p className="light">
          مسیر وارد شده وجود ندارد یا لینک جابه‌جا شده است.
        </p>
        <div className="not-found__actions">
          <button className="ghost" type="button" onClick={() => navigate(-1)}>
            <FiArrowRight />
            بازگشت
          </button>
          <Link className="primary" to="/planner">
            <FiHome />
            رفتن به برنامه‌ریز
          </Link>
        </div>
      </div>
      <p className="not-found__hint light small">
        اگر فکر می‌کنید این خطا اشتباه است، مسیر را دوباره بررسی کنید.
      </p>
    </div>
  );
}
