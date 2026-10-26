# Tablature and chord fingerings · Chordloom v1.5

Expand Tablature & chord fingerings beneath the soundbank controls. The original piano roll, sound and MIDI workflow remain in place.

1. Choose standard guitar, Drop D, DADGAD, Open G, standard seven-string guitar, four-string bass or high-G ukulele.
2. Set capo (0–12), fret limit above capo (12/15/19/24) and hand span (3/4/5 consecutive fret positions). Open strings do not count toward the positive-fret span.
3. Choose Playable arrangement or Exact MIDI pitches.
4. Each chord offers up to four ranked grips. Select an alternative under its diagram. The diagram dots suggest left-hand fingers: 1 index, 2 middle, 3 ring, 4 little. A joining bar marks an index barre. Circle means open, × muted; sounding notes are shown below.
5. Read the rhythmic tab or Export tab .txt. Session v3 saves these choices and shape indices.

## Matching modes

Playable arrangement preserves the complete set of voiced pitch classes and the lowest voiced pitch class. It can change octaves and double chord tones to find a playable register. Select a rootless or shell voicing first if those omissions are wanted: the shape engine never silently removes a retained chord pitch class.

Exact MIDI pitches requires all distinct voiced MIDI notes, each on its own string, and adds no other pitches. Keyboard voicings often cannot fit guitar range or string count. If any chord has no shape under the selected limits, it displays an explanation and disables full tab export. Try another tuning, capo, octave, wider fret limit, Playable arrangement, Shell or Rootless. Seven distinct pitch classes require at least seven strings.

Play, the piano roll and MIDI export always use the original voiced notes. Tablature is a separately labeled instrument arrangement. It is not an audio or MIDI replacement and does not retune FL Studio instruments.

## Diagram and tab conventions

Diagram strings run left to right in the tuning order below; tab runs in reverse order vertically, with the last string at the top. This is the usual thin-string-on-top guitar convention. High-G ukulele is reentrant: its first tuning string is higher in pitch than its middle strings.

| Tuning | Left-to-right diagram strings (scientific pitch) |
| --- | --- |
| Guitar standard | E2 A2 D3 G3 B3 E4 |
| Drop D | D2 A2 D3 G3 B3 E4 |
| DADGAD | D2 A2 D3 G3 A3 D4 |
| Open G | D2 G2 D3 G3 B3 D4 |
| Seven-string standard | B1 E2 A2 D3 G3 B3 E4 |
| Four-string bass | E1 A1 D2 G2 |
| High-G ukulele | G4 C4 E4 A4 |

Capo transposes every open string by its semitone count. All displayed fret numbers are relative to the capo: fret 0 is the capoed open string. For example standard guitar with capo 2 has open F♯2 B2 E3 A3 C♯4 F♯4.

Tab columns represent onsets rather than equal rhythmic spacing. Read the beat row for timing: offsets start at 0 within each chord; a quarter-note beat is one unit, eighth .5, triplet .3333, swung second eighth .6667. Decimal beat offsets are rounded to four places for display; audio/MIDI retain full event timing (MIDI rounds to 480 ticks per quarter note). Note releases follow the selected gate; detailed durations, ties, rests and articulation symbols are not typeset as standard notation. Muted strings appear as dashes in the tab and x in the grip line.

Rhythmic patterns are regenerated on the arranged sounding pitches. Strum directions follow pitch order; in reentrant tunings they do not imply a literal sweep across adjacent strings. Exact unison doubles in playable grips are picked together when that pitch is triggered.

## Suggested fingerings

Search considers bounded positive-fret windows, optional open/muted strings, complete tone coverage and bass matching. Ranking favors low positions and contiguous sounding strings. Finger assignment uses at most four fingers, with at most one index barre that cannot cross an open or lower-fretted string. This is a conservative geometric suggestion, not a full model of hand anatomy; some valid grips may be omitted and individual comfort varies. It does not model thumb fretting, multiple barres, bends, slides or instrument setup.

Tab and chord-chart orientation references: [Fender: reading tablature](https://www.fender.com/articles/techniques/how-to-read-tabs) and [reading chord charts](https://www.fender.com/articles/chords/how-to-read-a-chord-chart).

## Added harmonies

When Add harmony is enabled, the shape engine matches the complete expanded note set. The tab lists the base chord plus the added harmony notes and records source/level metadata. Extra voices can exceed the instrument’s string count; no harmony tones are silently discarded. See HARMONIES.md.
