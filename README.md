# ericfadeyev.com

GitHub Pages serves this static site from `main`. The custom domain is set in
`CNAME`. The layout, content, and Three.js animation live in `index.html`.
The page loads the pinned Three.js modules from jsDelivr and its fonts from
Google Fonts.

At 860 CSS pixels and above, the page uses two columns. The peptide stage
sticks beside the work sections, and its pose eases as each project enters
the reading area. Below 860 pixels, the page stacks the content and draws
the peptide in a fixed canvas. The canvas extends under Safari’s toolbar
using `100lvh`; the art and scroll cues use `100svh` as a stable reference.
The mobile pose follows the article positions and finale through a shared
scroll position with brief smoothing between browser scroll updates.

TODO: add `resume.pdf` and enable its link in `index.html`.
