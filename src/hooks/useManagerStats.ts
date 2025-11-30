/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useAuth } from "@/store/auth-store";
import { api } from "@/lib/axios";

export function useManagerStats() {
    const { user } = useAuth();
    console.log({ user });
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalSales: 0,
        totalProducts: 0,
        recentActivities: [] as string[],
    });

    useEffect(() => {
        async function fetchData() {
            try {
                const [productsRes, salesRes] = await Promise.all([
                    api.get("/products"),
                    api.get("/sales"),
                ]);
                console.log("Products:", productsRes.data.products);
                console.log("Sales:", salesRes.data.sales);

                const products = productsRes.data.products.filter(
                    (p: any) => p.createdBy === user?.id
                );

                const sales = salesRes.data.sales.filter(
                    (s: any) => s.soldBy?._id === user?.id
                );

                const totalRevenue = sales.reduce(
                    (acc: number, sale: any) => acc + sale.paidAmount,
                    0
                );

                const recentActivities = [...sales, ...products]
                    .sort(
                        (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                    )
                    .slice(0, 5)
                    .map((item) =>
                        item.product
                            ? `Sold ${item.product.name} - ৳${item.paidAmount}`
                            : `Created Product - ${item.name}`
                    );

                setStats({
                    totalRevenue,
                    totalSales: sales.length,
                    totalProducts: products.length,
                    recentActivities,
                });

                setLoading(false);
            } catch (err) {
                console.error("Manager stats fetch error", err);
            }
        }

        fetchData();
    }, [user?.id]);

    return { ...stats, loading };
}
