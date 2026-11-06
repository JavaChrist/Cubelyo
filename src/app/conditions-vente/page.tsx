import type { Metadata } from "next";
import { LegalPage } from "@/features/legal/LegalPage";
export const metadata: Metadata = {
  title: "Conditions générales de vente — Cubelyo",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <LegalPage slug="conditions-vente" />;
}
