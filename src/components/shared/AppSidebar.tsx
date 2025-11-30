"use client";

import {
    BarChart3,
    BoxIcon,
    LayoutDashboard,
    ShoppingCart,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AppSidebar() {
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    return (
        <Sidebar className="w-64 bg-white border-r flex flex-col">
            <SidebarHeader className="flex items-center justify-center py-6 border-b">
                <Link
                    to="/"
                    className="flex items-center gap-3 font-bold text-2xl text-primary"
                >
                    <BoxIcon className="h-8 w-8 text-primary" />
                    <span>Stock Sales Management</span>
                </Link>
            </SidebarHeader>

            <SidebarContent className="flex-1 overflow-y-auto">
                <SidebarGroup>
                    <SidebarGroupLabel className="px-6 pt-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Navigation
                    </SidebarGroupLabel>

                    <SidebarGroupContent className="px-2 mt-2">
                        <SidebarMenu className="space-y-1">
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive("/dashboard")}
                                    className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                                        isActive("/dashboard")
                                            ? "bg-gray-200 font-semibold"
                                            : "hover:bg-gray-100"
                                    }`}
                                >
                                    <Link
                                        to="/dashboard"
                                        className="flex items-center gap-3"
                                    >
                                        <LayoutDashboard className="h-5 w-5" />
                                        <span className="text-sm font-medium">
                                            Dashboard
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive("/stock")}
                                    className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                                        isActive("/stock")
                                            ? "bg-gray-200 font-semibold"
                                            : "hover:bg-gray-100"
                                    }`}
                                >
                                    <Link
                                        to="/stock"
                                        className="flex items-center gap-3"
                                    >
                                        <BarChart3 className="h-5 w-5" />
                                        <span className="text-sm font-medium">
                                            Stock
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive("/sales")}
                                    className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                                        isActive("/sales")
                                            ? "bg-gray-200 font-semibold"
                                            : "hover:bg-gray-100"
                                    }`}
                                >
                                    <Link
                                        to="/sales"
                                        className="flex items-center gap-3"
                                    >
                                        <ShoppingCart className="h-5 w-5" />
                                        <span className="text-sm font-medium">
                                            Sales
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive("/sales/dues")}
                                    className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                                        isActive("/sales/dues")
                                            ? "bg-gray-200 font-semibold"
                                            : "hover:bg-gray-100"
                                    }`}
                                >
                                    <Link
                                        to="/sales/dues"
                                        className="flex items-center gap-3"
                                    >
                                        <ShoppingCart className="h-5 w-5" />
                                        <span className="text-sm font-medium">
                                            Due Sales
                                        </span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer */}
            <div className="border-t p-4 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} Stock Sales Management <br />
                Developed by{" "}
                <a
                    href="https://mehrab-hossain.vercel.app"
                    target="_blank"
                    className="font-semibold text-primary underline cursor-pointer"
                >
                    Mehrab Hossain
                </a>
            </div>
        </Sidebar>
    );
}
