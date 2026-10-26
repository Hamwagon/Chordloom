# Added harmonies · Chordloom v1.5

The Add harmony selector in the palette adds notes to each voiced chord. It is off by default. Original chord color/voicing notes remain unchanged.

1. Choose a harmony interval or multi-voice pattern.
2. Follow Top voice (the highest voiced MIDI note) or Bass voice (the lowest).
3. Set Harmony level from 20% to 100%. This scales only the added notes’ MIDI velocity relative to the main Velocity control; it is not a separate audio fader or a second instrument.
4. Press Play or export MIDI. New tones appear in lilac in the piano roll and under each base chord. They use the selected instrument tone.

## Available choices

- **Off · original voicing**: Adds no harmony tones. Your chord color and voicing play as before.
- **Third above**: Adds a note two scale steps higher. In seven-note scales this is a diatonic third; the major or minor size follows the collection.
- **Third below**: Adds a note two scale steps lower. Original notes stay in place; the slash bass updates if the added note becomes the lowest pitch.
- **Fourth above**: Adds three scale steps above the source. Its actual interval depends on your selected collection.
- **Fifth above**: Adds a diatonic fifth in seven-note scales. The selected collection can supply an altered fifth.
- **Sixth above**: Adds five scale steps above the source. In seven-note scales this is a sixth whose major/minor size follows the scale.
- **Sixth below**: Adds a lower sixth in seven-note scales, extending the lower range when following the bass.
- **Third + fifth above**: Adds notes two and four scale steps above the source. In seven-note scales these form an in-scale triad together with that source.
- **Third + sixth above**: Adds a scale third and sixth. A pitch already present in the voicing is retained once, without duplicate MIDI note attacks.
- **Third above + below**: Adds one note two scale steps below and one two steps above the source. Original chord notes remain intact.
- **Octave above**: Adds the source pitch one octave higher. Octaves remain twelve semitones in every collection, including pentatonic and custom scales.
- **Octave below**: Adds a lower octave, often giving bass weight when following the lowest voice.
- **Octave above + below**: Adds two octave doubles. Requests beyond MIDI 0–127 are reported and omitted rather than clipped.

Scale intervals count positions of the selected collection. A third is two scale steps in a seven-note scale; its semitone distance follows the mode. For pentatonic, chromatic and custom collections the same step formula may differ from a conventional major/minor third. Octave doubles always move exactly twelve semitones.

## Timing and note handling

Harmony is added after voicing, before rhythm. Sustained chords and pulses sound the full expanded voicing. Arpeggios cycle through its sorted pitches; this is not a separate melody track and does not harmonize every arpeggio note in parallel. Strums spread the expanded chord in pitch order. Bass/chord alternation uses the actual lowest note, including any new lower harmony.

An exact pitch already present in the base is kept once at the original base velocity. A requested pitch outside MIDI 0–127 is omitted and counted in the hint; no note is clipped or silently wrapped to another octave. Smooth motion continues to use the original base voices, so enabling harmony does not rearrange them.

Chord symbols are labeled BASE CHORD because harmony can restore omitted tones or add extensions. For example C(no5) from Shell can gain G3 from a third above E3; the base still describes C–E and the added G is listed separately. If a new tone becomes the bass, its actual note is printed beside the harmony. A full chord symbol after additions is not inferred, because several harmonic interpretations may be valid.

## Examples

- C3–E3–G3, Third above Top voice → adds B3.
- Same base, Third + fifth above → adds B3 and D4.
- Same base, Third below Bass voice → adds A2, making A the sounding bass.
- C3–E♭3–G3 in natural minor, Third above Top voice → adds B♭3.
- Third below Top voice G3 in C major produces E3, which is already present; no duplicate is added.

Tablature and fingering search use every added pitch. Exact matching includes their original octaves; playable arrangements may re-octave/double as documented in TABLATURE.md. Additional voices can make a grip impossible, in which case the panel reports it and disables full tab export.

Sessions saved as version 4 remember harmony mode/source/level and factory instrument bank/program. Versions 1–3 load with harmony off. The new controls apply to the standalone browser app; native VST3 source and FL Piano roll script retain their separate documented controls.
