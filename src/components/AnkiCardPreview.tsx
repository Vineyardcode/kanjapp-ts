import { useEffect, useRef, useState } from 'react';
import type { ExportKanji } from '../lib/ankiCard';
import '../styles/AnkiCardPreview.css';

/**
 * Shows the real Anki card inside the app, so the template can be iterated on
 * without exporting a .apkg and moving it to a phone.
 *
 * It renders the SAME strings that go into the deck (ankiCard.ts owns both) in
 * a sandboxed iframe sized like a phone, because that is where the card is
 * actually read. The sandbox has allow-scripts but deliberately NOT
 * allow-same-origin: the template's stepping script has to run, and with both
 * flags the frame could drop its own sandbox.
 */

type Side = 'front' | 'back';

/* a mid-range phone's viewport; the card is built at this size and scaled */
const PHONE_W = 360;
const PHONE_H = 720;

interface Props {
  kanji: ExportKanji[];
  onClose: () => void;
}

const AnkiCardPreview = ({ kanji, onClose }: Props) => {
  const [index, setIndex] = useState(0);
  const [side, setSide] = useState<Side>('back');
  const [night, setNight] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // the 4 MB stroke document is parsed once and reused for every kanji
  const docRef = useRef<Document | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const current = kanji[index];

  /* The card is laid out at a real phone's size and then scaled to fit, rather
     than being squeezed into whatever width this modal has. Anything else would
     be a preview of a layout the phone never uses. */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const fit = () => {
      const s = Math.min(stage.clientWidth / PHONE_W, stage.clientHeight / PHONE_H, 1);
      stage.style.setProperty('--s', String(s));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    if (!current) return;

    (async () => {
      try {
        setError(null);
        const { fieldsFor, loadStrokeDoc, renderCardHtml } = await import('../lib/ankiCard');
        if (!docRef.current) docRef.current = await loadStrokeDoc();
        if (cancelled) return;
        setHtml(renderCardHtml(fieldsFor(docRef.current, current), { side, night }));
      } catch (err) {
        if (cancelled) return;
        console.error('Card preview failed:', err);
        setError(err instanceof Error ? err.message : 'Could not render the card');
      }
    })();

    return () => { cancelled = true; };
  }, [current, side, night]);

  if (!current) return null;

  const step = (d: number) => {
    setIndex((i) => (i + d + kanji.length) % kanji.length);
    setHtml(null);
  };

  return (
    <div className="ankiprev-scrim" onClick={onClose}>
      <div className="ankiprev" onClick={(e) => e.stopPropagation()}>

        <div className="ankiprev-bar">
          <h5>Anki card &mdash; {current.character}</h5>
          <button type="button" className="ankiprev-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className="ankiprev-stage" ref={stageRef}>
          {error ? (
            <p className="ankiprev-error">{error}</p>
          ) : html === null ? (
            <p className="ankiprev-loading">Rendering&hellip;</p>
          ) : (
            <div className="ankiprev-device" style={{ width: PHONE_W, height: PHONE_H }}>
              <iframe
                /* keyed so switching card/side/theme remounts the frame and the
                   draw animation runs from the start, like a fresh card would */
                key={`${current.character}-${side}-${night}`}
                className="ankiprev-frame"
                title={`Anki card preview for ${current.character}`}
                sandbox="allow-scripts"
                srcDoc={html}
              />
            </div>
          )}
        </div>

        <div className="ankiprev-controls">
          <button type="button" onClick={() => step(-1)} disabled={kanji.length < 2}><h5>&lsaquo; Kanji</h5></button>
          <button type="button" onClick={() => setSide((s) => (s === 'back' ? 'front' : 'back'))}>
            <h5>{side === 'back' ? 'Show front' : 'Show back'}</h5>
          </button>
          <button type="button" data-active={night || undefined} onClick={() => setNight((n) => !n)}>
            <h5>{night ? 'Night mode' : 'Day mode'}</h5>
          </button>
          <button type="button" onClick={() => step(1)} disabled={kanji.length < 2}><h5>Kanji &rsaquo;</h5></button>
        </div>

        <p className="ankiprev-note">
          {index + 1} / {kanji.length} &middot; this is the exported card itself, controls included.
        </p>

      </div>
    </div>
  );
};

export default AnkiCardPreview;
