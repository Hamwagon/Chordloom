# Chordloom VST3 - source build

This folder contains native plugin SOURCE, not a compiled or DAW-tested VST3 binary.
The authoring environment had no CMake or C++ compiler. Build and host verification
remain necessary before relying on it in a session.

## Windows build

Install Visual Studio 2022 Build Tools with **Desktop development with C++**,
the Windows SDK, CMake 3.22 or later, and Git. Open a Developer PowerShell.
From this folder, run:

```powershell
cmake -S . -B build -G "Visual Studio 17 2022" -A x64
cmake --build build --config Release --parallel
ctest --test-dir build -C Release --output-on-failure
```

The first configure fetches the pinned JUCE 8.0.12 release from GitHub and needs
internet access. The project does not automatically install plugins.

Copy the entire `build/Chordloom_artefacts/Release/VST3/Chordloom.vst3` bundle to
`C:\Program Files\Common Files\VST3\Chordloom.vst3` (Windows may request admin access).
Scan for new plugins in FL Studio's Plugin Manager.

JUCE licensing applies to builds and redistribution. See https://juce.com/legal/juce-8-licence/.
No third-party JUCE source or binaries are redistributed in this folder.

## FL Studio routing

1. Add Chordloom as an instrument in the Channel Rack. Its stereo output is silent;
   its purpose is to generate MIDI for another instrument.
2. Open Chordloom's wrapper settings, select the MIDI settings, and set **Output port**
   to an unused number, for example **10**.
3. Add a target **VST instrument**. In that instrument's wrapper MIDI settings set
   **Input port** to **10**. Keep its audio routed to the mixer as usual.
4. Turn **Generate MIDI (host Play)** on, set root/scale/progression, and press the
   FL Studio transport Play button. Use Song playback with a sufficiently long arrangement.
5. Disable wrapper **Smart disable** for the generator if FL Studio suspends the
   silent channel. This generator requires processing callbacks and host PPQ/BPM.
6. For FL native instruments that do not expose a VST wrapper MIDI input port, use
   the companion standalone tool to export `.mid`, then import it into a Piano Roll.

Official wrapper routing reference:
https://www.image-line.com/fl-studio-learning/fl-studio-online-manual/html/plugins/wrapper.htm

## Controls

- Eight four-chord degree patterns, plus a generated pattern with 128 deterministic
  variation seeds. The first generated chord is always tonic.
- 70 named scales and modes; 12 roots. Includes all seven major modes, all modes
  of harmonic minor, melodic minor (ascending/jazz), harmonic major, double harmonic,
  Neapolitan minor and Neapolitan major; pentatonic modes and additional pentatonics,
  blues, symmetric, bebop, and chromatic scales. The original four scale parameter
  indices are preserved, then the remaining choices are appended.
- Degree patterns wrap at the selected scale cardinality. Chords stack every other
  scale note; on non-heptatonic scales the Triads/Sevenths/Ninths controls mean
  three/four/five-note stacks and may not form conventional tertian chords.
  Octave-shifted notes can repeat pitch classes on even-cardinality scales, but
  duplicate MIDI pitches are avoided. Whole voicings shift by octaves if needed
  to remain in MIDI range, preserving scale membership. Custom scales are available
  only in the companion browser app.
- Triads, diatonic sevenths, or diatonic ninths.
- Root position, first/second inversion, and open voicing.
- Octave uses scientific pitch notation (C4 = MIDI 60). FL Studio may label MIDI
  octaves differently; MIDI note numbers still match.
- Half, one, two, or four host bars per chord, respecting host time signature.
- Velocity, output MIDI channel, and gate length. Gate 1.0 holds until the next chord.
- **Generate MIDI** off sends note-offs on the next callback. Turn it off to silence
  held notes before deleting/bypassing the plugin or disconnecting MIDI routing.

Playback is anchored to host PPQ zero and loops every four chords. Starting playback
in the middle of a chord plays the current chord for its remaining gated duration.
There is no internal tempo; the host must provide playing state, BPM and PPQ.
Incoming MIDI is consumed. This avoids note conflicts with the generated stream.
Project state and automatable controls are saved by the host.

## Verification required

`chordloom_core_test` checks known major/minor/ninth chords, every supported root,
all 70 scales, voicing, chord size and octave, plus scale membership, MIDI range, distinct
sorted voices, generated degrees, and duration choices. It has not been compiled
in the authoring environment.

The processor source handles transport stops, loops/seeks, parameter changes, gates,
and exact sample offsets for note boundaries. Test those paths in FL Studio after
building. Test routing to at least one VST target and recording/rendering behavior;
VST3 MIDI output support is host-dependent. The plugin does not synthesize audio.

The chord engine uses fixed-size storage and MIDI messages use short inline storage.
Its internal output buffer is reserved before playback. JUCE's host-supplied MIDI
buffer may grow when generated events are copied to it; a strict allocation-free
real-time guarantee has not been measured or claimed.

Official framework references:
- https://github.com/juce-framework/JUCE/releases/tag/8.0.12
- https://github.com/juce-framework/JUCE/blob/master/docs/CMake%20API.md
- https://docs.juce.com/master/classjuce_1_1AudioPlayHead_1_1PositionInfo.html
