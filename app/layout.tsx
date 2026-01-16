import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google"; // Using Plus Jakarta Sans font
import "./globals.css";
import { SettingsProvider } from "../context/SettingsContext";
import GlobalBackground from "../components/GlobalBackground";

// Premium font similar to Spotify's branding
const font = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "R1G3L-Flux | Spotify Overlay",
  description: "Premium OBS Overlay for Spotify",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={font.className}>
        <SettingsProvider>
          <GlobalBackground />
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}