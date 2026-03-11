import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter as standard font
import "./globals.css";
import { cn } from "@/shared/lib/utils";

import { ThemeProvider } from "./providers";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BrightGlory 가계부",
  description: "통합 자산 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log('--- ROOT LAYOUT RENDERING ---');
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={cn(inter.className, "antialiased")}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
