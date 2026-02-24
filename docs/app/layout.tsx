import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata } from 'next';
import './global.css';
import { Inter, Jacques_Francois } from 'next/font/google';

export const metadata: Metadata = {
  title: {
    template: '%s | fumi',
    default: 'fumi - Modern SMTP Server',
  },
};

const inter = Inter({
  subsets: ['latin'],
});

const jacquesFrancois = Jacques_Francois({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-jacques',
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.className} ${jacquesFrancois.variable}`} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider theme={{ defaultTheme: 'dark' }}>{children}</RootProvider>
      </body>
    </html>
  );
}
