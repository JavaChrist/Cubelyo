import type { Metadata } from "next";
import { LegalPage } from "@/features/legal/LegalPage";
export const metadata: Metadata = {
  title: "Vos droits sur les données — Cubelyo",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <LegalPage slug="droits-rgpd" />;
}
