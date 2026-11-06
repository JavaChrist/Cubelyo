import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import edition from "../../../legal/current.json";

export const LEGAL_DOCUMENTS = {
  confidentialite: "Politique de confidentialité",
  "conditions-utilisation": "Conditions d’utilisation",
  "conditions-vente": "Conditions générales de vente",
  "mentions-legales": "Mentions légales",
  "droits-rgpd": "Vos droits sur les données",
} as const;
export type LegalSlug = keyof typeof LEGAL_DOCUMENTS;
export function legalDocument(slug: LegalSlug) {
  return readFileSync(
    join(process.cwd(), "legal/generated", edition.directory, `${slug}.md`),
    "utf8",
  );
}
