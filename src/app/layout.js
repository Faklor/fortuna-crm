import { Geist, Geist_Mono } from "next/font/google";
import "./globals.scss";
import StoreProvider from "@/store/storeProvider";
import ClientWrapper from './components/ClientWrapper'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "fortuna-crm",
  description: "Created by falokfy",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
        integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
        crossOrigin=""/>
      </head>
      <StoreProvider>
        <body className={`${geistSans.variable} ${geistMono.variable}`}>
          <ClientWrapper>
            {children}
          </ClientWrapper>
        </body>
      </StoreProvider>
    </html>
  );
}
