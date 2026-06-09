import type { Metadata } from "next";
import { Cormorant_Garamond, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import AdminLayout from "@/components/layout/AdminLayout";

const cormorant = Cormorant_Garamond({
  subsets: ["vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: '--font-cormorant'
});

const beVietnam = Be_Vietnam_Pro({
  subsets: ["vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: '--font-be-vietnam'
});

export const metadata: Metadata = {
  title: "Admin Dashboard - Oriental Herbs",
  description: "Quản lý cửa hàng dược liệu Đông Y",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${beVietnam.variable} ${cormorant.variable} min-h-screen`}>
        <AdminLayout>
          {children}
        </AdminLayout>
      </body>
    </html>
  );
}
