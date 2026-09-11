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
/* clamp, not a fixed %: a fixed large size overflows a 375px phone */
.kanjapp-char { font-size: clamp(3.5rem, 26vw, 7rem); line-height: 1.1; }
.kanjapp-meaning { font-size: 22px; margin: 0.4em 0; }
.kanjapp-readings { font-size: 18px; opacity: 0.85; }
.kanjapp-readings div { margin: 0.15em 0; }
.kanjapp-label { opacity: 0.6; }

.kanji { width: 260px; height: 260px; max-width: 88vw; margin: 0.5em auto 0; display: block; }
/* currentColor everywhere so the card follows Anki night mode */
.kanji path {
  fill: none;
  stroke: currentColor;
  stroke-width: 4.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 350;
  stroke-dashoffset: 350;
  animation: kanjapp-draw 0.45s ease-out var(--d, 0s) forwards;
}
.kanji .kanjapp-num {
  /* a fixed red rather than currentColor: it separates the numbers from the
     strokes and stays legible on both light and night-mode cards.
     NOTE: font-size is set as an SVG presentation attribute in user units,
     NOT here - a CSS px value is subject to the webview's text zoom. */
  fill: #d9534f;
  opacity: 0;
  font-family: sans-serif;
  font-weight: bold;
  animation: kanjapp-fade 0.2s ease-out var(--d, 0s) forwards;
}
@keyframes kanjapp-draw { to { stroke-dashoffset: 0; } }
@keyframes kanjapp-fade { to { opacity: 0.95; } }
@media (prefers-reduced-motion: reduce) {
  .kanji path { animation: none; stroke-dashoffset: 0; }
  .kanji .kanjapp-num { animation: none; opacity: 0.95; }
}

/* hidden by default so AnkiWeb (which does not run template JS) shows a clean
   static diagram instead of dead buttons; the script reveals them */
.kanjapp-controls { display: none; justify-content: center; align-items: center; gap: 8px; margin-top: 0.5em; }
.kanjapp-controls button {
  font: inherit; font-size: 16px; line-height: 1;
  min-width: 44px; min-height: 44px;      /* touch target */
  padding: 6px 12px; cursor: pointer;
  color: currentColor; background: transparent;
  border: 1px solid currentColor; border-radius: 6px; opacity: 0.75;
}
.kanjapp-controls button:active { opacity: 1; }
.kanjapp-count { font-size: 15px; opacity: 0.7; min-width: 4.5em; }
`.trim();

const FRONT = `<div class="kanjapp-char">{{Character}}</div>`;

/* The stroke controls are progressive enhancement: the CSS animation and the
   numbers work with JS off (AnkiWeb), and this script adds replay/stepping on
   Desktop, AnkiDroid and AnkiMobile, all of which do run template <script>.
   It re-runs on every card render, so it must be idempotent. */
const BACK = `{{FrontSide}}
<hr id="answer">
<div class="kanjapp-meaning">{{Meaning}}</div>
<div class="kanjapp-readings">
  {{#Onyomi}}<div><span class="kanjapp-label">On:</span> {{Onyomi}}</div>{{/Onyomi}}
  {{#Kunyomi}}<div><span class="kanjapp-label">Kun:</span> {{Kunyomi}}</div>{{/Kunyomi}}
</div>
<div id="kanjapp-sd">{{StrokeOrder}}</div>
<div class="kanjapp-controls" id="kanjapp-controls">
  <button type="button" onclick="kanjappStep(-1)" title="Previous stroke">&lsaquo;</button>
  <button type="button" onclick="kanjappReplay()" title="Replay">&#8635;</button>
  <button type="button" onclick="kanjappStep(1)" title="Next stroke">&rsaquo;</button>
  <span class="kanjapp-count" id="kanjapp-count"></span>
</div>
<script>
(function () {
  try {
    var root = document.getElementById('kanjapp-sd');
    if (!root) return;
    var paths = [].slice.call(root.querySelectorAll('path'));
    var nums  = [].slice.call(root.querySelectorAll('.kanjapp-num'));
    var total = paths.length;
    if (!total) return;
    var ctrls = document.getElementById('kanjapp-controls');
    var count = document.getElementById('kanjapp-count');
    var shown = total;               // the CSS animation ends fully drawn

    function paint() {
      for (var i = 0; i < total; i++) {
        var on = i < shown;
        paths[i].style.animation = 'none';
        paths[i].style.strokeDashoffset = on ? '0' : '350';
        if (nums[i]) { nums[i].style.animation = 'none'; nums[i].style.opacity = on ? '0.95' : '0'; }
      }
      if (count) count.textContent = shown + ' / ' + total;
    }
    window.kanjappStep = function (d) {
      shown = Math.max(0, Math.min(total, shown + d));
      paint();
    };
    window.kanjappReplay = function () {
      /* Restarting a finished CSS animation needs TWO phases. Just clearing the
         inline style is a no-op on first play, because nothing was overriding
         it yet - which is why replay did nothing until the user had stepped.
         Phase 1 explicitly disables the animation and resets to hidden, then a
         forced reflow commits that; phase 2 hands control back to the
         stylesheet, which the browser now sees as a change and restarts. */
      for (var i = 0; i < total; i++) {
        paths[i].style.animation = 'none';
        paths[i].style.strokeDashoffset = '350';
        if (nums[i]) { nums[i].style.animation = 'none'; nums[i].style.opacity = '0'; }
      }
      void root.offsetWidth;
      for (var i = 0; i < total; i++) {
        paths[i].style.animation = '';
        paths[i].style.strokeDashoffset = '';
        if (nums[i]) { nums[i].style.animation = ''; nums[i].style.opacity = ''; }
      }
      shown = total;
      if (count) count.textContent = total + ' / ' + total;
    };
    if (ctrls) ctrls.style.display = 'flex';
    if (count) count.textContent = total + ' / ' + total;
  } catch (e) { /* never break the card over the controls */ }
})();
</script>`;

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

  const ds = Array.from(group.getElementsByTagName('path'))
    .map((p) => p.getAttribute('d'))
    .filter((d): d is string => !!d);
  if (!ds.length) return '';

  /* KanjiVG paths always begin with an absolute moveto, so the stroke's start
     point (where its order number goes) can be read straight off the `d`. */
  const startOf = (d: string): [number, number] | null => {
    const m = /^[Mm]\s*(-?[\d.]+)[,\s]+(-?[\d.]+)/.exec(d.trim());
    return m ? [parseFloat(m[1]), parseFloat(m[2])] : null;
  };

  const delay = (i: number) => `--d:${(i * 0.35).toFixed(2)}s`;
  const strokes = ds.map((d, i) => `<path d="${d}" style="${delay(i)}"/>`).join('');
  const numbers = ds
    .map((d, i) => {
      const p = startOf(d);
      if (!p) return '';
      /* user units inside the 109x109 viewBox, so it scales with the glyph
         and is immune to the webview's CSS text zoom */
      return `<text class="kanjapp-num" x="${p[0]}" y="${p[1]}" font-size="4.5" text-anchor="middle" style="${delay(i)}">${i + 1}</text>`;
    })
    .join('');

  return `<svg class="kanji" viewBox="0 0 109 109" xmlns="http://www.w3.org/2000/svg">${strokes}${numbers}</svg>`;
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
