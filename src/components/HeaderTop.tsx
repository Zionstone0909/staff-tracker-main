"use client";

import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
];

export function HeaderTop() {
    return (
        <div className="bg-cultured border-b border-gray-200 py-0 text-xs">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between ">
                    {/* Social Links */}
                    <ul className="flex items-center gap-4 justify-center lg:justify-start">
                        {socialLinks.map((social) => (
                            <li key={social.label}>
                                <a
                                    href={social.href}
                                    className="text-sonic-silver hover:text-eerie-black transition-custom p-1 rounded-md hover:bg-white/50"
                                    aria-label={social.label}
                                >
                                    <social.icon className="h-4 w-4" />
                                </a>
                            </li>
                        ))}
                    </ul>

                    {/* Header Alert News */}
                    <div className="text-center lg:flex-1">
                        <p className="text-eerie-black">
                            <span className="font-semibold text-ocean-green">
                                Free Shipping
                            </span>{" "}
                            This Week Order Over -{" "}
                            <span className="font-semibold">$55</span>
                        </p>
                    </div>

                    {/* Header Top Actions */}
                    <div className="flex items-center gap-3 justify-center lg:justify-end">
                        {/* Currency Selector */}
                        <Select defaultValue="usd">
                            <SelectTrigger className="w-[100px] h-8 text-xs border-0 bg-transparent text-sonic-silver hover:text-eerie-black focus:ring-0 focus:ring-offset-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="usd" className="text-xs">
                                    USD $
                                </SelectItem>
                                <SelectItem value="eur" className="text-xs">
                                    EUR €
                                </SelectItem>
                                <SelectItem value="gbp" className="text-xs">
                                    GBP £
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Language Selector */}
                        <Select defaultValue="en-US">
                            <SelectTrigger className="w-[100px] h-8 text-xs border-0 bg-transparent text-sonic-silver hover:text-eerie-black focus:ring-0 focus:ring-offset-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en-US" className="text-xs">
                                    English
                                </SelectItem>
                                <SelectItem value="es-ES" className="text-xs">
                                    Español
                                </SelectItem>
                                <SelectItem value="fr" className="text-xs">
                                    Français
                                </SelectItem>
                                <SelectItem value="de" className="text-xs">
                                    Deutsch
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}
