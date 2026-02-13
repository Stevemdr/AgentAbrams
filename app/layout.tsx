import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GoodQuestion.AI | AI Development for Hospitality & Home Decor",
  description: "Revolutionary AI solutions for the hospitality and home decor industries. Color extraction, product tagging, and intelligent automation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-black text-white`}>
        <Navbar />
        <main className="pt-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
