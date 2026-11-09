# Knowledge map data

The knowledge map on the graph lab page is built from these files. It was motivated by the knowledge map at https://taylor.town/kakm.

- `km_data.js`: the original hand-written core (topics linked to graphs, and the papers and articles on the site).
- `topics/*.txt`: the rest of the topics, one per line: `id|Name|prerequisite ids separated by spaces|One-sentence summary`. A line `D n` sets the field for the lines after it (field numbers are listed at the top of `build_km.js`).
- `build_km.js`: checks every link, rejects cycles, computes levels, runs the force-directed layout and labels the field groups.

To rebuild, run `node build_km.js > /dev/null`. It writes two files: `km-data.js` (every topic and position; copy it to the site root, where the page loads it when the map is needed) and `km_inline.js` (fields, papers, labels and paper levels; replace the block from `const KM_DOMAINS=` to `var KM_LAST=0;` in `index.html` with it).
