import { readFileSync } from 'node:fs';
import path from 'node:path';

export interface ExampleArticle {
  sourceId: number;
  title: string;
  content: string;
  createdAt: Date;
  imageUrl: string;
  imageSubstituted: boolean;
}

// Three levels up from either src/ (tsx) or dist/ (tsc), both being one level below the
// package root, so the same path resolves before and after a build.
const CSV_PATH = path.join(__dirname, '..', '..', '..', 'docs', 'data-example.csv');

/**
 * Source ids whose supplied Unsplash URL answers 404. Checked twice with ranged GET requests
 * (`curl -r 0-2047`) rather than HEAD, which can report a false negative on this host; the
 * remaining 13 return 206 with image/jpeg bodies of 1.6-6.2 MB. These 17 get a deterministic
 * picsum.photos URL instead — the only alteration made to the supplied data.
 */
const UNREACHABLE_IMAGE_SOURCE_IDS = new Set([
  4, 5, 9, 10, 11, 12, 15, 16, 18, 19, 21, 23, 26, 27, 28, 29, 30,
]);

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quoted) {
      if (char !== '"') {
        field += char;
      } else if (text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = false;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') field += char;
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function loadExampleArticles(): ExampleArticle[] {
  const [header, ...rows] = parseCsv(readFileSync(CSV_PATH, 'utf8'));
  if (!header) throw new Error(`${CSV_PATH} is empty`);

  const columnOf = (name: string): number => {
    const index = header.indexOf(name);
    if (index === -1) throw new Error(`${CSV_PATH} has no "${name}" column`);
    return index;
  };

  const idColumn = columnOf('id');
  const titleColumn = columnOf('title');
  const contentColumn = columnOf('content');
  const createdAtColumn = columnOf('createdAt');
  const imageUrlColumn = columnOf('imageUrl');

  const articles = rows
    .filter((row) => row.some((value) => value.trim() !== ''))
    .map((row) => {
      const sourceId = Number(row[idColumn]);
      const title = row[titleColumn];

      // Date-only in the source; anchored to UTC so the stored instant does not shift with
      // whatever timezone the seed happens to run in.
      const createdAt = new Date(`${row[createdAtColumn]}T00:00:00Z`);
      if (Number.isNaN(createdAt.getTime())) {
        throw new Error(`Row ${sourceId} has an unparseable createdAt: ${row[createdAtColumn]}`);
      }

      const imageSubstituted = UNREACHABLE_IMAGE_SOURCE_IDS.has(sourceId);

      return {
        sourceId,
        title,
        content: row[contentColumn],
        createdAt,
        imageUrl: imageSubstituted
          ? `https://picsum.photos/seed/${slugify(title)}/800/450`
          : row[imageUrlColumn],
        imageSubstituted,
      };
    });

  if (articles.length === 0) throw new Error(`${CSV_PATH} contains no data rows`);
  return articles;
}
