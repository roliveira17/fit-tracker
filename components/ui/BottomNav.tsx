"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ========================================
// BOTTOM NAV - Navegação inferior
// ========================================
// 2 variantes: simple (4 tabs) | with-fab (4 tabs + botão central)
// 2 temas: dark (padrão) | light (para páginas Calma/Stitch)

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface BottomNavProps {
  variant?: "simple" | "with-fab";
  theme?: "dark" | "light";
  onFabClick?: () => void;
}

// Itens de navegação padrão
const navItems: NavItem[] = [
  { href: "/home", label: "Home", icon: "home" },
  { href: "/insights", label: "Insights", icon: "insights" },
  { href: "/import", label: "Diário", icon: "restaurant" },
  { href: "/profile", label: "Perfil", icon: "person" },
];

// Itens para variante com FAB (divide em 2 grupos)
const navItemsLeft: NavItem[] = [
  { href: "/home", label: "Início", icon: "home" },
  { href: "/insights", label: "Insights", icon: "insights" },
];

const navItemsRight: NavItem[] = [
  { href: "/import", label: "Diário", icon: "restaurant" },
  { href: "/profile", label: "Perfil", icon: "person" },
];

export function BottomNav({ variant = "simple", theme = "dark", onFabClick }: BottomNavProps) {
  const pathname = usePathname();
  const isLight = theme === "light";

  const isActive = (href: string) => pathname === href;

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);

    return (
      <Link
        href={item.href}
        className={`flex flex-col items-center gap-1 p-2 transition-colors ${
          active
            ? isLight ? "text-calma-primary" : "text-primary"
            : isLight ? "text-gray-400 hover:text-calma-primary" : "text-text-secondary hover:text-white"
        }`}
      >
        <span
          className={`material-symbols-outlined ${active ? "fill-1" : ""}`}
        >
          {item.icon}
        </span>
        <span className="text-[10px] font-medium">{item.label}</span>
        {active && isLight && (
          <div className="w-1 h-1 bg-calma-primary rounded-full" />
        )}
      </Link>
    );
  };

  // ========================================
  // VARIANTE 1: Simple (4 tabs)
  // ========================================
  if (variant === "simple") {
    return (
      <nav className={`fixed bottom-0 left-0 right-0 z-40 backdrop-blur max-w-md mx-auto ${
        isLight
          ? "bg-white/95 border-t border-gray-100 shadow-soft"
          : "bg-background-dark/95 border-t border-white/5"
      }`}>
        <div className="flex justify-around items-center py-3 pb-6">
          {navItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
        </div>
      </nav>
    );
  }

  // ========================================
  // VARIANTE 2: WithFAB (4 tabs + botão central)
  // ========================================
  if (variant === "with-fab") {
    return (
      <nav className={`fixed bottom-0 left-0 right-0 z-40 pb-6 pt-2 max-w-md mx-auto ${
        isLight
          ? "bg-white border-t border-gray-100 shadow-soft"
          : "bg-background-dark border-t border-white/10"
      }`}>
        <div className="flex justify-around items-center">
          {navItemsLeft.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}

          {/* FAB Central */}
          <div className="relative -top-5">
            <button
              onClick={onFabClick}
              className={`flex size-14 items-center justify-center rounded-full text-white shadow-xl active:scale-95 transition-transform ${
                isLight
                  ? "bg-calma-primary shadow-calma-primary/30"
                  : "bg-primary shadow-primary/30"
              }`}
            >
              <span className="material-symbols-outlined text-[28px]">add</span>
            </button>
          </div>

          {navItemsRight.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
        </div>
      </nav>
    );
  }

  return null;
}
