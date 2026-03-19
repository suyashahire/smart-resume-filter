import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutContent from "@/components/layout/LayoutContent";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HireQ - AI-Powered Recruitment Platform",
  description: "HireQ is an intelligent candidate screening and interview evaluation platform powered by AI. Streamline your hiring process with automated resume parsing, skill matching, and interview analysis.",
  keywords: ["recruitment", "AI hiring", "resume screening", "interview analysis", "candidate matching", "HR technology"],
  authors: [{ name: "HireQ" }],
  creator: "HireQ",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://hireq.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "HireQ",
    title: "HireQ - AI-Powered Recruitment Platform",
    description: "Streamline your hiring process with AI-powered resume screening, candidate matching, and interview analysis.",
  },
  twitter: {
    card: "summary_large_image",
    title: "HireQ - AI-Powered Recruitment Platform",
    description: "Streamline your hiring process with AI-powered resume screening, candidate matching, and interview analysis.",
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "theme-color": "#0f172a",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <LayoutContent>
            {children}
          </LayoutContent>
        </ThemeProvider>
      </body>
    </html>
  );
}

