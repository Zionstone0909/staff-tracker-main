import { useState, useEffect } from "react";
import { useAuth } from "@/store/auth-store";
import { api } from "@/lib/axios";

interface Stats {
  totalRevenue: number;
  totalSales: number;
  totalProducts: number;
  recentActivities: string[];
  totalProfit: number;
  outstandingSales: number;
  completedSales: number;
}

export function useDashboardStats() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalSales: 0,
    totalProducts: 0,
    recentActivities: [],
    totalProfit: 0,
    outstandingSales: 0,
    completedSales: 0,
  });

  // Mock data function
  const useMockData = () => {
    setStats({
      totalRevenue: 123456,
      totalSales: 42,
      totalProducts: 350,
      totalProfit: 50000,
      outstandingSales: 5,
      completedSales: 37,
      recentActivities: [
        "Sold Product A - ₦5000 (Qty: 2)",
        "Created Product B (Qty: 50)",
        "Sold Product C - ₦1200 (Qty: 1)",
        "Created Product D (Qty: 30)",
        "Sold Product E - ₦10000 (Qty: 5)",
      ],
    });
    setLoading(false);
  };

  useEffect(() => {
    async function fetchData() {
      if (!user?.token) {
        console.warn("No user token found, using mock data.");
        useMockData();
        return;
      }

      try {
        const [productsRes, salesRes] = await Promise.all([
          api.get("/products", {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          api.get("/sales", {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);

        const products = productsRes.data?.products ?? [];
        const sales = salesRes.data?.sales ?? [];

        const totalRevenue = sales.reduce(
          (acc: number, sale: any) => acc + (sale.paidAmount ?? 0),
          0
        );

        const completedSales = sales.filter((s: any) => s.status === "completed")
          .length;
        const outstandingSales = sales.filter((s: any) => s.status !== "completed")
          .length;

        const totalProfit = sales.reduce(
          (acc: number, sale: any) => acc + (sale.profit ?? 0),
          0
        );

        const combinedItems = [...sales, ...products];
        const recentActivities = combinedItems
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5)
          .map((item: any) => {
            if (item.product) {
              return `Sold ${item.product.name} - ₦${item.paidAmount ?? 0} (Qty: ${
                item.quantity ?? 0
              })`;
            }
            return `Created Product - ${item.name ?? "Unknown"} (Qty: ${
              item.quantity ?? 0
            })`;
          });

        setStats({
          totalRevenue,
          totalSales: sales.length,
          totalProducts: products.length,
          recentActivities,
          totalProfit,
          outstandingSales,
          completedSales,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard stats, using mock data:", err);
        useMockData();
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user?.token]);

  return { ...stats, loading };
}
