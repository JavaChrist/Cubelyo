import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
export const metadata: Metadata = {
  title: "Cubelyo — Casse-tête 3D",
  description: "Tournez le cube, trouvez le passage et libérez les flèches.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={GeistSans.className}>
      <body>{children}</body>
    </html>
  );
}
