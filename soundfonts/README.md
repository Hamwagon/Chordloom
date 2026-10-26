# Chordloom Factory 1.1.0

`Chordloom-Factory.sf2` is an original compact bank of 24 **synthesized
instrument approximations**. These intentionally simple wavetable voices are
not realistic sampled instruments. No recordings or third-party audio assets
were used. Every waveform is calculated from sine partials in the included
standard-library Python builder.

| Bank | Program (zero based) | Preset | Sound |
| --- | --- | --- | --- |
| 0 | 0 | Soft keys | Gentle additive struck-key approximation |
| 0 | 4 | Bell keys | Bright harmonic bell-key approximation |
| 0 | 16 | Drawbar organ | Additive drawbar-organ approximation |
| 0 | 24 | Plucked strings | Comb-shaped additive string-pluck approximation |
| 0 | 32 | Round bass | Rounded low-harmonic synthesized bass |
| 0 | 48 | Warm strings | Soft detuned saw-family string ensemble approximation |
| 0 | 88 | Air pad | Slow three-voice additive atmospheric pad |
| 0 | 11 | Mallet | Short woody harmonic mallet approximation |
| 0 | 1 | Bright keys | Brighter additive struck-key approximation |
| 0 | 5 | Tine keys | Rounded electric-tine key approximation |
| 0 | 8 | Celesta | Delicate high-harmonic celesta approximation |
| 0 | 12 | Marimba | Dry woody marimba-like struck tone |
| 0 | 25 | Steel strings | Bright comb-shaped steel-string pluck approximation |
| 0 | 27 | Clean guitar | Soft clean electric-guitar-like pluck |
| 0 | 33 | Finger bass | Plucked finger-bass-like low voice |
| 0 | 38 | Synth bass | Filtered odd-harmonic synth bass |
| 0 | 40 | Solo violin | Nasal bowed-saw violin approximation |
| 0 | 42 | Cello | Dark bowed-string cello approximation |
| 0 | 56 | Trumpet | Bright brass-family trumpet approximation |
| 0 | 60 | French horn | Mellow low-brass horn approximation |
| 0 | 68 | Oboe | Reedy odd/even-harmonic oboe approximation |
| 0 | 71 | Clarinet | Rounded odd-harmonic clarinet approximation |
| 0 | 73 | Flute | Soft near-sine flute approximation |
| 0 | 81 | Silk lead | Gentle triangle-family synth lead |

This is a small custom bank, not a complete General MIDI set. Use these exact
bank/program pairs. Programs displayed one based are 1 greater.

## Format and playback

- SoundFont 2.01 RIFF `sfbk`, 16-bit mono PCM at 44,000 Hz.
- 96 samples: four band-limited key splits for each voice.
- Each sample has a 440 Hz root (MIDI 69), a 100-frame periodic waveform,
  a 1,000-frame loop, 100-frame margins and 46 silent guard frames.
- 108 instrument zones. Warm strings uses two detuned voices;
  Air pad uses three. Other presets use one voice at a time per note.
- Each preset has its own harmonic recipe, filter and volume ADSR. Bell,
  pluck and mallet voices decay while a key is held; pads and organ sustain.
- Filter envelopes, chorus/reverb sends and gentle delayed vibrato distinguish
  appropriate presets. Effects depend on the host's settings.
- Velocity, sustain pedal, pitch bend and controller responses rely on the
  synthesizer's standard SoundFont modulators.

These repeating waveforms are best for sketching chords and progressions.
They are not multisampled acoustic emulations. The highest key split retains
only the fundamental to limit aliasing; its differences are mainly articulation.
Synthesizers may differ in interpolation, filters, envelopes, effects and loudness.

## Rebuild and validate

From the packaged Chordloom folder, with Python 3.10 or later:

```text
python soundfonts/create_factory_bank.py
python soundfonts/create_factory_bank.py --validate-only
```

From this soundfonts folder, `python create_factory_bank.py --validate-only` also works.

Default output is the folder containing this builder. Use `--output-dir PATH` to change
it. The builder uses only the Python standard library. It emits the bank,
README, license, a builder copy, `presets.json` and `validation.json`. The build has no timestamps
or random inputs and is reproducible with the same Python math implementation.
The validator independently reads the emitted bytes to check RIFF boundaries,
all nine Hydra tables, terminal records, links, full key coverage, distinct main
waveforms and articulations, sample bounds, loop continuity and guard frames.
Host parsing and audible rendering should also be checked when integrating.
The original eight program numbers, names, waveform recipes and articulations
are preserved; the expansion adds sixteen new bank-0 presets.

Bank size: 258,264 bytes. SHA-256:
`c18efe97cf842f92a4bb89641c3402025c26bbd5159625545e28c8828bced0e9`

## License

Original generated audio and bank parameters are dedicated to the public domain
under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). The generator
and documentation are MIT licensed. See `LICENSE.txt`.

Format references: [SoundFont specification](https://www.synthfont.com/SFSPEC21.PDF)
and [SpessaSynth generator reference](https://spessasus.github.io/spessasynth_core/sound-bank/generator/).

## Additional SF3 example

`Chordloom-Soft-Keys.sf3` is a genuine Ogg/Vorbis-compressed subset containing
Soft keys, converted from the original bank with spessasynth_core and
libsndfile. It has the same CC0 waveform/content terms. It is included for
local SF3 loading tests and as an example; the built-in factory preview uses
the complete 24-instrument SF2 bank. The SF3 example is retained unchanged.
