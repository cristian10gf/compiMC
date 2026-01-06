import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import { CompilerProvider } from "@/lib/context/compiler-context";
import { HistoryProvider } from "@/lib/context/history-context";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { AppLayout } from '@/components/layout';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

const dmSans = DM_Sans({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CompiMC - Simulador de Compiladores",
  description: "Aplicación educativa para análisis léxico, sintáctico y compilación completa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={dmSans.variable} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NuqsAdapter>
            <CompilerProvider>
              <HistoryProvider>
                <AppLayout>
                  {children}
                </AppLayout>
                <Toaster />
              </HistoryProvider>
            </CompilerProvider>
          </NuqsAdapter>
        </ThemeProvider>
      </body>
    </html>
  );
}
