import { useEffect, useState } from "react";
import MentorHeader from "./DashboardComponents/Header";
import MentorGreeting from "./DashboardComponents/MentorGreeting";
import StatsCards from "./DashboardComponents/StatsCards";
import TodaysSessionsCard from "./DashboardComponents/TodaysSessionsCard";
import QuickActionsCard from "./DashboardComponents/QuickActionsCard";
import RecentActivityCard from "./DashboardComponents/RecentActivityCard";
import { home } from "../../services/authServices";
import ChartGrid from "./DashboardComponents/ChartGrid";
import RangeDropdown from "./DashboardComponents/RangeDropdown";

type DashboardData = {
  mentor: any;
  stats: {
    totalStudents: number;
    todaysSessionsCount: number;
    avgProgress: number;
    avgFeedback: string;
    avgFeedbackValue?: number | null;
  };
  sessionsToday: any[];
  recentActivities: any[];
  chartData?: any[];
};

const MentorDashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [months, setMonths] = useState<number>(6);

  useEffect(() => {
    const fetchHome = async () => {
      try {
        setLoading(true);
        const res = await home(months);
        const mapped = {
          mentor: (res as any).mentor || null,
          stats: {
            totalStudents: (res as any).totalStudents ?? 0,
            todaysSessionsCount: (res as any).todaysSessionsCount ?? 0,
            avgProgress: (res as any).avgProgress ?? 0,
            avgFeedback: (res as any).avgFeedback ?? "No feedback",
            avgFeedbackValue: (res as any).avgFeedbackValue ?? null,
          },
          sessionsToday: (res as any).sessionsToday ?? [],
          recentActivities: (res as any).recentActivities ?? [],
          chartData: (res as any).chartData ?? [],
        };
        setData(mapped);
      } catch (err: any) {
        console.error("Failed to fetch dashboard:", err);
        setError(err?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchHome();
  }, [months]);


  return (
    <div className="min-h-screen bg-slate-700">
      <MentorHeader />
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-2xl font-semibold">Dashboard</h1>
        </div>

        {loading && <div className="text-white">Loading dashboard...</div>}
        {error && <div className="text-red-400">{error}</div>}
        {!loading && data && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <MentorGreeting mentor={data.mentor} />
              <StatsCards stats={data.stats} />
              <TodaysSessionsCard sessions={data.sessionsToday} />
              <RecentActivityCard activities={data.recentActivities} />

              <div className="flex items-center gap-4">
                <RangeDropdown months={months} setMonths={setMonths} />
              </div>
              {/* Charts */}
              <ChartGrid chartData={data.chartData || []} />
            </div>

            <div className="space-y-6">
              <QuickActionsCard />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorDashboard;
