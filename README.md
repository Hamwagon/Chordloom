# Chordloom

Version 1.5 · A local chord progression studio with Standard MIDI File export, plus a separate native VST3 source project for FL Studio on Windows.

## Start making music now

Open **Chordloom.html** in Chrome or Edge (double-click it). It is a self-contained offline app; no installation, account, external dependencies, or internet connection is needed for generation, preview, session save/load, or MIDI export.

1. Choose root, scale, progression recipe, chord color, and voicing.
2. Use the ? buttons to learn what each control does. Choose among 14 progression recipes, 26 chord colors, and 10 voicings. Generate variation now follows the selected recipe instead of choosing an unrelated pattern. Choose 4 or 8 chords. Change an individual chord with its degree dropdown. Lock a degree to preserve it on regeneration; changing the global key/color can still change its notes.
3. Choose a root octave from −1 through 9, then set tempo, one of 17 rhythms, bars per chord, velocity, and note length. The standalone app uses 4/4.
4. Click Play to hear the built-in synth through the browser audio player. Sound on is enabled by default; adjust Volume beside Play. The built-in synth needs no MIDI device, AudioContext, internet or soundfont. The Soundbank selector below the transport adds 24 factory instrument tones and support for local SF2/SF3 files. Audio is synthesized locally into a PCM WAV and follows the same note events as MIDI export.
5. Click Export MIDI. Select an instrument in FL Studio and drag the downloaded .mid file into its Piano roll, or use the Piano roll File > Import MIDI file command. The file contains one channel, note velocities, tempo, time signature, and the exact full progression duration. Set FL Studio tempo to match if its import workflow preserves your project tempo.

The app displays scientific octaves (C4 = MIDI note 60). FL Studio may use different octave labels; note numbers are the same. Chord names use enharmonic pitch-class spelling rather than key-specific notation.

## Tablature and chord fingerings

Open **Tablature & chord fingerings** below the soundbank controls. Choose an instrument/tuning, capo, pitch-matching mode, fret limit and hand span. Each chord has up to four suggested shapes, a finger-number diagram, sounding notes and rhythm-aware text tab. Export tab .txt downloads the arrangement. See TABLATURE.md for the matching rules and conventions.

Playable arrangement keeps every voiced pitch class and the actual bass pitch class, while changing octave placement or doubling notes to fit strings. Exact MIDI pitches requires every original voiced MIDI note on its own string. An impossible grip is reported; tab export stays disabled until every chord has a shape. This panel does not change preview or MIDI notes.

## Add harmony

Use Add harmony in the palette for scale thirds, fourths, fifths, sixths, multiple voices or octave doubles. Follow the highest or lowest voiced note and set the added notes’ velocity with Harmony level. Original chord notes remain in place. Added tones appear in lilac, join the chord before rhythm is applied, and are included in playback, live/exported MIDI and tablature. Base chord symbols and added notes are labeled separately. See HARMONIES.md.

## SoundFonts and instruments

Choose Chordloom Factory in Soundbank for 24 distinct synthesized instrument approximations, or click Load SoundFont to load SF2/SF3 banks locally. Instrument lists the selected bank’s presets. Play, Sound on and Volume control preview playback; MIDI export retains the same notes. Unload removes a local bank from memory. See SOUNDFONTS.md for bank formats, session restore and instructions.

## Harmony controls

Progression recipe chooses root-degree order; Chord color chooses tones; Voicing chooses register, spacing and selected omissions. Each has hover/focus/tap help, a context-specific explanation, and a compact summary. Escape dismisses help. See HARMONY.md for the complete option guide.

Expanded harmony, register, rhythm and fretted-instrument controls belong to the standalone app. The FL Piano roll script and native source keep their previously documented control sets and all 70 scales.

## Scales and modes

The app, FL Piano roll script and native source contain 70 named scales, grouped by family:

- All seven major-scale modes: Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian and Locrian.
- All seven modes of harmonic minor, ascending/jazz melodic minor, harmonic major, double harmonic, Neapolitan minor and Neapolitan major.
- All five major-pentatonic modes, plus Hirajoshi, In Sen, Iwato and Kumoi.
- Major/minor blues, whole tone, both diminished/octatonic forms, two augmented forms, four bebop scales and chromatic.

The standalone app also has Custom: enter any 3–12 distinct ascending semitones from 0 to 11 starting with 0 (e.g. 0,1,4,6,9). These are 12-tone equal-tempered collections; microtonal tuning and an exhaustive list of names from every musical tradition are outside this catalog. Melodic minor uses its ascending/jazz form in both directions.

Chords stack alternating notes of the selected collection and wrap at its actual note count. Pentatonic, hexatonic, octatonic and chromatic collections therefore have 5, 6, 8 and 12 degree choices. Unrecognized chord shapes show exact semitone intervals in brackets rather than an inaccurate chord quality.

