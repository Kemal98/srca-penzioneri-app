import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Ajdinovići - All Inclusive Centar",
  description: "Jedini all-inclusive centar u BiH",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-icon-precomposed.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/ms-icon-310x310.png', sizes: '310x310', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  themeColor: '#009641',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bs">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="apple-touch-icon-precomposed" href="/apple-icon-precomposed.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#009641" />
        <meta name="msapplication-TileImage" content="/ms-icon-310x310.png" />
        <meta name="theme-color" content="#009641" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
