import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Evencia - Découvrez les meilleurs événements",
  description: "Plateforme de gestion et de découverte d'événements. Trouvez les événements près de chez vous ou créez les vôtres.",
  keywords: ["événements", "concerts", "spectacles", "conférences", "meetups"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${dmSans.variable} ${playfair.variable} antialiased min-h-screen flex flex-col`}
        style={{ fontFamily: 'var(--font-dm-sans), system-ui, sans-serif' }}
      >
        <Navbar />
        <main className="flex-1 pt-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
