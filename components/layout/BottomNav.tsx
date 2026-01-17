"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, MessageCircle, BarChart3, Upload, User } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/import", label: "Importar", icon: Upload },
  { href: "/profile", label: "Perfil", icon: User },
];

/**
 * Componente BottomNav - Navegação inferior do app
 * Aparece em todas as páginas principais (exceto onboarding)
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      {/* Safe area para iPhones com notch */}
      <div className="h-safe-area-inset-bottom bg-background" />
    </nav>
  );
}
