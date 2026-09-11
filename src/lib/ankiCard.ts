/**
 * The Anki card itself: the note type's CSS, its front/back templates and the
 * stroke-order SVG they render.
 *
 * Split out of ankiExport.ts on purpose. The exporter pulls in ankipack and
 * sql.js's ~658 KB WASM; the in-app card preview needs none of that, only the
 * templates - and the preview is only honest if it renders the SAME strings
 * that get written into the .apkg, so there is exactly one copy of them here.
 */

import KVGindex from '../kanjiData/kvg-index.json';

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


export const CSS = `
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
  /* --len is THIS stroke's own measured length. It used to be a flat 350 for
     every stroke, which meant a short stroke (a dot, a tick) stayed hidden for
     ~94% of its window and then popped into place instead of being drawn. */
  stroke-dasharray: var(--len, 350);
  stroke-dashoffset: var(--len, 350);
  animation: kanjapp-draw var(--dur, 0.7s) ease-out var(--d, 0s) forwards;
}
.kanji .kanjapp-num {
  /* a fixed red rather than currentColor: it separates the numbers from the
     strokes and stays legible on both light and night-mode cards.
     NOTE: font-size is set as an SVG presentation attribute in user units,
     NOT here - a CSS px value is subject to the webview's text zoom. */
  fill: #d9534f;
  /* a white halo painted BEHIND the glyph: without it a small number sitting
     next to a 4.5-unit-thick stroke is simply swallowed by it. Readable on
     both light and night-mode cards. */
  stroke: #fff;
  stroke-width: 1.7;
  paint-order: stroke;
  opacity: 0;
  font-family: sans-serif;
  font-weight: bold;
  animation: kanjapp-fade 0.25s ease-out var(--d, 0s) forwards;
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

export const FRONT = `<div class="kanjapp-char">{{Character}}</div>`;

/* The stroke controls are progressive enhancement: the CSS animation and the
   numbers work with JS off (AnkiWeb), and this script adds replay/stepping on
   Desktop, AnkiDroid and AnkiMobile, all of which do run template <script>.
   It re-runs on every card render, so it must be idempotent. */
export const BACK = `{{FrontSide}}
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
        paths[i].style.strokeDashoffset = on ? '0' : 'var(--len, 350)';
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
        paths[i].style.strokeDashoffset = 'var(--len, 350)';
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
export async function loadStrokeDoc(): Promise<Document> {
  const res = await fetch('/kanjiData/joyo_kanji_vg.xml');
  if (!res.ok) throw new Error(`Could not load stroke data (HTTP ${res.status})`);
  return new DOMParser().parseFromString(await res.text(), 'text/xml');
}

/* Drawing pace, in seconds. See the comment in strokeSvg. */
const TOTAL_TARGET_S = 5.5;
const MIN_STEP_S = 0.35;
const MAX_STEP_S = 0.9;
const MIN_DUR_S = 0.4;
const MAX_DUR_S = 0.8;

/* Stroke-number placement, in the 109x109 viewBox's user units. */
const GLYPH_C = 54.5;      // the glyph's centre; labels are pushed away from it
const NUM_OFFSET = 6;      // how far off the stroke's start to sit
const NUM_SEP = 7.5;       // closest two labels may get before one is moved
const NUM_MARGIN = 4.5;    // keep labels inside the viewBox
const NUM_SIZE = 6.5;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* One hidden, reused <path> for measuring. getTotalLength() is unreliable on a
   detached element in some engines, so the probe lives in the document. */
