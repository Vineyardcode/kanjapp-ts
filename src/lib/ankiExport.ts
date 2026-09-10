import { Deck, Note, Notetype, Package } from 'ankipack';
import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import KVGindex from '../kanjiData/kvg-index.json';

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

export interface ExportKanji {
  character?: string;
  /* joyo.json stores these as ARRAYS; older interfaces in this repo mistyped
     them as string, so accept both and normalise. */
  meanings?: string[] | string;
  readings_on?: string[] | string;
  readings_kun?: string[] | string;
  wk_radicals?: string[] | string;
  strokes?: number;
  grade?: number;
  jlpt_new?: number;
  freq?: number;
  [key: string]: any;
}

const toList = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.map(String).filter((s) => s.length > 0)
    : v == null || v === ''
      ? []
      : [String(v)];

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

const CSS = `
.card {
  text-align: center;
  font-family: "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif;
  font-size: 20px;
}
.kanjapp-char { font-size: 96px; line-height: 1.1; }
.kanjapp-meaning { font-size: 22px; margin: 0.4em 0; }
.kanjapp-readings { font-size: 18px; opacity: 0.85; }
.kanjapp-readings div { margin: 0.15em 0; }
.kanjapp-label { opacity: 0.6; }
.kanji { width: 240px; height: 240px; max-width: 90%; margin: 0.6em auto 0; display: block; }
/* currentColor so the strokes follow Anki's night mode instead of being
   hardcoded black on a dark background */
.kanji path {
  fill: none;
  stroke: currentColor;
  stroke-width: 4.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 350;
  stroke-dashoffset: 350;
  animation: kanjapp-draw 0.45s ease-out forwards;
}
@keyframes kanjapp-draw { to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) {
  .kanji path { animation: none; stroke-dashoffset: 0; }
}
`.trim();

const FRONT = `<div class="kanjapp-char">{{Character}}</div>`;

const BACK = `{{FrontSide}}
<hr id="answer">
<div class="kanjapp-meaning">{{Meaning}}</div>
<div class="kanjapp-readings">
  {{#Onyomi}}<div><span class="kanjapp-label">On:</span> {{Onyomi}}</div>{{/Onyomi}}
  {{#Kunyomi}}<div><span class="kanjapp-label">Kun:</span> {{Kunyomi}}</div>{{/Kunyomi}}
</div>
{{StrokeOrder}}`;

/** Fetch + parse the 4 MB KanjiVG file ONCE per export (it used to be re-fetched
 *  and re-parsed inside the per-kanji loop). */
async function loadStrokeDoc(): Promise<Document> {
  const res = await fetch('/kanjiData/joyo_kanji_vg.xml');
  if (!res.ok) throw new Error(`Could not load stroke data (HTTP ${res.status})`);
  return new DOMParser().parseFromString(await res.text(), 'text/xml');
}

/** Rebuild a clean SVG from the stroke paths only, dropping KanjiVG's inline
 *  styles and its `kvg:`-prefixed ids (which would collide and fight our CSS). */
function strokeSvg(doc: Document, character: string): string {
  const entry = (KVGindex as Record<string, string[]>)[character];
  const file = entry?.find((n) => n.length === 9);
  if (!file) return '';
  const group = doc.querySelector(`[id="kvg:${file.slice(0, -4)}"]`);
  if (!group) return '';

  const paths = Array.from(group.getElementsByTagName('path'))
    .map((p) => p.getAttribute('d'))
    .filter((d): d is string => !!d);
  if (!paths.length) return '';

  const body = paths
    .map((d, i) => `<path d="${d}" style="animation-delay:${(i * 0.35).toFixed(2)}s"/>`)
    .join('');
  return `<svg class="kanji" viewBox="0 0 109 109" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

function tagsFor(k: ExportKanji): string[] {
  const slug = (s: string) => s.trim().replace(/\s+/g, '_');
  return [
    k.jlpt_new != null ? `JLPT::N${k.jlpt_new}` : null,
    k.strokes != null ? `Strokes::${k.strokes}` : null,
    k.grade != null ? `Grade::${k.grade}` : null,
    // one tag PER radical - joining them would produce a single "A,B" tag
    ...toList(k.wk_radicals).map((r) => `Radical::${slug(r)}`),
  ].filter((t): t is string => t !== null);
}

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
    fields: [
      { name: 'Character' },
      { name: 'Meaning' },
      { name: 'Onyomi' },
      { name: 'Kunyomi' },
      { name: 'StrokeOrder' },
    ],
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
    deck.addNote(
      new Note({
        notetype,
        guid: `${GUID_PREFIX}${ch}`,
        fields: [
          ch,
          toList(k.meanings).join(', '),
          toList(k.readings_on).join('、'),
          toList(k.readings_kun).join('、'),
          strokeSvg(doc, ch),
        ],
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
