import type { Metadata } from "next";
import { SessionProvider } from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "diGener8 Family",
  description: "Future Built Now — Internal operating system for diGener8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('degener8-theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t);else document.documentElement.setAttribute('data-theme','dark');})();`,
          }}
        />
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
