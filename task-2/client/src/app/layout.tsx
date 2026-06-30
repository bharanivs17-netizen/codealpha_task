import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'NovaSphere — The Future of Social Connection',
    template: '%s | NovaSphere',
  },
  description:
    'NovaSphere is an AI-powered social media platform where creativity meets connection. Share posts, stories, and reels with real-time messaging.',
  keywords: ['social media', 'AI', 'posts', 'stories', 'messaging', 'NovaSphere'],
  authors: [{ name: 'NovaSphere' }],
  creator: 'NovaSphere',
  openGraph: {
    type: 'website',
    siteName: 'NovaSphere',
    title: 'NovaSphere — The Future of Social Connection',
    description: 'AI-powered social media platform with real-time features.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NovaSphere',
    description: 'AI-powered social media platform',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f8fc' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
