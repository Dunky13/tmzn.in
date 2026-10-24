# Node 26 compatibility handoff

Use Node 26.12.1 from `.nvmrc` and the package engine:

```sh
npm ci
npm run lint:js
npm run lint:styles
npm run build:dist
npm test
```

Webpack 5 replaces Webpack 4 and its obsolete native image/Sass chain. Dart Sass
and Sharp compile the existing source assets. Production still emits the static
site to `docs/`, including both HTML routes, hashed bundles, optimized images,
favicons, the original manifest path, robots and sitemap. JavaScript conversion
logic is unchanged; the source diff only adjusts formatting for the existing
Airbnb rules. Both linters run in production and development builds.

`npm start` runs the development server on all interfaces at port 8000 (or
`PORT`). `npm run start:dist` serves the production configuration. Dependency
installation runs the postinstall step without launching the configuration
wizard. Run `npm run setup` explicitly when intending to reconfigure the site.

Airbnb Base's published peer range requires ESLint 8.57.1, which is unsupported
upstream. Its lint rules are retained without peer-resolution bypasses; this
change does not claim that every development tool has current upstream support.
No runtime library or UI redesign is included.

The existing GitHub Pages setting publishes branch `main`, path `/docs`.
Netlify's existing publish configuration now agrees with that output directory.
No deployment is performed by this migration. Root owns hosted CI, merge and
publication verification. The FTP helper remains a template, not a verified
publishing destination.

Upstream migration references:
- https://webpack.js.org/migrate/5/
- https://sass-lang.com/blog/node-sass-is-end-of-life/
