import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/providers/ThemeProvider";
import { AuthProvider } from "../components/providers/AuthProvider";
import { Navigation } from "../components/layout/Navigation";
import { Footer } from "../components/layout/Footer";
import { BottomNav } from "../components/layout/BottomNav";
import { InstallPrompt } from "../components/pwa/InstallPrompt";
import { OfflineSupport } from "../components/pwa/OfflineSupport";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Império Barber",
  description: "Sistema Profissional para Barbearias",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Império Barber",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zooming on mobile devices for app-like feel
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let settings = null;
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace('localhost', 'backend') 
      : 'http://backend:3001';
      
    const res = await fetch(`${backendUrl}/cms/settings`, { 
      next: { revalidate: 60 } 
    });
    if (res.ok) {
      const json = await res.json();
      settings = json.data || json;
    }
  } catch (e) {
    console.error("Error fetching settings for layout", e);
  }

  const primaryColor = settings?.primaryColor || '#D4AF37';
  const backgroundColor = settings?.secondaryColor || '#050505';
  const faviconUrl = settings?.favicon?.url || "/favicon.ico";

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href={faviconUrl} />
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --background: ${backgroundColor};
            --primary-foreground: ${primaryColor};
            --secondary: ${primaryColor};
            --ring: ${primaryColor};
          }
        `}} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <Navigation />
            {children}
            <Footer />
            <BottomNav />
            <InstallPrompt />
            <OfflineSupport />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
