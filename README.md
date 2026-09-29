# Home Bites · بيت سيرين

Website for Home Bites (بيت سيرين), a home kitchen in Jabal al-Baddawi, Tripoli. Arabic, right-to-left.

Plain HTML + CSS + JavaScript: no build step and no libraries. It works when `index.html` is double-clicked and when it's hosted.

## Run locally
Open `index.html` in a browser, or serve the folder:

```
python -m http.server 8787
```

## Deploy (Netlify)
Import this repo in Netlify. `netlify.toml` already sets the publish directory to the repo root, with no build command.

## Editing
- **Menu, prices, WhatsApp number, delivery fee:** `js/menu-data.js`
- **Text and sections:** `index.html`
- **Styles:** `css/styles.css`
- **3D boxes in the hero (pure CSS 3D):** `js/stage3d.js`
- **Feedback wall:** `js/wall.js`
- **Cart and WhatsApp order:** `js/cart.js`

After changing CSS or JS, bump the `?v=` number on its `<link>`/`<script>` tag in `index.html` so returning visitors get the new file.
