"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/chat", label: "Chat", icon: "chat_bubble" },
  { href: "/insights", label: "Insights", icon: "insights" },
  { href: "/import", label: "Importar", icon: "upload" },
  { href: "/profile", label: "Perfil", icon: "person" },
];

/**
 * Componente BottomNav - Navegação inferior do app
 * Tema light unificado para todas as páginas
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-gray-100 shadow-soft backdrop-blur max-w-md mx-auto">
      <div className="flex justify-around items-center py-3 pb-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 transition-colors ${
                isActive
                  ? "text-calma-primary"
                  : "text-gray-400 hover:text-calma-primary"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] ${
                  isActive ? "fill-1" : ""
                }`}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="w-1 h-1 bg-calma-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
