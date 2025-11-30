/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { api } from "@/lib/axios";
import { useAuth } from "@/store/auth-store";

// --- TYPES ---
interface RevenueDataItem {
  month: string;
  revenue: number;
}

// --- HOOK: useDashboardStats ---
export function useDashboardStats() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [outstandingSales, setOutstandingSales] = useState(0);
  const [completedSales, setCompletedSales] = useState(0);
  const [recentActivities, setRecentActivities] = useState<string[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<RevenueDataItem[]>([]);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const res = await api.get("/sales");
        const sales = res.data?.sales ?? [];

        // Filter by staff if user role is staff
        const filteredSales =
          user?.role === "staff" ? sales.filter((sale: any) => sale.soldBy?._id === user?.id) : sales;

        let revenue = 0;
        let profit = 0;
        let completed = 0;
        let outstanding = 0;
        const activities: string[] = [];
        const revenueMap: { [month: string]: number } = {};

        filteredSales.forEach((sale: any) => {
          const date = new Date(sale.saleDate || Date.now());
          const month = date.toLocaleString("default", { month: "short", year: "numeric" });

          revenueMap[month] = (revenueMap[month] || 0) + (sale.paidAmount || 0);
          revenue += sale.paidAmount || 0;
          profit += sale.profit || 0;

          if (sale.status === "completed") {
            completed += 1;
          } else {
            outstanding += 1;
          }

          activities.push(
            `${sale.soldBy?.name || "Unknown Staff"} sold ${sale.items?.length || 0} items`
          );
        });

        // Sort revenue chart data by date
        const chartData: RevenueDataItem[] = Object.entries(revenueMap)
          .map(([month, revenue]) => ({ month, revenue }))
          .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

        setTotalRevenue(revenue);
        setTotalProfit(profit);
        setCompletedSales(completed);
        setOutstandingSales(outstanding);
        setRecentActivities(activities.slice(0, 10).reverse());
        setRevenueChartData(chartData);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  return {
    loading,
    totalRevenue,
    totalProfit,
    outstandingSales,
    completedSales,
    recentActivities,
    revenueChartData,
  };
}

// --- COMPONENT: RevenueBarChart ---
export function RevenueBarChart() {
  const { revenueChartData, loading } = useDashboardStats();

  if (loading) return <div>Loading chart...</div>;

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <h3 style={{ fontWeight: 600, marginBottom: "1rem" }}>Monthly Revenue Chart</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={revenueChartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value: number) => `₦${value.toLocaleString()}`} />
          <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
