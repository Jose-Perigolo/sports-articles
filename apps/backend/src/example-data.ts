import { readFileSync } from 'node:fs';
import path from 'node:path';
import { IMAGE_PICKS } from './image-picks';

export interface ExampleArticle {
  sourceId: number;
  title: string;
  content: string;
  createdAt: Date;
  imageUrl: string;
}

// Three levels up from either src/ (tsx) or dist/ (tsc), both being one level below the
// package root, so the same path resolves before and after a build.
const CSV_PATH = path.join(__dirname, '..', '..', '..', 'docs', 'data-example.csv');

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
  columnOf('imageUrl'); // still required to be present in the fixture

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

      // imageUrl is taken from image-picks.ts, not from the fixture: see that file for why
      // the supplied URLs are not usable. A row without a pick is a bug, not a fallback.
      const pick = IMAGE_PICKS[sourceId];
      if (!pick) throw new Error(`Row ${sourceId} has no image pick in image-picks.ts`);

      return {
        sourceId,
        title,
        content: row[contentColumn],
        createdAt,
        imageUrl: pick.imageUrl,
      };
    });

  if (articles.length === 0) throw new Error(`${CSV_PATH} contains no data rows`);
  return articles;
}
