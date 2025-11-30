import { create } from "zustand";

interface User {
    id: string;
    role: "admin" | "staff" | "user"; // changed "manager" → "staff"
    token: string;
    name: string;
    email: string;
}

interface AuthStore {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
}

export const useAuth = create<AuthStore>((set) => ({
    user: JSON.parse(localStorage.getItem("user") || "null"),
    login: (user) => {
        localStorage.setItem("user", JSON.stringify(user));
        set({ user });
    },
    logout: () => {
        localStorage.removeItem("user");
        set({ user: null });
    },
}));