let probe: SVGPathElement | null = null;
function measureLengths(ds: string[]): string[] {
  try {
    if (!probe) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 109 109');
      svg.setAttribute('aria-hidden', 'true');
      svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;opacity:0';
      probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      svg.appendChild(probe);
      document.body.appendChild(svg);
    }
    return ds.map((d) => {
      probe!.setAttribute('d', d);
      const len = probe!.getTotalLength();
      // +1 so rounding can never leave a sliver of the stroke undrawn
      return Number.isFinite(len) && len > 0 ? (len + 1).toFixed(1) : '350';
    });
  } catch {
    // no DOM, or an engine that refuses to measure: the flat fallback still works
    return ds.map(() => '350');
  }
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

  /* Pace the drawing by stroke count instead of a flat per-stroke delay. A
     fixed step is either too fast to follow on a 4-stroke kanji or interminable
     on a 20-stroke one; aiming at a roughly constant TOTAL keeps both watchable.
     The step is clamped so it never gets frantic or glacial at the extremes. */
  const step = clamp(TOTAL_TARGET_S / ds.length, MIN_STEP_S, MAX_STEP_S);
  // a stroke takes a shade longer than the gap before the next one, so strokes
  // only just overlap rather than piling up
  const dur = clamp(step * 1.05, MIN_DUR_S, MAX_DUR_S);

  const lens = measureLengths(ds);
  const delay = (i: number) => `--d:${(i * step).toFixed(2)}s`;
  const strokes = ds
    .map((d, i) => `<path d="${d}" style="${delay(i)};--len:${lens[i]}"/>`)
    .join('');
  /* Stroke numbers sit beside the start of their stroke, nudged away from the
     glyph's centre so a 4.5-unit-thick stroke does not swallow them. Strokes
     that begin at nearly the same point (門's two verticals, say) would still
     stack their labels, so each one probes outward and around until it finds a
     spot clear of the labels already placed. */
  const placed: Array<[number, number]> = [];
  const place = (p: [number, number]): [number, number] => {
    const base = Math.atan2(p[1] - GLYPH_C, p[0] - GLYPH_C);
    let fallback: [number, number] | null = null;
    for (const dist of [NUM_OFFSET, NUM_OFFSET + 3.5, NUM_OFFSET + 7]) {
      for (const turn of [0, 0.55, -0.55, 1.1, -1.1, 1.75, -1.75]) {
        const a = base + turn;
        const xy: [number, number] = [
          clamp(p[0] + Math.cos(a) * dist, NUM_MARGIN, 109 - NUM_MARGIN),
          clamp(p[1] + Math.sin(a) * dist, NUM_MARGIN, 109 - NUM_MARGIN),
        ];
        fallback ??= xy;
        if (placed.every(([qx, qy]) => Math.hypot(qx - xy[0], qy - xy[1]) >= NUM_SEP)) {
          placed.push(xy);
          return xy;
        }
      }
    }
    // every candidate was crowded: take the first one rather than drop the label
    placed.push(fallback!);
    return fallback!;
  };

  const numbers = ds
    .map((d, i) => {
      const p = startOf(d);
      if (!p) return '';
      const [x, y] = place(p);
      /* user units inside the 109x109 viewBox, so it scales with the glyph
         and is immune to the webview's CSS text zoom */
      return `<text class="kanjapp-num" x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${NUM_SIZE}" text-anchor="middle" dominant-baseline="central" style="${delay(i)}">${i + 1}</text>`;
    })
    .join('');

  return `<svg class="kanji" viewBox="0 0 109 109" xmlns="http://www.w3.org/2000/svg" style="--dur:${dur.toFixed(2)}s">${strokes}${numbers}</svg>`;
}

export function tagsFor(k: ExportKanji): string[] {
  const slug = (s: string) => s.trim().replace(/\s+/g, '_');
  return [
    k.jlpt_new != null ? `JLPT::N${k.jlpt_new}` : null,
    k.strokes != null ? `Strokes::${k.strokes}` : null,
    k.grade != null ? `Grade::${k.grade}` : null,
    // one tag PER radical - joining them would produce a single "A,B" tag
    ...toList(k.wk_radicals).map((r) => `Radical::${slug(r)}`),
  ].filter((t): t is string => t !== null);
}


/** The five note fields, in the order the note type declares them. */
export function fieldsFor(doc: Document, k: ExportKanji): Record<string, string> {
  const ch = String(k.character ?? '');
  return {
    Character: ch,
    Meaning: toList(k.meanings).join(', '),
    Onyomi: toList(k.readings_on).join('、'),
    Kunyomi: toList(k.readings_kun).join('、'),
    StrokeOrder: strokeSvg(doc, ch),
  };
}

/** The subset of Anki's template syntax these two templates actually use:
 *  {{Field}}, {{#Field}}...{{/Field}} and {{^Field}}...{{/Field}}. Field
 *  content is inserted raw, exactly as Anki does - it is HTML, which is how
 *  the StrokeOrder field can be an <svg>. */
function renderTemplate(tpl: string, fields: Record<string, string>): string {
  return tpl
    .replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_m, n, body) => (fields[n] ? body : ''))
    .replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_m, n, body) => (fields[n] ? '' : body))
    .replace(/\{\{(\w+)\}\}/g, (_m, n) => fields[n] ?? '');
}

export interface PreviewOptions {
  /** 'front' is the question side, 'back' the answer side. */
  side?: 'front' | 'back';
  /** Anki's night mode - worth checking, since the card draws in currentColor. */
  night?: boolean;
}

/**
 * A standalone HTML document showing one side of one card, for an iframe's
 * `srcdoc`. It reproduces Anki's own wrapper (`<div id="qa" class="card">`,
 * plus the `nightMode` classes) so what you see here is what the phone shows.
 *
 * Render it in a `sandbox="allow-scripts"` iframe: template <script> has to
 * run for the stepping controls, but the card gets an opaque origin and so
 * cannot reach back into the app. Do NOT add allow-same-origin - together with
 * allow-scripts that would let the frame remove its own sandbox.
 */
export function renderCardHtml(
  fields: Record<string, string>,
  { side = 'back', night = false }: PreviewOptions = {},
): string {
  const front = renderTemplate(FRONT, fields);
  const body =
    side === 'front' ? front : renderTemplate(BACK, { ...fields, FrontSide: front });
  const nightClass = night ? ' nightMode night_mode' : '';

  return `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
html, body { margin: 0; padding: 0; }
body { background: ${night ? '#2c2c2c' : '#fff'}; color: ${night ? '#fff' : '#000'}; }
#qa { padding: 1em 0.5em; }
${CSS}
</style></head>
<body class="${nightClass.trim()}">
<div id="qa" class="card${nightClass}">${body}</div>
</body></html>`;
}
