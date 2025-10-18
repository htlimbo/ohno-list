import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { Analytics } from '@vercel/analytics/react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Oh No! 不爽榜 - 记录不爽，发现机会",
  description: "记录生活中的不爽moment，发现产品灵感。独立开发者的灵感来源地。",
  keywords: "不爽,产品灵感,独立开发,idea",
  openGraph: {
    title: "Oh No! 不爽榜",
    description: "记录不爽，发现机会",
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Oh No! 不爽榜",
    description: "记录不爽，发现机会",
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NavBar />
        {children}
        <Analytics />
      </body>
    </html>
  );
}