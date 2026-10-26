# Verification record · v1.5

Latest update completed October 25, 2026.

## Standalone app

- Syntax checks passed for engine.js and app.js.
- Harmony tests passed for 15,120 combinations of all 70 scales, 12 roots, three voicings, two chord sizes and three octaves. Every scale degree is checked for note range, scale membership, sorted distinct MIDI pitches and correct note count.
- Twenty-four custom-scale configurations passed, including three-, four-, five- and twelve-note collections and open/smooth voicings. Invalid custom formats are rejected.
- Independent MIDI parsing passed for 81 combinations of rhythm, duration, gate and tempo: balanced note-ons/offs, expected events, exact track lengths and tempo.
- PCM sound tests passed: RIFF/WAV structure, non-silent RMS/peak, sound in all four chord regions, and the 440 Hz fundamental of a rendered A4.
- Browser: Play starts HTML audio at readyState 4 with paused=false, muted=false and advancing currentTime. Stop returns transport to Ready. Sound on toggles actual media muting; Volume shows 0/100 percent and muted status correctly. No JavaScript console errors reported.
- Browser: pentatonic and chromatic scales expose 5 and 12 degrees; custom four-note scale updates chord cards and plays; catalog and controls visually inspected.
- Single-file bundle rebuilt from source and checked separately: Lydian playback reaches readyState 4 with paused=false and a 4-second media duration at 240 BPM.

## FL Studio companions

- FL Piano roll API-contract tests passed 23,940 configurations across all 70 named scales. Existing notes are preserved; timings and scale membership checked.
- Native source and FL script scale catalog parity checked. Native first four scale indices preserved. C++ engine tests expanded and source statically checked.

## Limits

No listening test through the user's speakers, real MIDI hardware/virtual port transmission, native C++ compilation, native engine test execution, or FL Studio host integration has been performed. Audio browser state and the generated waveform have been verified; OS volume and tab mute can still affect what is heard. The VST3 is source only. Session JSON loading preserves versions 1/2. Version-4 and legacy version-3 browser save/load tests passed with factory audio and tablature settings. Versions 1/2 were not separately replayed this update.

## v1.2 harmony controls

- Layout retained; Starting point clarified as Progression recipe with contextual hover/focus/tap help, Roman-numeral degree summaries, 14 recipes, and selected-recipe variations.
- Twelve chord colors and ten voicings implemented. Context help explains actual scale-relative construction, tensions, inversions and deliberate omissions. Slash symbols report bass; omissions are explicit.
- Original 15,120 harmony, 81 MIDI, custom-scale and PCM reference tests still pass. New invariant sweep passed 33,320 scale/color/voicing/register settings; 120 additional MIDI exports have balanced notes. Thirty-six additional PCM renders cover extended colors, selective/drop voicings and rhythms with non-silent signal.
- Independent test-harmony.cjs passed 11 groups, 597,840 chord cases and 252 recipe variations: exact color/reference notes, bass notes, true drop2/drop3 transforms, shell/rootless omissions, ordered smooth-motion example, all named/custom scale cardinalities, and lock/variation behavior. A regression where a variation could claim a change but return the same notes was fixed.
- Browser verified option counts; recipe help; selected-color/voicing explanations; Escape dismissal; eight-step fifths cycle; locked-degree preservation with variation; expanded MIDI download; dyad/Drop3 fallback; contextual rootless label and omission information. Desktop screenshot updated. No JavaScript console errors reported.
- No new native compilation or FL host test was performed. Expanded app controls do not change the native plugin or FL script interfaces. User-speaker audibility remains unverified; generated signal is tested.

## v1.3 SoundFonts

- Embedded spessasynth_core4.3.22 + stb-vorbis0.0.6 with license notices; background worker rendering to existing HTML audio. No runtime network dependency.
- Original 87,450-byte eight-preset SF2 bank generated and independently validated: sample guards, loop continuity, Hydra tables, ranges and reproducibility. A real Ogg-compressed SF3 subset was generated for tests.
- test-soundfont.cjs passes: eight distinct non-silent stereo PCM renders, 440Hz pitch reference, actual SF3 decode, malformed input rejection, render cancellation, repeated use of a bank, imported bank switching and unload. Shared banks are detached before per-render processor disposal to preserve later playback.
- Browser: eight factory instruments enumerated; Drawbar organ playback reached readyState4, paused=false, muted=false and advancing currentTime. Included SF3 loaded through the file picker, displayed Soft keys, and played with readyState4 and advancing time. No physical speaker listening test performed.
- New session metadata remembers bank/preset and supports version1 notes. Local banks stay in memory and require reselection after reopening. Full browser save/load round trip remains untested.
- Existing harmony/MIDI tests rerun unchanged. Native VST3/source and FL Piano roll script controls are unchanged by this preview-only feature.


