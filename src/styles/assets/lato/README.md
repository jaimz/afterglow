# Lato webfonts

Unmodified full-character-set WOFF2 files from the official Lato 2 webfont kit:
https://www.latofonts.com/files/Lato2OFLWeb.zip

Designed by Łukasz Dziedzic. Distributed under the SIL Open Font License 1.1;
see `OFL.txt`. The archive was retrieved on 2026-09-29.

`foundation/_fonts.scss` maps the nine weights (100–900) and their italic faces
to the CSS family `Lato`. Light is 300, Regular is 400 and Medium is 500.
The declarations deliberately omit `local()` so installed fonts cannot replace
these files with a different version or an incorrectly matched weight.

The shared theme loads these declarations once per Sass compilation. The
standalone CSS build copies these files and their licence to `dist/assets/lato/`.
