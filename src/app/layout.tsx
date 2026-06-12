import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 产品价格",
  description: "AI 数字商品价格目录，支持零售价与代理价快速查询。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
