import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Bạn có thể đổi font chữ tuỳ ý
import { Cormorant_Garamond, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/chatbot/ChatWidget";
import LayoutWrapper from "@/components/layout/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

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
  title: "Oriental Herbs",
  description: "Dược liệu Đông Y",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${beVietnam.variable} ${cormorant.variable} font-sans min-h-screen flex flex-col relative`}>
        <LayoutWrapper>
          <Header />
          {/* Phần nội dung chính của các trang sẽ render ở đây */}
          <main className="grow">
            {children}
          </main>
          <Footer className="mt-20" />
          <ChatWidget />
        </LayoutWrapper>
      </body>
    </html>
  );
}