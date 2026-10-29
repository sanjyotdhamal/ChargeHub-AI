"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Wallet, History, User } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function BottomTabBar() {
  const pathname = usePathname();
  const { isSplashActive } = useApp();

  // Hide tab bar on splash, auth pages (login/signup) or dedicated flows (station detail/session)
  if (
    isSplashActive ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname?.startsWith("/session") ||
    pathname?.startsWith("/station")
  ) {
    return null;
  }

  const navItems = [
    { label: "Explore", href: "/discover", icon: MapPin },
    { label: "Wallet", href: "/wallet", icon: Wallet },
    { label: "History", href: "/history", icon: History },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <div className="w-full px-4 pt-1 pb-1 z-50 shrink-0 bg-transparent">
      <nav className="w-full bg-white border-2 border-slate-200 py-1.5 px-2 rounded-full shadow-[0_8px_30px_rgba(15,23,42,0.08)] flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Match path active
          const isActive =
            pathname === item.href ||
            (item.href === "/discover" && (pathname === "/" || pathname === "/home" || pathname?.startsWith("/station")));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-all duration-200 flex items-center gap-1.5 ${
                isActive
                  ? "bg-[#7EF000] text-slate-950 font-black px-3.5 py-1.5 rounded-full shadow-[0_4px_14px_rgba(126,240,0,0.45)] scale-105"
                  : "text-slate-700 hover:text-slate-950 px-2.5 py-1.5 rounded-full flex-col text-center"
              }`}
            >
              <Icon size={isActive ? 17 : 19} className={isActive ? "stroke-[2.8]" : "stroke-[2.2] text-slate-700"} />
              <span className={isActive ? "text-[11px] font-black tracking-tight text-slate-950" : "text-[10px] font-extrabold tracking-tight text-slate-700"}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
