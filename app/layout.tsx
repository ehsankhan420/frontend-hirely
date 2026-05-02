import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hirely — UK Visa Sponsorship Jobs",
  description:
    "Find jobs from companies that hold active UK Skilled Worker Sponsor Licences. Stop applying to employers who can't sponsor your visa.",
  keywords: ["UK visa sponsorship jobs", "skilled worker visa", "sponsor licence", "UK jobs"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <CookieConsentBanner />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
