import type { Metadata } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { SupabaseAuthProvider } from "@/components/providers/SupabaseAuthProvider";
import { NotificationProvider } from "@/components/providers/NotificationProvider";

// Fonte principal do novo design system
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

// Fonte display para títulos estilizados (Calma theme)
const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif-display",
});

export const metadata: Metadata = {
  title: "Fit Track",
  description: "Seu corpo, explicado por dados reais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        {/* Material Symbols Outlined - Ícones do design system */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} ${dmSerifDisplay.variable} font-sans antialiased`}>
        <SupabaseAuthProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
