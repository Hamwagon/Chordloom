# Local SoundFont engine

spessasynth_core 4.3.22 by Spessasus, Apache-2.0; dependency stb-vorbis 0.0.6, Apache-2.0. Upstream source: https://github.com/spessasus/spessasynth_core and the official npm packages. Included license files apply. The distributed engine is bundled/minified with esbuild 0.28.2 for browser workers; source logic was not modified.

No runtime CDN or network access is used. WebAssembly Vorbis decoding is embedded by the upstream package. The app runs the engine in a local Blob worker, renders PCM, and plays it through the existing HTML audio element.

To rebuild the vendor file from pinned npm packages, install spessasynth_core@4.3.22, stb-vorbis@0.0.6, and esbuild@0.28.2 in a scratch project, then bundle spessasynth_core/dist/index.js with --bundle --format=iife --global-name=SpessaCore --platform=browser --target=es2020 --minify --legal-comments=eof. Output: spessasynth_core-4.3.22.js. Run node app/build.cjs to update the inline single-file app.
