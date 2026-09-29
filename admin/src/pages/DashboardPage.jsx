import { useEffect, useMemo, useState } from "react";
import { Alert, CircularProgress, Stack } from "@mui/material";
import { adminApiRequest } from "../auth/adminSession";
import DashboardCharts from "./components/dashboard/DashboardCharts";
import DashboardStatCards from "./components/dashboard/DashboardStatCards";
import { getMonthBuckets, getMonthlyGrowth, startOfMonth } from "./components/dashboard/dashboardMetrics";

const initialState = { users: [], loading: true, error: "" };

export default function DashboardPage() {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let active = true;
    adminApiRequest("/api/admin/users")
      .then((response) => {
        if (active) setState({ users: response.data || [], loading: false, error: "" });
      })
      .catch((error) => {
        if (active) setState({ users: [], loading: false, error: error.message || "دریافت اطلاعات داشبورد انجام نشد" });
      });
    return () => { active = false; };
  }, []);

  const metrics = useMemo(() => {
    const total = state.users.length;
    const paid = state.users.filter((user) => user.subscription === "pro" || user.subscription === "enterprise").length;
    const free = total - paid;
    const currentMonth = startOfMonth(new Date());
    const monthly = state.users.filter((user) => new Date(user.createdAt) >= currentMonth).length;
    return { total, paid, free, monthly, growth: getMonthlyGrowth(state.users), chart: getMonthBuckets(state.users) };
  }, [state.users]);

  return (
    <Stack sx={{ gap: 2.25 }}>
      <Stack sx={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        {state.loading && <CircularProgress size={24} sx={{ color: "#a100ff" }} />}
      </Stack>

      {state.error && <Alert severity="error" sx={{ borderRadius: "10px" }}>{state.error}</Alert>}
      <DashboardStatCards metrics={metrics} />
      <DashboardCharts metrics={metrics} />
    </Stack>
  );
}
