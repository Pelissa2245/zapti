// ZapTI Web — Root Layout
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ZapTI — WhatsApp Helpdesk Multi-tenant',
    template: '%s | ZapTI',
  },
  description: 'Plataforma de helpdesk WhatsApp multi-tenant para equipes de suporte',
  keywords: ['WhatsApp', 'helpdesk', 'multi-tenant', 'suporte', 'atendimento'],
  authors: [{ name: 'ZapTI Team' }],
  creator: 'ZapTI',
  publisher: 'ZapTI',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://zapti.app',
    siteName: 'ZapTI',
    title: 'ZapTI — WhatsApp Helpdesk Multi-tenant',
    description: 'Plataforma de helpdesk WhatsApp multi-tenant para equipes de suporte',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZapTI',
    description: 'Plataforma de helpdesk WhatsApp multi-tenant',
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}