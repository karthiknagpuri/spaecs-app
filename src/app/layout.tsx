"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { Navigation } from "@/components/navigation";
import { createClient } from "@/lib/supabase/client";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [showNavigation, setShowNavigation] = useState(true);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    // Check if on dashboard, onboarding, or public creator page to hide navigation
    const checkNavVisibility = () => {
      const isDashboard = pathname?.startsWith('/dashboard');
      const isOnboarding = pathname?.startsWith('/onboarding');

      // Check if it's a public creator page (dynamic route like /username)
      // Exclude root path and common static routes
      const isPublicCreatorPage = pathname &&
        pathname !== '/' &&
        !pathname.startsWith('/auth') &&
        !pathname.startsWith('/api') &&
        !isDashboard &&
        !isOnboarding;

      // Show navigation only on landing page and auth pages
      setShowNavigation(!isDashboard && !isOnboarding && !isPublicCreatorPage);
    };

    checkNavVisibility();
  }, [pathname]);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {showNavigation && <Navigation />}
        {children}
      </body>
    </html>
  );
}
