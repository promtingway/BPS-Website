import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://bps-sourcing.de"),
  title: "BPS | Balkan Precision Solutions – Industrial Sourcing",
  description: "Independent industrial sourcing and supplier management connecting German companies with qualified manufacturing partners in Bosnia and Herzegovina.",
  keywords: ["industrial sourcing", "supplier management", "Bosnia and Herzegovina", "German procurement", "manufacturing partners"],
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.svg", apple: "/bps-logo.png" },
  openGraph: { title: "BPS – Balkan Precision Solutions", description: "We build reliable manufacturing partnerships.", type: "website", url: "/", siteName: "BPS – Balkan Precision Solutions", images: [{ url: "/bps-logo.png", alt: "BPS – Balkan Precision Solutions" }] },
  twitter: { card: "summary_large_image", title: "BPS – Balkan Precision Solutions", description: "We build reliable manufacturing partnerships.", images: ["/bps-logo.png"] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
