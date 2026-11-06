import type { Metadata } from "next";
import { LegalPage } from "@/features/legal/LegalPage";
export const metadata: Metadata = {
  title: "Conditions d’utilisation — Cubelyo",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <LegalPage slug="conditions-utilisation" />;
}
