import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HeartBeat AI | Personalized AI Song Dedications",
  description: "Create fully personalized AI-generated songs and animated dedication pages for your loved ones. Make someone feel special today.",
  openGraph: {
    title: "HeartBeat AI | Personalized AI Song Dedications",
    description: "Create fully personalized AI-generated songs and animated dedication pages for your loved ones.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-zinc-950`}
      >
        <Header />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}

