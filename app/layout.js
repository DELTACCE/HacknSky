import "./globals.css";
import { Outfit } from "next/font/google";
import { EVENT } from "@/lib/config";

const sans = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export const metadata = {
  title: {
    default: "HacknSky — Less ordinary. More altitude.",
    template: "%s · HacknSky",
  },
  description:
    "Build ideas. Defy gravity. A proposed two-day destination hackathon above the forest canopy of Athirappilly, Kerala.",
  applicationName: "HacknSky",
  keywords: [
    "HacknSky",
    "hackathon",
    "Athirappilly",
    "Kerala",
    "DELTA",
    "DATARA",
    "Christ College of Engineering",
    "destination hackathon",
  ],
  authors: [{ name: EVENT.organiser }],
  openGraph: {
    title: "HacknSky — Less ordinary. More altitude.",
    description:
      "A proposed two-day destination hackathon in Athirappilly, Kerala. 20 teams, one valley, and a ride down worth building for.",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "HacknSky — Less ordinary. More altitude.",
    description:
      "A proposed two-day destination hackathon in Athirappilly, Kerala. Build ideas. Defy gravity.",
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: "#f6f2e8",
  colorScheme: "light",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
