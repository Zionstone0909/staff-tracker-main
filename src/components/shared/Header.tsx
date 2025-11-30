"use client";
import { Bell } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

import { SidebarTrigger } from "@/components/ui/sidebar";
import MyProfileButton from "./MyProfileButton";

interface HeaderProps {
    isLoggedIn: boolean;
    user?: {
        name: string;
        role: string;
        email: string;
    } | null;
    onLogin: () => void;
    onLogout: () => void;
}

export function Header({
    isLoggedIn = false,
    user,
    onLogin,
    onLogout,
}: HeaderProps) {
    console.log({ user });
    return (
        <header className="flex h-24 items-center px-4 md:px-6 ">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="" />
                <motion.h1
                    className="text-sm lg:text-lg font-semibold "
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 3 }}
                >
                    👋 Assalamualaikum,{" "}
                    <motion.span
                        className=" bg-gradient-to-r from-violet-500 via-blue-500 to-green-500 text-transparent bg-clip-text font-bold underline decoration-black"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                            delay: 0.5,
                            type: "spring",
                            stiffness: 100,
                            damping: 20,
                        }}
                    >
                        {/* {user?.name ?? "Guest"} */}
                        {user?.role ? ` (${user.role})` : ""}
                    </motion.span>{" "}
                    <span className="text-xs lg:text-base">
                        Welcome to your Stock Management System
                    </span>
                </motion.h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notifications</span>
                </Button>

                {isLoggedIn ? (
                    <MyProfileButton onLogout={onLogout} />
                ) : (
                    <Button onClick={onLogin}>Login</Button>
                )}
            </div>
        </header>
    );
}
