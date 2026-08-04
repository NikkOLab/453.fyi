# CS 453 Interactive Syllabus

An interactive, single-page syllabus for CS 453 Computer Networks.

## Project structure

```text
encapsulated-syllabus/
├── index.html
├── cs453-syllabus-plain.html
├── css/
│   └── styles.css
├── js/
│   └── script.js
├── images/
│   ├── spider-welcome.png
│   └── icons/
│       ├── favicon.ico
│       ├── favicon.png
│       └── apple-touch-icon.png
└── README.md
```

## Open locally

Double-click `index.html`, or run a local server from this folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Customize

- Course content: `index.html`
- Plain formatted version: `cs453-syllabus-plain.html`
- Layout and animation styles: `css/styles.css`
- Interactive behavior: `js/script.js`
- Images and browser icons: `images/`
- Printable PDF: use the **Print / Save as PDF** button

## Hosting

The entire folder can be hosted directly on GitHub Pages, Netlify, or a university web server. Keep the folder structure intact so relative asset paths continue to work.
