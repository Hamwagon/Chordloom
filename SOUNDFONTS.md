# SoundFonts and instruments · Chordloom v1.5

Use the Soundbank and Instrument selectors below the transport. These change the app’s preview sound; they do not change the chord notes, harmony controls, MIDI export, or the native plugin’s behavior.

## Included sounds

- Built-in synth: the original warm synth, available immediately without a bank or worker.
- Chordloom Factory: 24 original synthesized instrument approximations in a compact SF2 bank. New tones include Bright keys, Tine keys, Celesta, Marimba, Steel strings, Clean guitar, Finger bass, Synth bass, Solo violin, Cello, Trumpet, French horn, Oboe, Clarinet, Flute and Silk lead. The original Soft keys, Bell keys, Mallet, Drawbar organ, Plucked strings, Round bass, Warm strings and Air pad are preserved. These are synthesized sketches, not recorded acoustic instruments.

Choose Chordloom Factory, select an instrument, and press Play. The app renders a stereo preview in a background worker and reuses the last render on repeated playback. Stop and changes to harmony or instrument cancel rendering. The rest of the layout and transport remain the same.

## Load additional banks

1. Click **Load SoundFont** and choose an **.sf2** or **.sf3** file from your computer.
2. The bank is added to Soundbank, and Instrument lists its presets. Program numbers in the hint use human-readable 1–128 numbering; bank MSB/LSB remain zero-based. Drum presets are marked; they play percussion rather than pitched harmony.
3. Select a preset and press Play. You can load another bank and switch between banks already loaded in this tab.
4. Click Unload to remove the selected imported bank from memory. The built-in synth is selected afterward.

The file limit is 256 MB per bank. SFZ, DLS, archives and standalone WAV/MP3 samples are not accepted through this control. SoundFont parsing, compressed-sample decoding and rendering all happen locally. There is no CDN, upload, account or network request during use. Files are held in the tab’s memory and are not automatically persisted.

The package includes Chordloom-Factory.sf2 and a genuine Vorbis-compressed Chordloom-Soft-Keys.sf3 subset under soundfonts/ for testing the loader. Their original waveform content is CC0; the builder and notices are included. Use your own appropriately licensed banks for sampled pianos, orchestras, guitars and other instruments.

## Saving and MIDI

Session JSON files (versions 2–4) remember preview source, bank filename/size and preset. If the bank is already loaded, it is selected on restore. After reopening the app, a session that used a local bank asks you to reload that file; the app then restores the matching preset. Bank files themselves are not embedded in session JSON. Older version-1 sessions remain supported. Version 4 also restores harmony settings; versions 1–3 load with added harmony off. Original factory program numbers remain stable, so saved bank/program choices continue to match after the expansion.

A MIDI file contains notes and timing, not soundfont samples or an audio recording. Choose the desired target instrument in FL Studio after importing the MIDI. Live MIDI output also keeps its existing note-only behavior; changing preview instruments does not send a program change to your DAW or hardware.

Preview output uses a 32 kHz stereo PCM WAV rendered from the selected SoundFont, then the existing browser audio player. The source bank’s samples, tuning, envelopes and relevant synthesis settings are handled by the bundled engine. The loop stays exactly the progression length, so release/effect tails are tapered at its boundary. Volume and Sound on continue to control playback.

## Engine and checks

The local engine is [spessasynth_core 4.3.22](https://github.com/spessasus/spessasynth_core), with stb-vorbis 0.0.6 for compressed samples. Engine licenses and source/rebuild notes are in app/vendor/. The [upstream processor documentation](https://spessasus.github.io/spessasynth_core/spessa-synth-processor/) describes the synthesis API.

Run node app/test-soundfont.cjs to test actual SF2 parsing, all 24 distinct audible-signal renders, tuning at A4 = 440 Hz, actual compressed SF3 decoding, invalid inputs, repeated playback, cancellation, bank switching and unload. Browser tests verified factory selection/playback and loading/playing the included SF3 through the file picker. Physical listening through your speakers and arbitrary third-party bank compatibility were not tested.
