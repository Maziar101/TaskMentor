import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Stack, Typography } from "@mui/material";
import Loading from "../../components/Loading";
import { reportsApi } from "../../services/api";
import { HotToast } from "../../utils/HotToast";

const number = new Intl.NumberFormat("fa-IR");
const dateFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  weekday: "short",
});

const tagLabels = {
  focus: "تمرکز",
  meeting: "جلسه",
  errand: "کارهای ریز",
};

function formatTag(tag) {
  return tagLabels[tag] || tag;
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [isPending, startPending] = useTransition();

  useEffect(() => {
    startPending(async () => {
      try {
        const response = await reportsApi.get();
        setData(response.data);
      } catch (err) {
        HotToast("error", err.message);
      }
    });
  }, []);

  const chartData = useMemo(
    () =>
      (data?.chart || []).map((item) => ({
        ...item,
        label: dateFormatter.format(new Date(`${item.day}T00:00:00Z`)),
      })),
    [data],
  );

  if (isPending && !data) return <Loading />;

  const summary = data?.summary || {
    todayHours: 0,
    weekHours: 0,
    completionPercent: 0,
    remainingTasks: 0,
  };

  return (
    <Stack className="goals dashboard-page" dir="rtl">
      <header className="goals__header">
        <Typography sx={{ fontSize: "32px" }}>داشبورد</Typography>
        <span className="pill pill--solid">
          رشد {number.format(data?.growth ?? 0)}٪
        </span>
      </header>

      <section className="dashboard-summary">
        <div className="panel stat">
          <p className="eyebrow">امروز</p>
          <p className="stat__value">{number.format(summary.todayHours)} ساعت</p>
          <p className="small light">زمان برنامه‌ریزی‌شده امروز</p>
        </div>
        <div className="panel stat">
          <p className="eyebrow">این هفته</p>
          <p className="stat__value">{number.format(summary.weekHours)} ساعت</p>
          <p className="small light">مجموع ۷ روز اخیر</p>
        </div>
        <div className="panel stat">
          <p className="eyebrow">تکمیل</p>
          <p className="stat__value">
            {number.format(summary.completionPercent)}٪
          </p>
          <p className="small light">نسبت تسک‌های انجام‌شده</p>
        </div>
        <div className="panel stat">
          <p className="eyebrow">باقی‌مانده</p>
          <p className="stat__value">
            {number.format(summary.remainingTasks)}
          </p>
          <p className="small light">تسک‌های انجام‌نشده</p>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel dashboard-chart">
          <div className="panel__header">
            <h3>بهره‌وری ۷ روز اخیر</h3>
            <span className="pill">ساعت</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" stroke="#cbbde6" />
              <YAxis stroke="#cbbde6" />
              <Tooltip
                cursor={{ fill: "rgba(161,107,255,0.12)" }}
                contentStyle={{
                  background: "#18122a",
                  border: "1px solid rgba(153,126,255,0.35)",
                  borderRadius: 8,
                  color: "#fff",
                }}
              />
              <Bar dataKey="hours" fill="#a16bff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel dashboard-side">
          <div className="stat">
            <p className="eyebrow">رکورد فعالیت</p>
            <p className="stat__value">{number.format(data?.streak ?? 0)} روز</p>
            <p className="small light">روزهای فعال پشت سر هم</p>
          </div>
          <div>
            <div className="panel__header">
              <h3>برچسب‌ها</h3>
            </div>
            <div className="tag-breakdown">
              {(data?.breakdown || []).map((item) => (
                <div key={item.tag} className="tag-breakdown__row">
                  <span>{formatTag(item.tag)}</span>
                  <strong>{number.format(item.hours)} ساعت</strong>
                </div>
              ))}
              {(data?.breakdown || []).length === 0 && (
                <p className="empty">هنوز داده‌ای برای گزارش وجود ندارد</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </Stack>
  );
}
