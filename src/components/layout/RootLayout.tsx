"use client";

import { Outlet } from "react-router-dom";
import {
    SidebarInset,
    SidebarProvider,
    SidebarRail,
} from "@/components/ui/sidebar";
import { AppSidebar } from "../shared/AppSidebar";
import { Header } from "../shared/Header";
import { useAuth } from "@/store/auth-store";

export function RootLayout() {
    const { user, login, logout } = useAuth();

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarRail />
            <SidebarInset>
                <div className="flex h-full flex-col">
                    <Header
                        isLoggedIn={!!user}
                        user={user}
                        onLogin={() => user && login(user)}
                        onLogout={logout}
                    />
                    <main className="flex-1 overflow-auto p-4 md:p-6">
                        <Outlet />
                    </main>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
