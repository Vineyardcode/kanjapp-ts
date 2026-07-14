# kanjapp error page

Animated 3D error page for [kanjapp](../). It draws a random kanji stroke by
stroke (a glowing "pen" rides the active stroke), holds it, then switches to a
new character — over a starfield with bloom.

## Error message

The message is read from the URL query string, so the app (or your host) can
redirect here with the current error:

```
/?message=Server%20under%20maintenance&code=503
```

- `message` — the text to display (falls back to a generic message if omitted)
- `code` — optional; shown as an `Error <code>` heading

## Develop

```bash
npm install
npm run dev
```

## Deploy (Vercel)

This app lives in the `error-page/` subfolder of the `kanjapp-ts` repo. The
Vercel project is configured with **Root Directory = `error-page`** and the
**Vite** framework preset (build `npm run build`, output `dist`).

## Credits

Kanji stroke data come from the [KanjiVG project](https://kanjivg.tagaini.net/index.html).
