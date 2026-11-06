import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import type { ReactNode } from "react";
import { LEGAL_DOCUMENTS, legalDocument, type LegalSlug } from "./documents";
import { LocalDataControls } from "./LocalDataControls";

// Restricted Markdown: text is escaped by React, never interpreted as raw HTML.
function inline(text: string): ReactNode {
  return text
    .split(/(https?:\/\/[^\s]+|[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})/g)
    .map((part, i) => {
      if (/^https?:/.test(part)) {
        const url = part.replace(/[.,;]+$/, "");
        return (
          <span key={i}>
            <a href={url} rel="noreferrer">
              {url}
            </a>
            {part.slice(url.length)}
          </span>
        );
      }
      if (/^[\w.+-]+@/.test(part))
        return (
          <a key={i} href={`mailto:${part}`}>
            {part}
          </a>
        );
      return part;
    });
}
function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  for (let i = 0; i < lines.length;) {
    const line = lines[i].trim();
    if (!line || line.startsWith("# ") || line.startsWith("> BROUILLON")) {
      i++;
      continue;
    }
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i++]
          .trim()
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());
        if (!cells.every((c) => /^:?-+:?$/.test(c))) rows.push(cells);
      }
      if (rows.length === 1) {
        blocks.push(
          <p key={i}>
            Aucun prestataire externe déclaré pour cette version locale.
          </p>,
        );
        continue;
      }
      blocks.push(
        <div
          className="legal-table-scroll"
          role="region"
          aria-label="Tableau à faire défiler horizontalement"
          tabIndex={0}
          key={i}
        >
          <table>
            <thead>
              <tr>
                {rows[0]?.map((c, j) => (
                  <th scope="col" key={j}>
                    {inline(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, j) => (
                <tr key={j}>
                  {row.map((c, k) => (
                    <td key={k}>{inline(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (line.startsWith("### ")) {
      blocks.push(<h3 key={i}>{inline(line.slice(4))}</h3>);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      blocks.push(<h2 key={i}>{inline(line.slice(3))}</h2>);
      i++;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- "))
        items.push(lines[i++].trim().slice(2));
      blocks.push(
        <ul key={i}>
          {items.map((item, j) => (
            <li key={j}>{inline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#|\||- |>)/.test(lines[i].trim())
    )
      paragraph.push(lines[i++].trim());
    if (!paragraph.length) {
      paragraph.push(lines[i++]);
    }
    blocks.push(<p key={i}>{inline(paragraph.join(" "))}</p>);
  }
  return blocks;
}
export function LegalPage({ slug }: { slug: LegalSlug }) {
  return (
    <main className="legal-page">
      <header className="legal-page-header">
        <Link href="/">
          <ArrowLeft size={18} aria-hidden="true" /> Retour au jeu
        </Link>
        <span>
          <FileText size={18} aria-hidden="true" /> Cubelyo
        </span>
      </header>
      <article className="legal-document">
        <p className="legal-draft" role="note">
          Brouillon · Version locale de test · À relire avant publication
        </p>
        <h1>{LEGAL_DOCUMENTS[slug]}</h1>
        <Markdown text={legalDocument(slug)} />
        {slug === "droits-rgpd" && <LocalDataControls />}
      </article>
      <nav className="legal-navigation" aria-label="Documents légaux">
        {Object.entries(LEGAL_DOCUMENTS).map(([path, title]) => (
          <Link
            key={path}
            href={`/${path}`}
            aria-current={slug === path ? "page" : undefined}
          >
            {title}
          </Link>
        ))}
      </nav>
    </main>
  );
}
