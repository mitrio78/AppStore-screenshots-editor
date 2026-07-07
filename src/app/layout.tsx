import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FontLoader } from "@/components/editor/font-loader";

// Editor chrome font. Canvas text uses the self-hosted registry via FontLoader.
// CJK UI text falls back to system fonts in globals.css.
const font = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Screenshot Studio",
  description: "Design and export App Store + Google Play screenshots.",
};

// Set the editor theme before first paint (no flash). Falls back to the OS
// preference when the user hasn't chosen one. Kept in sync by ThemeToggle.
const themeInit = `try{var t=localStorage.getItem('screenshot-studio:theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark');}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={font.variable}>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <FontLoader />
        {children}
      </body>
    </html>
  );
}
