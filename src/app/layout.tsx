import { Instrument_Serif, Syne, Outfit, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';

import type { Metadata } from 'next';
import './globals.css';

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aura Expense Agent',
  description: 'Zero-touch financial intelligence system',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${instrumentSerif.variable} ${syne.variable} ${outfit.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
