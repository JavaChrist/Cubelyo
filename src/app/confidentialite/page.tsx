import type { Metadata } from "next";
import { LegalPage } from "@/features/legal/LegalPage";
export const metadata: Metadata = {
  title: "Politique de confidentialité — Cubelyo",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <LegalPage slug="confidentialite" />;
}
