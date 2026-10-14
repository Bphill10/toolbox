# MGI Insight demo

A demonstration HR analytics suite for a fictional company (Meridian Greenhouse Inc.).
Every person and every survey figure in it is synthetic.

Edit the files in `src/`, then run `python3 build.py`. It stitches them back into the one
self-contained page at `dist/index.html`. Vercel runs the same build on every push.

```
src/index.html          shell, header, home page, module loader
src/modules/*.html      one file per tool (comp, offer, merit, sti, lti, ...)
src/data/               people and shared data the tools read
src/i18n.js             translations
build.py                stitches everything back into one index.html
middleware.js           username/password prompt in front of the site (Vercel)
```

`src/index.html` marks where each file goes with `{{include:<path under src/>}}`.
A module file that is not included anywhere fails the build, so a tool cannot go missing quietly.

**Add a tool:** put it in `src/modules/<name>.html`, add a
`<script type="text/plain" id="mod-<name>">{{include:modules/<name>.html}}</script>` line next to
the others in `src/index.html`, and add its card to the shell's module list.

**Don't edit `dist/`**: the next build overwrites it.

**Page views:** Vercel Web Analytics, via the `/_vercel/insights/script.js` tag in the head of each page (plain HTML, so no npm package).