## v1.4 registers, rhythms, colors and fretted instruments

- Eleven root-octave choices (−1..9), 17 shared-event rhythms and 26 scale-relative chord colors. Exact timing/direction reference tests cover pulses, rests, 3–3–2 syncopation, 2:1 swing, triplets, up/down/bouncing arpeggios, 25 ms spread strums and bass/chord alternation.
- test-expansion.cjs passed 14 new chord references, 400,400 register settings (all scales/colors/voicings across all eleven octaves and C/B roots), 918 independently parsed MIDI exports with balanced note pairs/exact track duration/tempo, 17 non-silent rhythm previews and high-note audio at MIDI127.
- test-fretboard.cjs passed 1,176 configurations and 1,923 shape invariants: all seven tunings, exact pitch and full pitch-class coverage, actual bass, capo, muted/open strings, hand span, finger/barre consistency, familiar open C, impossible grip rejection and complete rhythm-tab coverage. Twelve expanded 24-fret/seven-string searches completed in under 120 ms during verification.
- Existing test-engine.cjs/test-harmony.cjs pass with expanded color catalog (72,520 extra configurations and 1,295,320 independently checked harmony chords); SoundFont SF2/SF3 regression tests also pass.
- Browser: new counts present; capo2 and triplet tab verified; extreme octave labels valid; impossible exact shapes display a message and disable tab export; alternate grip updates tab; ukulele view, rhythm help and soundfont strum playback verified (readyState4, paused=false, advancing time). Tab downloaded and inspected. Version3 session saved, controls changed, and original rhythm/tuning/factory audio restored through file picker. No console errors reported.
- No real instrument performance, user-speaker listening, hardware MIDI, FL host or native compilation test performed. Fingering suggestions are a bounded conservative model; tab arrangements can differ from playback register as labeled.


## v1.5 additional tones and harmonies

- Chordloom Factory 1.1.0 now contains 24 presets (16 added), 96 band-limited samples and 108 zones; 258,264 bytes. Original eight programs, names, PCM sample blocks and articulation records preserved. Builder rebuild and independent structural checks pass; SF3 example retained unchanged.
- Exact browser-worker SoundFont tests pass for all 24 distinct non-silent stereo renders (peak .129–.349, RMS .032–.188), A4 fundamental, SF3 decoding, cancellation, import/unload and bank reuse.
- Add harmony offers 12 enabled patterns plus Off, top/bass sources and 20–100% added-note velocity. Harmony notes are added after base voicing, before rhythm, and shared by piano roll/audio/MIDI/tab. Duplicates are merged; out-of-range requests are reported and omitted. Base symbols remain explicitly labeled.
- test-harmony-layer.cjs passed reference intervals, restoration of omitted tones, duplicate handling, MIDI-edge behavior, 21,840 named-scale configurations and 2,652 balanced harmony/rhythm/level MIDI exports. Base smooth-motion notes remain unchanged, and exact fingering/tab covers added tones. Added notes change the rendered PCM waveform with non-silent signal. All pre-existing engine/harmony/expansion/fretboard regressions also pass.
- Browser: 24 tone options enumerated; Flute plus two harmony voices played with readyState4, paused=false, unmuted and advancing currentTime. Lower harmony showed its new bass; octave 9 requests reported skipped notes. Help text, level control, tab coverage and version 4 session round trip passed; legacy version 3 loaded with harmony Off. Saved program 73 (zero-based) restored Flute after bank expansion. No console errors reported.
- Browser-exported MIDI independently parsed: 12 base note-ons at velocity 86 plus 8 added-note ons at velocity 43 (50% level), balanced note-offs and exact 7,680-tick duration.
- As before, no physical speaker listening, real-instrument performance, hardware MIDI, FL Studio host or native compilation test was performed. New controls belong to the standalone app. Factory sounds are synthesized approximations.
