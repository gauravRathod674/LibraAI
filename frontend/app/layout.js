import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/app/context/ThemeContext";
import { AuthProvider } from "@/app/context/AuthContext";
import ToasterClient from "@/components/ui/ToasterClient"; // ✅ Custom client wrapper

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "LibraAI",
  description: "LibraAI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <ThemeProvider>
            <ToasterClient /> {/* ✅ Now correctly wrapped in client component */}
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
