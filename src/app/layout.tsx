import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { AuthProvider } from "@/components/providers/session-provider";
import { Toaster } from "sonner";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "نظام إدارة مصنع الملابس",
  description: "نظام ERP متكامل لإدارة مصنع الملابس - الانتاج والموظفين والأوردرات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full font-sans antialiased" suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider>
            {children}
            <Toaster position="top-center" richColors closeButton dir="rtl" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
