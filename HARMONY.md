# Harmony controls · Chordloom v1.5

The layout keeps the original palette, groove, chord cards, piano roll and transport. The three harmony controls now answer separate musical questions. Help opens by hovering, focusing or tapping ?. Press Escape or tap outside to dismiss it.

## Progression recipe: where do the roots go?

Recipes specify ordered scale-degree indices. Their Roman numerals reflect the selected scale’s triad qualities where conventional major/minor/diminished/augmented analysis applies. Selecting a recipe applies it immediately except at locked degrees. In shorter or larger collections, the indices wrap to the collection’s actual length.

Generate variation begins with the selected recipe. It chooses an unlocked interior step and substitutes another degree, preserving locks and recipe endpoints. In major it prefers a degree from the same broad harmonic-function group when one is available; otherwise it uses another in-scale degree. This is a variation aid, not a guarantee of stylistic or cadential function in every mode.

An eight-step recipe is truncated at Length 4; set Length 8 for the full cycle. Manual edits are marked Edited in the recipe summary. Locks preserve scale-degree numbers; transposing or changing scale/color can change the resulting notes.

- **Pop loop · 1–5–6–4**: A tonic–fifth–sixth–fourth root pattern. In major this is I–V–vi–IV; other scales give it different chord qualities.
- **Tonic–sixth loop · 1–6–3–7**: Moves from the tonic to the sixth, third and final scale degree. Its sound depends on your scale; the name is a route, not a promised mood.
- **Return home · 1–4–5–1**: Degree 1–4–5–1. In major this outlines departure and a dominant-to-tonic return. A minor fifth-degree chord gives a softer return in natural minor.
- **Mediant motion · 1–3–6–4**: Degree 1–3–6–4 links chords that often share tones in seven-note scales. Smooth voice leading can make those shared tones easy to hear.
- **Diatonic turnaround · 2–5–1–6**: Degree 2–5–1–6. In major this yields ii–V–I–vi: a diatonic turnaround. It does not silently change vi into a secondary dominant or raise a minor-key leading tone.
- **Step-down lift · 6–5–4–5**: Degree 6–5–4–5 descends two scale steps, then rises one. There is no tonic chord in the four-step pattern, so it can leave the phrase open.
- **Doo-wop loop · 1–6–4–5**: Degree 1–6–4–5. In major it forms the familiar I–vi–IV–V loop; the last chord leads back toward the first when looped.
- **Cadential approach · 1–6–2–5**: Degree 1–6–2–5. In major, vi leads to the predominant ii and dominant V. The loop resolves to I at the next repeat.
- **Fourth-degree vamp · 1–4–1–4**: Alternates tonic and fourth-degree chords. Compare major, natural minor and Dorian: the fourth-degree chord changes quality while the root route stays the same.
- **Seventh-degree vamp · 1–7–1–7**: Alternates tonic and the last degree of a seven-note scale. Natural minor and Mixolydian give a whole-step root relationship; major gives a half-step one.
- **Descending four · 1–7–6–5**: Descends from the tonic through degrees 7, 6 and 5. In natural minor the final chord is minor; this diatonic recipe does not force a major V.
- **Ascending steps · 1–2–3–4**: Degree 1–2–3–4 walks upward through the selected collection, letting you hear how chord qualities change from degree to degree.
- **Cycle of diatonic fifths · 1–4–7–3–6–2–5–1**: Eight steps: 1–4–7–3–6–2–5–1. In diatonic major/minor, the root route mostly follows perfect fifths and includes a diminished-fifth link. Other scales change these intervals. Choose Length 8 for the full route.
- **Tonic anchor · 1–1–4–1**: Repeats tonic, visits the fourth degree, and returns. Use it to compare chord colors and voicings without frequent root changes.

