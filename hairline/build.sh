#!/bin/sh
# Bundles the kernel and every figure into public/hairline/figures.js. Run: npm run figures
cd "$(dirname "$0")"
{
  cat kernel.js
  echo 'window.hairlineFigures = {}; var hairline = (f) => { window.hairlineFigures[f.name] = f; };'
  for f in figures/*.js; do echo '(() => {'; cat "$f"; echo '})();'; done
} > ../public/hairline/figures.js
