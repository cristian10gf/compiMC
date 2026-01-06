import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Sans } from "next/font/google";
import "./globals.css";
import { CompilerProvider } from "@/lib/context/compiler-context";
import { HistoryProvider } from "@/lib/context/history-context";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { AppLayout } from '@/components/layout';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Analytics } from "@vercel/analytics/next"

const dmSans = DM_Sans({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://compimc.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'CompiMC - Simulador de Compiladores',
    template: '%s | CompiMC',
  },
  description: 'Aplicación educativa interactiva para aprender teoría de compiladores. Análisis léxico, sintáctico (LL, LR, precedencia de operadores) y compilación completa con visualización en tiempo real.',
  keywords: [
    'compiladores',
    'análisis léxico',
    'análisis sintáctico',
    'autómatas',
    'gramáticas',
    'teoría de compiladores',
    'educación',
    'programación',
    'LL parser',
    'LR parser',
    'expresiones regulares',
    'AFD',
    'AFN',
    'árbol sintáctico',
  ],
  authors: [{ name: 'CompiMC Team' }],
  creator: 'CompiMC',
  publisher: 'CompiMC',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: baseUrl,
    title: 'CompiMC - Simulador de Compiladores',
    description: 'Aplicación educativa interactiva para aprender teoría de compiladores con visualización en tiempo real.',
    siteName: 'CompiMC',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CompiMC - Simulador de Compiladores',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CompiMC - Simulador de Compiladores',
    description: 'Aplicación educativa interactiva para aprender teoría de compiladores.',
    images: ['/og-image.png'],
    creator: '@compimc',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },    
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'CompiMC',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Aplicación educativa interactiva para aprender teoría de compiladores con análisis léxico, sintáctico y visualización en tiempo real.',
    url: baseUrl,
    inLanguage: 'es',
    creator: {
      '@type': 'Organization',
      name: 'CompiMC Team',
    },
    featureList: [
      'Análisis léxico con autómatas finitos',
      'Análisis sintáctico LL y LR',
      'Compilador completo con todas las fases',
      'Visualización interactiva en tiempo real',
      'Análisis semántico y optimización',
      'Generación de código',
    ],
  };

  return (
    <html lang="es" className={dmSans.variable} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
        <Analytics />
      </body>
    </html>
  );
}
