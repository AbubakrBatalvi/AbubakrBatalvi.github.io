# Abubakr Nauman: Personal Site and Graph Lab

My personal website: independent mathematics research, projects, and a graph lab of 48 interactive pages rebuilt from my Desmos graphs (prime counting, the logarithmic integral, interpolation, approximation, simulations).

## What's here

| Path | What it is |
|---|---|
| `index.html` | The whole site: front page, intro animation and the WebGL graph lab |
| `thumbs.js` | Preview images for every graph, loaded after the front page appears |
| `mathquill.js` | The equation editor used by the "Your own function…" options |
| `papers/` | Research papers and notes (PDF) |
| `projects/` | Project materials (PDF) |
| `.nojekyll` | Tells GitHub Pages to serve the files exactly as they are |

There is no build step. The site is plain HTML, CSS and JavaScript and runs from any static host.

## Running it locally

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

then visit http://localhost:8000.

## How this was made

The research questions, the Desmos graphs the lab is built from, and the direction of the work are mine. The interactive site was built with the help of AI tools (Claude), and AI tools were also used to draft, check and numerically verify parts of the papers.

## Credits

- [MathQuill](https://github.com/desmosinc/mathquill) (Desmos fork), MPL-2.0, bundled as `mathquill.js`
- [dat.GUI](https://github.com/dataarts/dat.gui), Apache-2.0, loaded from cdnjs
- [MathJax](https://www.mathjax.org/), Apache-2.0, loaded from cdnjs

## Contact

- Email: abubakrbatalvi@gmail.com
- LinkedIn: https://www.linkedin.com/in/abubakrbatalvi
- Medium: https://medium.com/@abubakrbatalvi