Scale definitions are in app/scale-catalog.json. After editing browser sources, run node app/build.cjs to rebuild the self-contained Chordloom.html.

Theory references: [Open Music Theory collections](https://viva.pressbooks.pub/openmusictheory/chapter/collections/) and [chord-scale theory](https://viva.pressbooks.pub/openmusictheory/chapter/chord-scale-theory/) describe the collections and construction approach. Modal interval arrays are generated by rotating each parent scale to a new tonic.

## Live MIDI from the standalone app

Expand Live MIDI & session tools and click Connect MIDI. Choose an output port. The app sends notes on MIDI channel 1. No SysEx, MIDI input, clock, or transport sync is requested or implemented.

To drive FL Studio, you need an existing virtual MIDI loopback port or hardware MIDI routing. In FL Studio's Options > MIDI settings, enable the corresponding input. This project does not install a virtual MIDI driver. The browser and FL Studio must use the same physical/virtual route.

Web MIDI depends on browser support and permission. If direct file access does not expose MIDI, serve this directory over localhost using Python: python -m http.server 8766 --bind 127.0.0.1, then visit http://127.0.0.1:8766/Chordloom.html in Chrome or Edge. Exported .mid files work independently of Web MIDI support. Browser playback is best-effort scheduling, has its own tempo, and does not follow FL Studio transport. Stop before changing MIDI routing or closing the app. Stop releases all channel-1 notes on the selected output, so reserve that channel for this app.

Save session downloads a JSON file with settings, degrees, and locks. Load session validates and restores it. Sessions are not automatically saved. Version-2, version-3 and version-4 session files also remember preview bank/preset metadata; local font files must be reselected after reopening the app. Versions 3/4 also remember tablature options and selected shapes; version 4 adds harmony settings. Versions 1–3 remain accepted and start with harmony off. No data is sent to a server.

## Generate directly inside FL Studio without a VST build

The FL Studio/Chordloom.pyscript file runs from the Piano roll Scripts menu and generates editable chord notes for any instrument. Copy it to your User data Settings/Piano roll scripts folder. See FL Studio/INSTALL.md. It includes triads/sevenths/ninths, close/smooth/open voices, generated variations, pulses and arpeggios. The script passed API-contract tests but has not been run in FL Studio.

## Native FL Studio VST3

**plugin/ contains source code, not an installable .vst3 binary.** The authoring machine has no C++ compiler or CMake. Native compilation and FL Studio testing remain outstanding.

See **plugin/BUILD.md** for prerequisites, build commands, installation location, routing and verification. A Windows CI build workflow is included under plugin/.github/workflows/build.yml; when the plugin folder is the root of a GitHub repository, it builds and uploads the VST3 artifact. This workflow has not been run here.

The native plugin uses host tempo/transport and has its own automatable controls, four-chord patterns, generated variations, triads/sevenths/ninths, inversions, gate, and channel controls. It emits MIDI and silent audio; route it to a target instrument. The standalone app has editable cards, smooth voicings, locks, an arpeggio rhythm, session files, and MIDI export. The two versions have different interfaces and do not share session/preset files.

For a target VST instrument: set Chordloom wrapper MIDI Output port to an unused number (e.g. 10), then set the target wrapper MIDI Input port to the same number. For native FL generators without these wrapper ports, MIDI file import is the supported companion workflow. Disable Smart disable on the silent generator if needed. Host MIDI output support must be verified after building.

## Included files

- Chordloom.html: self-contained app; recommended entry point.
- app/: editable buildless source, plus test-engine.cjs.
- examples/: C-minor held and arpeggiated MIDI examples.
- FL Studio/: Piano roll script, installation guide, and API-contract tests.
- plugin/: JUCE/CMake VST3 source, engine tests, build instructions, optional CI workflow.
- SOUNDFONTS.md: instrument and local soundfont guide.
- HARMONIES.md: added harmony intervals, source voices and level.
- soundfonts/: original factory SF2, SF3 example, builder and licenses.
- TABLATURE.md: tunings, capo, diagrams, matching modes and tab export.
- HARMONY.md: detailed guide to the progression, chord-color and voicing controls.
- Preview.png: verified desktop screenshot.
- VERIFICATION.md: completed checks and limits.

## Verification

Run node app/test-engine.cjs, node app/test-harmony.cjs, node app/test-expansion.cjs, node app/test-fretboard.cjs and node app/test-soundfont.cjs and node app/test-harmony-layer.cjs with Node.js. Checks include 400,400 full-register settings, 918 new independently parsed rhythmic MIDI exports, 1,923 fingering invariants, reference chords, named/custom scales, generated PCM and SoundFont rendering. No package installation is required. Native tests require the documented C++ toolchain.

Reference documentation:
- FL Studio wrapper MIDI routing: https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/plugins/wrapper.htm
- Web MIDI API: https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API
- JUCE: https://github.com/juce-framework/JUCE