For tonal schemas and how their function depends on context, see [Open Music Theory: Four-Chord Schemas](https://viva.pressbooks.pub/openmusictheory/chapter/4-chord-schemas/). These application recipes remain diatonic to the chosen collection. For example, natural minor supplies a minor v; the app does not silently turn it into a borrowed major V.

## Chord color: which tones belong to each chord?

Formulas count relative scale steps from each chord root, not semitone distances. Ninth/eleventh/thirteenth repeat the second/fourth/sixth above the octave in seven-note scales. A mode can alter their actual intervals, which the symbols report. Unrecognized structures display exact semitone offsets rather than an inaccurate conventional chord name.

- **Triad · 1–3–5 · three tones**: Root, third and fifth. The scale determines major, minor, diminished or augmented quality. A clear starting point for hearing the progression.
- **Seventh · 1–3–5–7 · four tones**: Adds the scale seventh to a triad. The actual intervals decide whether you get maj7, dominant 7, m7, m(maj7), half-diminished or diminished 7.
- **Added sixth · 1–3–5–6 · no seventh**: Adds the scale sixth without a seventh. A major sixth yields a 6 or m6 sound; if the selected scale supplies a flat sixth, the symbol says so rather than calling it a natural 6.
- **Add nine · 1–3–5–9 · no seventh**: Adds a ninth to a triad without adding a seventh. This differs from a ninth chord, which includes the seventh. The scale can supply a natural, flat or sharp ninth.
- **Six / nine · 1–3–5–6–9 · no seventh**: Adds both sixth and ninth to a triad, without a seventh. Both added tones come from the chosen scale. It can make a spacious tonic sound, but the intervals still matter.
- **Ninth · 1–3–5–7–9 · five tones**: A seventh chord plus a ninth. Unlike Add nine, this contains the seventh. Flat or sharp ninths are shown explicitly when the scale produces them.
- **Eleventh · 1–3–5–7–9–11 · six tones**: Builds the full seventh–ninth–eleventh stack. A natural eleventh can rub against a major third. That tension is retained here; shell and rootless voicings offer different omissions instead of silently changing your scale.
- **Thirteenth · 1–3–5–7–9–11–13 · seven tones**: Builds the full stack through the thirteenth. In a seven-note scale it uses every pitch class. This can be dense; rootless voicing keeps a smaller jazz-style selection when available.
- **Suspended second · 1–2–5 · replaces the third**: Uses the scale second instead of the third. It can sound open because it avoids a conventional major/minor third. This is a chord shape; the app does not automatically resolve it as a classical suspension.
- **Suspended fourth · 1–4–5 · replaces the third**: Uses the scale fourth instead of the third. A raised fourth or altered fifth remains as written by the scale, and the chord label reports the actual intervals.
- **Stacked fourths · 1–4–7 · scale fourths**: Stacks two diatonic fourths instead of thirds. The fourths may be perfect, augmented or diminished, depending on the collection. Useful for exploring modal textures without forcing triad quality.
- **Root + fifth · 1–5 · two tones**: Omits the third for a two-note shape. A perfect fifth gives the familiar power-chord sound; Locrian and other scales can supply a diminished or augmented fifth instead.

- **Added second · 1–2–3–5 · close added tone**: Keeps the third and adds the scale second beside the root. It has the same pitch classes as Add nine, but a different construction register; close voicing may fold them into the same sounding pitches.
- **Added fourth · 1–3–4–5 · keeps the third**: Adds the scale fourth without removing the third. Unlike a suspension it keeps the third; a half-step between third and fourth can create deliberate tension.
- **Add eleven · 1–3–5–11 · no seventh**: A triad with the scale fourth in its next octave. No seventh or ninth is implied by this explicit added-tone formula.
- **Add thirteen · 1–3–5–13 · no seventh**: A triad plus the scale sixth in its next octave, with no seventh, ninth or eleventh. Compare Added sixth: construction register differs, though close voicing can sound identical.
- **Seventh sus2 · 1–2–5–7 · no third**: Uses the scale second in place of the third and retains the scale seventh. The seventh may be major or minor; it is determined by the selected collection.
- **Seventh sus4 · 1–4–5–7 · no third**: Combines the scale fourth, fifth and seventh over the root. No third is added. A major seventh produces maj7sus4 rather than dominant 7sus4.
- **Ninth sus4 · 1–4–5–7–9 · no third**: Extends the suspended-fourth seventh chord with a scale ninth. Retains both fourth and ninth while omitting the third.
- **Seventh, no fifth · 1–3–7 · three-tone shell**: Builds root, third and seventh directly, leaving out the fifth. Close voicing keeps all three; Shell may remove additional tones only when its own rule calls for that.
- **Ninth, no fifth · 1–3–7–9 · four tones**: Keeps the root, quality-defining third, seventh and ninth. The fifth is explicitly omitted, reducing density without discarding the upper color.
- **Thirteenth, no eleventh · 1–3–5–7–9–13 · six tones**: Retains the fifth and ninth but deliberately omits the eleventh. In major this avoids the natural-eleventh/major-third rub without changing either scale degree.
- **Four-note fourth stack · 1–4–7–10 · three stacked fourths**: Stacks three scale fourths above the root. Actual semitone sizes depend on the collection; an interval-list label is used when there is no unambiguous conventional symbol.
- **Stacked fifths · 1–5–9 · scale fifths**: Stacks two scale fifths. In a major collection this yields a root, fifth and ninth with no third or seventh. Other scales may alter either fifth.
- **Three-note cluster · 1–2–3 · adjacent scale tones**: Uses three neighboring notes of the collection. These are scale steps, so chromatic gives semitone clusters while pentatonic yields wider gaps. Voicing can spread the cluster.
- **Four-note cluster · 1–2–3–4 · adjacent scale tones**: Uses four neighboring scale notes. Close voicing emphasizes the cluster; open spacing separates some of its tones by octaves.

The full-stack and lean-extension choices state their construction before voicing. Real arrangements often omit tones for texture and register; the app exposes some omissions through shell/rootless options instead of imposing one style. For practical treatment of extended harmony and omissions, see [Macalester: Extended tertian chords](https://pressbooks.macalester.digital/multimodalmusicianship/chapter/extended-tertian-chords-altered-dominants-2/).

## Voicing: how are those tones arranged?

Octave moves keep pitch classes. Shell and rootless also remove specified construction tones; labels explicitly list omissions. A slash suffix shows the actual bass when it differs from the harmonic root. Rootless assumes a bass part or an implied root elsewhere.

- **Smooth voice leading**: Searches octave placements and inversions for low total semitone movement between ordered voices. The first chord starts in close position. It is a smooth-motion heuristic, not a complete classical counterpoint solver.
- **Close / root position**: Places the root at the bottom and packs each pitch class into the closest octave above it. Extensions can fold down: a ninth may sit near the root. Repeated pitch classes use the next free octave.
- **Open spread**: Starts with close position and lifts alternating upper voices by an octave. It keeps the chord tones while widening the register. Use a higher octave or thinner color if low notes feel crowded.
- **Bass + upper voices**: Keeps the upper tones in close position and moves the root down an octave. This separates the bass from the chord’s upper texture without adding a new note.
- **First inversion**: Puts the third in the bass for tertian triads and seventh/extended chords. With suspensions, fourth stacks or dyads, it uses the next construction tone instead. Slash notation shows the actual bass.
- **Second inversion**: Puts the fifth in the bass for tertian chords. For other shapes it uses the third construction tone; a dyad falls back to its second tone. Slash notation identifies the actual bass pitch class.
- **Drop 2**: From close position, lowers the second-highest sounding voice by one octave. This spreads the chord and can change the bass. With extended chords, counting starts at the top of the packed voicing.
- **Drop 3**: From close position, lowers the third-highest sounding voice by one octave. Requires at least three tones, so it is unavailable for the Root + fifth dyad.
- **Shell voicing**: Keeps root, third and seventh when present, omitting the fifth and extensions. For triads it keeps root and third; other structures keep root and their next construction tone. The label lists omitted degrees. This can intentionally thin out the chosen color.
- **Rootless jazz**: Removes the root pitch class. For larger tertian stacks it also omits the fifth and eleventh, retaining third, seventh and available upper colors. It assumes the root is supplied or implied elsewhere; played alone, it can suggest another chord. Omissions and actual bass are labeled.

If a voicing requires more tones than the chosen color supplies, its menu item is disabled and the app uses close position. When octave moves create an exact MIDI-note collision, one voice moves to a free octave. Smooth motion minimizes an ordered semitone-distance score; it does not enforce all species-counterpoint or classical part-writing rules.

## Examples in C major

- Triad: C–E–G. Add nine: C–E–G–D, without B. Ninth: C–E–G–B–D.
- Close Cmaj7: C3–E3–G3–B3. First inversion: E3–G3–B3–C4. Second inversion: G3–B3–C4–E4.
- Drop 2 Cmaj7: G2–C3–E3–B3. Drop 3: E2–C3–G3–B3.
- Shell of Cmaj9 keeps C–E–B, with no fifth or ninth. Rootless Cmaj9 keeps E–B–D under the app’s selected-omission rule.

All playback and exported MIDI use the displayed, actually voiced notes. The native VST3 remains an uncompiled source project with a separate UI; these new help controls are in the standalone app.


## Root octave and MIDI limits

Choose any scientific octave from −1 through 9 (C4 = MIDI 60). This sets the construction root register; inversions, smooth motion and spread voicings can move individual notes. Near MIDI limits 0/127, the entire voicing moves by whole octaves until it fits. The note list and piano roll show the actual result. Very low or high notes may be outside a chosen instrument’s usable or audible range. The built-in renderer increases its sample rate for upper MIDI notes rather than filtering out their fundamental.

## Rhythm

All patterns use 4/4, repeat through the selected bars per chord and restart at each chord. Note length gates each attack. Strum spread uses 25 ms per successive pitch, capped at 60% of its pulse; this is pitch order, not physical string order. MIDI and audio use the same events.

- **Sustained chords · One attack per chord**: Holds the voiced chord across its full span, shortened by Note length.
- **Half-note pulses · Every 2 beats**: Restrikes every two quarter-note beats. Note length controls the gate of each pulse.
- **Quarter-note pulses · Every beat**: Restrikes the entire chord on each quarter-note beat.
- **Eighth-note pulses · Twice per beat**: Restrikes the entire chord every half beat.
- **Offbeat stabs · On each & · half-beat rests**: Attacks on the second half of each beat, leaving the first half empty.
- **Syncopated 3–3–2 · Attacks at 0, 1½, 3 beats**: Repeats a three-three-two eighth-note grouping in each 4/4 bar. The pattern is a rhythmic grouping, without claiming a complete genre-specific accompaniment.
- **Swing eighth-note pulses · Long–short · 2:1**: Chord attacks split each beat at two thirds. The first note lasts twice as long as the second before gate is applied.
- **Arpeggio up · eighths · Low → high · ½ beat**: Cycles through ascending voiced MIDI pitches in eighth notes, restarting at each chord.
- **Arpeggio down · eighths · High → low · ½ beat**: Cycles through descending voiced pitches, restarting on the highest note at each chord.
- **Arpeggio up / down · Bounce · no doubled endpoints**: Runs upward then downward in eighth notes without repeating the top or bottom at the turn.
- **Arpeggio up · sixteenths · Four notes per beat**: Cycles ascending voiced pitches at sixteenth-note spacing.
- **Arpeggio up · triplets · Three notes per beat**: Places three evenly spaced attacks within each quarter-note beat.
- **Arpeggio up · swing · Ascending · long–short 2:1**: Cycles upward using a two-to-one swing pair within each beat.
- **Downstrum · quarters · Low → high · 25 ms spread**: Staggers voiced pitches from low to high by up to 25 milliseconds per note. The whole spread is capped at 60% of the pulse. This uses MIDI pitch order rather than a physical string assignment.
- **Upstrum · quarters · High → low · 25 ms spread**: Staggers voiced pitches from high to low. Each note releases before the next pulse; Note length controls its remaining gate.
- **Alternating eighth strums · Down / up · ½ beat**: Alternates low-to-high and high-to-low spread chord attacks every eighth note.
- **Bass / chord alternation · Bass · upper chord · bass · upper chord**: Alternates the lowest voiced note and all remaining voices on quarter-note beats. With a single voiced note it repeats that note.

For fingering arrangements and their independent octave matching, see TABLATURE.md. Chord-symbol conventions for additions and suspensions follow [Open Music Theory](https://viva.pressbooks.pub/openmusictheory/chapter/chord-symbols/).


## Additional harmony voices

Add harmony can layer scale-based intervals or octave doubles around the highest or lowest voiced note. The base color and voicing stay intact; added notes are listed separately and participate in the chosen rhythm. See HARMONIES.md for examples and duplicate/range handling.
