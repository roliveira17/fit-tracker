"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavItem {
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: "/home", icon: "home" },
  { href: "/chat", icon: "chat_bubble" },
  { href: "/insights", icon: "insights" },
  { href: "/import", icon: "upload" },
  { href: "/profile", icon: "person" },
];

/**
 * BottomNav — Floating pill navigation
 * Minimalista: só ícones, sem labels, glass effect
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-6 left-5 right-5 z-40 max-w-md mx-auto">
      <div className="flex items-center justify-around h-14 rounded-full bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-black/5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center w-12 h-10 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-calma-primary/10 text-calma-primary"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[24px] ${
                  isActive ? "fill-1" : ""
                }`}
              >
                {item.icon}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
