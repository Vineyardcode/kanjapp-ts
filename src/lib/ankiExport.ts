import { Deck, Note, Notetype, Package } from 'ankipack';
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
/* the card itself lives in ankiCard.ts, so the preview can render the very
   same templates without dragging ankipack and the sql.js WASM in with it */
import { BACK, CSS, FRONT, loadStrokeDoc, fieldsFor, tagsFor } from './ankiCard';
import type { ExportKanji } from './ankiCard';
export type { ExportKanji };

/**
 * Builds an Anki .apkg deck entirely in the browser and hands it to the user as
 * a download. This replaces the old AnkiConnect integration, which required the
 * AnkiConnect add-on, a manual `webCorsOriginList` edit and a running copy of
 * Anki, and only ever worked on desktop.
 *
 * This module is loaded via dynamic import() so neither ankipack nor sql.js's
 * ~658 KB WASM is in the main bundle for people who never export.
 *
 * NOTE: sql.js hashes note checksums with crypto.subtle, which requires a
 * secure context. Works on HTTPS and on localhost; will throw if the dev server
 * is reached over a plain-http LAN address.
 */

/* ---------------------------------------------------------------------------
   FROZEN CONTRACT.
   Anki matches notes by guid globally and reuses a note type by id. Changing
   the ids, the five field names or the template name would make a returning
   user's re-import count as "conflicting" and silently skip their notes.
   If this ever has to change, mint a NEW id and a NEW guid prefix, and tell
   people to import it as a fresh deck.
   --------------------------------------------------------------------------- */
const NOTETYPE_ID = 1740000000001;
const DECK_ID = 1740000000002;
const NOTETYPE_NAME = 'Kanjapp Kanji';
/* One fixed deck name. Notes are matched by guid regardless of deck, so
   exporting under a second name would update the original notes in place and
   leave the new deck empty. */
export const DECK_NAME = 'Kanjapp';
const GUID_PREFIX = 'kanjapp:v1:';
const FIELD_ORDER = ['Character', 'Meaning', 'Onyomi', 'Kunyomi', 'StrokeOrder'] as const;

export interface ExportResult {
  filename: string;
  count: number;
  bytes: number;
}

/**
 * Build a .apkg from the given kanji and trigger a download.
 * @param onProgress called with the COUNT of notes built so far (not a fraction)
 */
/** Build the package without serialising or downloading it. Exported so the
 *  deck contents can be inspected/tested without writing a file. */
export async function buildKanjiPackage(
  kanji: ExportKanji[],
  onProgress?: (done: number, total: number) => void,
) {
  // ankipack rejects a package where two notes share a guid
  const unique = new Map<string, ExportKanji>();
  for (const k of kanji) if (k?.character) unique.set(k.character, k);
  const items = [...unique.values()];
  if (!items.length) throw new Error('No kanji selected to export.');

  const [doc, SQL] = await Promise.all([
    loadStrokeDoc(),
    initSqlJs({ locateFile: () => wasmUrl }),
  ]);

  const notetype = new Notetype({
    id: NOTETYPE_ID,
    name: NOTETYPE_NAME,
    css: CSS,
    sortFieldIndex: 0,
    fields: FIELD_ORDER.map((name) => ({ name })),
    templates: [{ name: 'Recognition', questionFormat: FRONT, answerFormat: BACK }],
  });

  // config: null ships no preset of our own; omitting it would add a
  // "Kanjapp Config" scheduler preset to the user's collection.
  const deck = new Deck({
    id: DECK_ID,
    name: DECK_NAME,
    description: 'Kanji exported from kanjapp.',
    config: null,
  });

  const total = items.length;
  for (let i = 0; i < total; i++) {
    const k = items[i];
    const ch = k.character as string;
    // built once per note: strokeSvg walks the 4 MB stroke document
    const f = fieldsFor(doc, k);
    deck.addNote(
      new Note({
        notetype,
        guid: `${GUID_PREFIX}${ch}`,
        // the same field builder the in-app preview uses, so the two can
        // never drift apart
        fields: FIELD_ORDER.map((name) => f[name]),
        tags: tagsFor(k),
      }),
    );

    if (onProgress && (i % 25 === 0 || i === total - 1)) onProgress(i + 1, total);
    // yield to the main thread so the progress bar can actually paint
    if (i % 50 === 49) await new Promise((r) => setTimeout(r));
  }

  const pkg = new Package();
  pkg.addDeck(deck);
  return { pkg, SQL, total };
}

/** Build a .apkg from the given kanji and trigger a download. */
export async function exportKanjiApkg(
  kanji: ExportKanji[],
  onProgress?: (done: number, total: number) => void,
): Promise<ExportResult> {
  const { pkg, SQL, total } = await buildKanjiPackage(kanji, onProgress);
  const bytes = await pkg.toUint8Array(SQL);

  const filename = `kanjapp-${total}-kanji.apkg`;
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/octet-stream' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // revoke late: Safari can still be reading the blob when click() returns
  setTimeout(() => URL.revokeObjectURL(url), 10_000);

  return { filename, count: total, bytes: bytes.length };
}
