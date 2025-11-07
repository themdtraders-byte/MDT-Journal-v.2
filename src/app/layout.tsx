
import type { Metadata } from 'next';
import { Providers } from './providers';
import './globals.css'

export const metadata: Metadata = {
  title: 'MD Journal',
  description: 'The ultimate trading journal for disciplined traders.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
       <head>
        <link rel="icon" href="/logo.svg" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
