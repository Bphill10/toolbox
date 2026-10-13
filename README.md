# Toolbox

Edit the files in `src/`, then run `python3 build.py`. It writes one
self-contained `index.html` you can open or host anywhere.

```
src/index.html          shell, header, home page
src/modules/*.html      one file per tool
src/data/*.json         people and shared data  -> window.DATA.<name>
src/i18n.js             translations
build.py                stitches everything back into one index.html
```

**Add a tool:** copy `src/modules/people.html` to a new file, change `data-page`,
and add its `nav.<name>` key to every language in `src/i18n.js`. It shows up in
the nav automatically.

**Don't edit `index.html` at the root** — the next build overwrites it.
