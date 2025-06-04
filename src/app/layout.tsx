import type { Metadata } from "next";
import "./globals.css";
import { TranslationProvider } from "@/lib/i18n/TranslationProvider";
import { GymProvider } from "@/lib/contexts/GymContext";

export const metadata: Metadata = {
  title: "FitLife - Gym Management System",
  description: "Complete gym management solution with member tracking, class scheduling, payments, and analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <TranslationProvider>
          <GymProvider>
            {children}
          </GymProvider>
        </TranslationProvider>
      </body>
    </html>
  );
}
