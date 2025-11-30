/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from "@/lib/axios";
import { create } from "zustand";

// Allowed roles
export type UserRole = "admin" | "staff";

export type SaleProduct = {
    _id: string;
    name: string;
    sku: string;
    price: number;
};

export type SaleItem = {
    _id?: string;
    product?: SaleProduct | null;
    quantity: number;
    pricePerUnit: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    customerName: string;
    soldBy?: {
        _id: string;
        role: UserRole; // Only admin or staff
    };
    saleDate?: string;
    createdAt?: string;
    updatedAt?: string;
};

type SalesStore = {
    sales: SaleItem[];
    dueSales: SaleItem[];
    loading: boolean;
    error: string | null;
    fetchSales: () => Promise<void>;
    fetchDueSales: () => Promise<void>;
    addSale: (
        sale: Omit<SaleItem, "_id" | "createdAt" | "updatedAt">
    ) => Promise<void>;
};

export const useSalesStore = create<SalesStore>((set) => ({
    sales: [],
    dueSales: [],
    loading: false,
    error: null,

    fetchSales: async () => {
        set({ loading: true, error: null });
        try {
            const res = await api.get("/sales");
            set({ sales: res.data.sales, loading: false });
        } catch (err: any) {
            set({
                error: err.response?.data?.message || "Failed to fetch sales",
                loading: false,
            });
        }
    },

    fetchDueSales: async () => {
        set({ loading: true, error: null });
        try {
            const res = await api.get("/sales/dues");
            set({ dueSales: res.data.dueSales, loading: false });
        } catch (err: any) {
            set({
                error:
                    err.response?.data?.message || "Failed to fetch due sales",
                loading: false,
            });
        }
    },

    addSale: async (sale) => {
        set({ loading: true, error: null });
        try {
            const res = await api.post("/sales", sale);
            set((state) => ({
                sales: [...state.sales, res.data.sale],
                loading: false,
            }));
        } catch (err: any) {
            set({
                error: err.response?.data?.message || "Failed to add sale",
                loading: false,
            });
        }
    },
}));
