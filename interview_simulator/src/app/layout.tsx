import { Inter } from "next/font/google";
import "./globals.css";
import LayoutClient from "./layoutClient";

export const metadata = {
  title: "Interview Simulator",
  description: "Interview Simulator",
  icons: {
    icon: "/logo.png",
  },
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
