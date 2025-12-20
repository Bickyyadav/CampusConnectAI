"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const Sidebar = () => {
    const pathname = usePathname();

    const navItems = [
        {
            name: "Upload Data",
            href: "/",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
            ),
        },
        {
            name: "Analytics",
            href: "/stats",
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                </svg>
            ),
        },
    ];

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white/10 border-r border-white/20 backdrop-blur-xl transition-transform">
            <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
                <div className="mb-10 flex items-center pl-2.5 space-x-2">
                    <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg shadow-lg shadow-indigo-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                            <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436h.008c.642.641 1.066 1.543 1.066 2.536a3.563 3.563 0 0 1-3.563 3.563c-.993 0-1.896-.424-2.536-1.066V19.75a.75.75 0 0 1-.75.75H2.25a.75.75 0 0 1-.75-.75V11.25a.75.75 0 0 1 .75-.75h8.468c.641-.64 1.543-1.065 2.536-1.065a3.563 3.563 0 0 1 3.563 3.563v.008c-2.88-3.7-7.38-6.084-12.436-6.084a.75.75 0 0 1-.75-.75ZM2.25 12h8.469a2.063 2.063 0 0 0-.219.922c0 .247.04.484.113.706L4.54 19.701A10.879 10.879 0 0 1 2.25 12Z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <span className="self-center whitespace-nowrap text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        AdminPanel
                    </span>
                </div>
                <ul className="space-y-2 font-medium">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={`group flex items-center rounded-xl p-3 transition-all duration-200 ${isActive
                                            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25"
                                            : "text-slate-100 hover:bg-white/10 hover:text-white"
                                        }`}
                                >
                                    <div className={`transition-transform duration-200 ${isActive ? "" : "group-hover:scale-110"}`}>
                                        {item.icon}
                                    </div>
                                    <span className="ml-3 tracking-wide text-sm font-semibold">{item.name}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm"></div>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>

                <div className="mt-auto">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/5 backdrop-blur-md">
                        <p className="text-xs text-indigo-200 mb-2 font-medium">System Status</p>
                        <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs text-white/80 font-semibold">Online</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
