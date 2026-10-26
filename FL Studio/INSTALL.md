# Run Chordloom inside FL Studio

This is a Piano roll generator script, independent of the VST3 source. It needs FL Studio with Piano roll Python scripting support. It does not require Python installed separately.

1. Copy Chordloom.pyscript into your FL Studio User data folder under Settings/Piano roll scripts. The standard Windows location is Documents/Image-Line/FL Studio/Settings/Piano roll scripts; use your configured User data location if different. Create that subfolder if needed.
2. Open an instrument's Piano roll. Start with an empty pattern for a fresh progression.
3. Open the Piano roll Scripts menu and choose Chordloom. Reopen the menu or restart FL Studio if it has not refreshed.
4. Set key, scale, progression, color, voicing, rhythm, and duration. Choose Generated and change Variation seed for new degrees.
5. Accept the dialog to keep the generated notes and play the pattern normally. Use FL Studio's undo if you want to remove the result.

The script keeps existing notes and appends the progression beginning at Start bar. Repeated invocations can layer notes. Each bar here is four quarter notes, independent of project time signature. Generated notes use the instrument's default note color/channel. Octave control is scientific notation, which can differ from FL labels.

This script creates editable Piano roll note data; it is not a live MIDI-routing plugin. Use the standalone app to export .mid files or the VST3 build for a host-synced MIDI stream. No session-file interchange is provided.

Validation: Python syntax and API-contract tests run against a minimal flpianoroll test double. Actual FL Studio execution and dialog rendering are untested here.

Official API and install location: https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/pianoroll_scripting_api.htm

## Scale and mode catalog

The scale menu includes the same 70 named built-in scales/modes as the app: major,
harmonic minor, ascending/jazz melodic minor, harmonic major, double harmonic and
Neapolitan families; pentatonic modes, other pentatonics, blues, symmetric, bebop,
and chromatic. Original menu indices 0–3 retain major, natural minor, Dorian,
and Mixolydian for compatibility. No extra data file is needed when installing
the `.pyscript`; its catalog is embedded. Custom scales are browser-app only.

Patterns wrap degree numbers to the actual scale length. Chords stack every other
scale note. On pentatonic, blues, octatonic, or chromatic scales, chord color means
three/four/five-note stacks rather than conventional tertian chord qualities.
Voicings avoid duplicate MIDI pitches. Audible playback uses the Piano roll
instrument selected in FL Studio after accepting the generated notes.
