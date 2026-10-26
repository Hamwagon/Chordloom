#!/usr/bin/env python3
"""Build and independently validate Chordloom's compact original SoundFont bank.

SPDX-License-Identifier: MIT
Copyright (c) 2026 Chordloom contributors
Python standard library only. Generated audio and bank parameters: CC0-1.0.
"""
from __future__ import annotations
import argparse
from array import array
from dataclasses import dataclass
import hashlib
import json
import math
from pathlib import Path
import struct
import sys

RATE, ROOT, PERIOD = 44000, 69, 100
LENGTH, LOOP_START, LOOP_END, GUARD = 1200, 100, 1100, 46
KEY_ZONES = ((0, 59, 30), (60, 83, 16), (84, 107, 4), (108, 127, 1))
VERSION = "1.1.0"

@dataclass(frozen=True)
class Preset:
    program: int
    name: str
    recipe: str
    harmonics: tuple[tuple[int, float], ...]
    attack: float
    decay: float
    sustain_cb: int
    release: float
    cutoff: float
    filter_envelope: int = 0
    filter_decay: float = .3
    reverb: int = 80
    chorus: int = 0
    vibrato: int = 0
    layers: tuple[tuple[int, int], ...] = ((0, 0),)

PRESETS = (
    Preset(0, "Soft keys", "Gentle additive struck-key approximation",
           ((1, 1), (2, .21), (3, .18), (4, .06), (5, .025), (6, .015)),
           .006, 1.15, 240, .32, 5200, 1100, .38, 90),
    Preset(4, "Bell keys", "Bright harmonic bell-key approximation",
           ((1, 1), (2, .09), (3, .015), (4, .32), (5, .025), (7, .17),
            (10, .09), (12, .05), (16, .025)),
           .003, 2.4, 640, .62, 11000, 500, 1.2, 130),
    Preset(16, "Drawbar organ", "Additive drawbar-organ approximation",
           ((1, .8), (2, .5), (3, .25), (4, .2), (6, .12), (8, .1)),
           .005, .1, 0, .09, 10000, 0, .3, 60, 70),
    Preset(24, "Plucked strings", "Comb-shaped additive string-pluck approximation",
           tuple((h, math.sin(math.pi * h * .23) / h ** 1.35) for h in range(1, 31)),
           .002, .85, 380, .18, 4300, 3200, .24, 70),
    Preset(32, "Round bass", "Rounded low-harmonic synthesized bass",
           ((1, 1), (2, .22), (3, .13), (4, .035), (5, .017)),
           .012, .55, 80, .16, 1900, 600, .2, 20),
    Preset(48, "Warm strings", "Soft detuned saw-family string ensemble approximation",
           tuple((h, 1 / h ** 1.38) for h in range(1, 29)),
           .18, .6, 25, .65, 4800, 850, .8, 110, 170, 5,
           ((-4, -110), (4, 110))),
    Preset(88, "Air pad", "Slow three-voice additive atmospheric pad",
           ((1, 1), (2, .23), (3, .19), (4, .08), (5, .055), (6, .06),
            (8, .045), (11, .025), (14, .02)),
           .7, 2, 40, 1.8, 6500, 500, 1.6, 160, 230, 3,
           ((-7, -170), (0, 0), (7, 170))),
    Preset(11, "Mallet", "Short woody harmonic mallet approximation",
           ((1, 1), (2, .05), (3, .45), (4, .025), (5, .08), (7, .11),
            (9, .025), (13, .012)),
           .002, .5, 720, .25, 8200, 1900, .14, 100),
    Preset(1, "Bright keys", "Brighter additive struck-key approximation",
           ((1, 1), (2, .33), (3, .24), (4, .12), (5, .08), (6, .04), (8, .025)),
           attack=.004, decay=1.65, sustain_cb=280, release=.28, cutoff=7600,
           filter_envelope=1400, filter_decay=.46, reverb=85),
    Preset(5, "Tine keys", "Rounded electric-tine key approximation",
           ((1, 1), (2, .12), (3, .34), (4, .07), (5, .2), (7, .1), (9, .05)),
           attack=.005, decay=2.2, sustain_cb=430, release=.45, cutoff=9000,
           filter_envelope=650, filter_decay=.8, reverb=105, chorus=45),
    Preset(8, "Celesta", "Delicate high-harmonic celesta approximation",
           ((1, 1), (2, .035), (3, .07), (4, .42), (5, .02), (6, .14), (8, .19), (12, .09)),
           attack=.0025, decay=2.8, sustain_cb=780, release=.7, cutoff=12000,
           filter_envelope=350, filter_decay=1.4, reverb=145),
    Preset(12, "Marimba", "Dry woody marimba-like struck tone",
           ((1, 1), (2, .018), (3, .65), (5, .12), (7, .04), (10, .015)),
           attack=.0015, decay=.42, sustain_cb=760, release=.15, cutoff=6500,
           filter_envelope=1550, filter_decay=.12, reverb=65),
    Preset(25, "Steel strings", "Bright comb-shaped steel-string pluck approximation",
           tuple((h, math.sin(math.pi * h * .31) / h ** 1.12) for h in range(1, 31)),
           attack=.0018, decay=1.25, sustain_cb=480, release=.22, cutoff=8500,
           filter_envelope=2600, filter_decay=.33, reverb=80),
    Preset(27, "Clean guitar", "Soft clean electric-guitar-like pluck",
           ((1, 1), (2, .36), (3, .19), (4, .14), (5, .095), (7, .04), (9, .02)),
           attack=.0035, decay=1.1, sustain_cb=260, release=.24, cutoff=6800,
           filter_envelope=1150, filter_decay=.28, reverb=90, chorus=25),
    Preset(33, "Finger bass", "Plucked finger-bass-like low voice",
           ((1, 1), (2, .35), (3, .21), (4, .11), (6, .04), (8, .02)),
           attack=.008, decay=.7, sustain_cb=130, release=.12, cutoff=2300,
           filter_envelope=1350, filter_decay=.16, reverb=15),
    Preset(38, "Synth bass", "Filtered odd-harmonic synth bass",
           ((1, 1), (2, .06), (3, .31), (5, .15), (7, .08), (9, .035), (11, .02)),
           attack=.007, decay=.36, sustain_cb=65, release=.11, cutoff=1650,
           filter_envelope=2800, filter_decay=.19, reverb=10),
    Preset(40, "Solo violin", "Nasal bowed-saw violin approximation",
           tuple((h, (1.45 if h in (3, 5, 7) else 1) / h ** 1.2) for h in range(1, 31)),
           attack=.075, decay=.48, sustain_cb=18, release=.3, cutoff=7200,
           filter_envelope=550, filter_decay=.5, reverb=115, vibrato=8),
    Preset(42, "Cello", "Dark bowed-string cello approximation",
           ((1, 1), (2, .57), (3, .32), (4, .17), (5, .24), (6, .09), (7, .13), (9, .065), (11, .03)),
           attack=.13, decay=.75, sustain_cb=22, release=.42, cutoff=3900,
           filter_envelope=450, filter_decay=.7, reverb=110, vibrato=6),
    Preset(56, "Trumpet", "Bright brass-family trumpet approximation",
           ((1, 1), (2, .72), (3, .55), (4, .39), (5, .28), (6, .19), (7, .12), (8, .08), (10, .035)),
           attack=.035, decay=.32, sustain_cb=30, release=.17, cutoff=8100,
           filter_envelope=1700, filter_decay=.25, reverb=85, vibrato=4),
    Preset(60, "French horn", "Mellow low-brass horn approximation",
           ((1, 1), (2, .64), (3, .28), (4, .13), (5, .07), (6, .035), (8, .015)),
           attack=.09, decay=.62, sustain_cb=32, release=.28, cutoff=3100,
           filter_envelope=750, filter_decay=.55, reverb=120, vibrato=3),
    Preset(68, "Oboe", "Reedy odd/even-harmonic oboe approximation",
           ((1, 1), (2, .18), (3, .72), (4, .14), (5, .43), (6, .08), (7, .24), (9, .13), (11, .06), (13, .03)),
           attack=.055, decay=.4, sustain_cb=20, release=.19, cutoff=6700,
           filter_envelope=400, filter_decay=.32, reverb=95, vibrato=5),
    Preset(71, "Clarinet", "Rounded odd-harmonic clarinet approximation",
           ((1, 1), (2, .012), (3, .41), (4, .009), (5, .22), (7, .12), (9, .06), (11, .025), (13, .012)),
           attack=.045, decay=.58, sustain_cb=15, release=.21, cutoff=5100,
           filter_envelope=300, filter_decay=.44, reverb=100, vibrato=4),
    Preset(73, "Flute", "Soft near-sine flute approximation",
           ((1, 1), (2, .075), (3, .028), (4, .008), (5, .004)),
           attack=.065, decay=.9, sustain_cb=12, release=.25, cutoff=5900,
           filter_envelope=220, filter_decay=.6, reverb=125, vibrato=7),
    Preset(81, "Silk lead", "Gentle triangle-family synth lead",
           ((1, 1), (2, .045), (3, -.14), (5, .055), (7, -.025), (9, .014), (11, -.008)),
           attack=.028, decay=.45, sustain_cb=42, release=.33, cutoff=5600,
           filter_envelope=900, filter_decay=.4, reverb=100, chorus=85, vibrato=2),
)

MIT = """MIT License

Copyright (c) 2026 Chordloom contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""
LICENSE = """Chordloom Factory bank licensing
===============================

Generated sample waveforms, SoundFont bank parameters and Chordloom-Factory.sf2:
SPDX-License-Identifier: CC0-1.0

To the extent possible under law, the Chordloom contributors waive all
copyright and related or neighboring rights in the original generated audio
and bank parameters and dedicate them to the public domain under CC0 1.0.
You may use, modify and redistribute these sounds, including in commercial
work, without attribution. No warranties are provided.

The complete CC0 1.0 Universal public-domain dedication is available at:
https://creativecommons.org/publicdomain/zero/1.0/legalcode

All waveforms are generated mathematically by create_factory_bank.py. They
contain no third-party recordings, soundfont samples, or other audio assets.
Instrument labels describe synthesized approximations, not recordings of
acoustic or electric instruments. No instrument manufacturer is endorsed.

Generator code and documentation: SPDX-License-Identifier: MIT

""" + MIT

def chunk(tag: bytes, data: bytes) -> bytes:
    return tag + struct.pack("<I", len(data)) + data + (b"\0" if len(data) & 1 else b"")

def sf_list(kind: bytes, contents: bytes) -> bytes:
    return chunk(b"LIST", kind + contents)

def string_chunk(tag: bytes, value: str) -> bytes:
    raw = value.encode("ascii") + b"\0"
    return chunk(tag, raw + (b"\0" if len(raw) & 1 else b""))

def fixed_name(value: str) -> bytes:
    raw = value.encode("ascii")
    if len(raw) > 19:
        raise ValueError(f"SF2 name too long: {value}")
    return raw.ljust(20, b"\0")

def timecents(seconds: float) -> int:
    return max(-12000, min(8000, round(1200 * math.log2(seconds))))

def cents(hertz: float) -> int:
    return round(1200 * math.log2(hertz / (440 * 2 ** (-69 / 12))))

def gen(operator: int, amount: int) -> bytes:
    return struct.pack("<HH", operator, amount & 0xFFFF)

def make_wave(preset: Preset, limit: int) -> list[int]:
    """Synthesize a DC-free 100-frame period, repeat it, then append guards."""
    partials = [(h, amp) for h, amp in preset.harmonics if h <= limit]
    phase = .19 if preset.name == "Air pad" else 0
    cycle = [sum(amp * math.sin(2 * math.pi * h * i / PERIOD + phase * h * h)
                 for h, amp in partials) for i in range(PERIOD)]
    dc = sum(cycle) / PERIOD
    cycle = [value - dc for value in cycle]
    maximum = max(abs(value) for value in cycle)
    pcm = [round(value / maximum * .58 * 32767) for value in cycle]
    return pcm * (LENGTH // PERIOD) + [0] * GUARD

def pcm_bytes(values: list[int]) -> bytes:
    pcm = array("h", values)
    if sys.byteorder != "little":
        pcm.byteswap()
    return pcm.tobytes()

def zone_generators(preset: Preset, low: int, high: int, sample_id: int,
                    tune: int, pan: int) -> bytes:
    values = {8: cents(preset.cutoff), 9: 0, 11: preset.filter_envelope,
              15: preset.chorus, 16: preset.reverb, 17: pan,
              25: -12000, 26: timecents(.003), 27: -12000,
              28: timecents(preset.filter_decay), 29: 1000,
              30: timecents(preset.release), 33: -12000,
              34: timecents(preset.attack), 35: -12000,
              36: timecents(preset.decay), 37: preset.sustain_cb,
              38: timecents(preset.release), 40: 20 if preset.sustain_cb >= 240 else 0,
              48: 30 + (75 if len(preset.layers) > 1 else 0),
              52: tune, 54: 1, 56: 100, 58: ROOT}
    if preset.vibrato:
        values.update({6: preset.vibrato, 23: timecents(.26), 24: cents(5.2)})
    if preset.name == "Air pad":
        values.update({10: 120, 21: timecents(.5), 22: cents(.32)})
    # keyRange is first; the sampleID link must be last, even after sampleModes.
    return (gen(43, low | (high << 8))
            + b"".join(gen(op, val) for op, val in sorted(values.items()))
            + gen(53, sample_id))

def build_bank() -> bytes:
    info = sf_list(b"INFO", b"".join((
        chunk(b"ifil", struct.pack("<HH", 2, 1)),
        string_chunk(b"isng", "EMU8000"),
        string_chunk(b"INAM", "Chordloom Factory"),
        string_chunk(b"IENG", "Chordloom contributors"),
        string_chunk(b"ICOP", "CC0-1.0: original synthesized audio and bank parameters"),
        string_chunk(b"ICMT", f"{len(PRESETS)} synthesized approximations; no third-party samples. Version " + VERSION),
        string_chunk(b"ISFT", "Chordloom standard-library SF2 builder " + VERSION),
    )))
    sample_data, sample_headers = bytearray(), bytearray()
    phdr, pbag, pgen, inst, ibag, igen = (bytearray() for _ in range(6))
    zone_index = generator_index = 0
    for index, preset in enumerate(PRESETS):
        phdr.extend(struct.pack("<20sHHHIII", fixed_name(preset.name), preset.program,
                                0, index, 0, 0, 0))
        pbag.extend(struct.pack("<HH", index, 0))
        pgen.extend(gen(41, index))
        inst.extend(struct.pack("<20sH", fixed_name(preset.name), zone_index))
        for split, (low, high, limit) in enumerate(KEY_ZONES):
            sample_id = index * len(KEY_ZONES) + split
            start = len(sample_data) // 2
            sample_data.extend(pcm_bytes(make_wave(preset, limit)))
            sample_headers.extend(struct.pack("<20sIIIIIBbHH",
                fixed_name(f"P{preset.program:02d} {low:03d}-{high:03d}"),
                start, start + LENGTH, start + LOOP_START, start + LOOP_END,
                RATE, ROOT, 0, 0, 1))
            for tune, pan in preset.layers:
                zone = zone_generators(preset, low, high, sample_id, tune, pan)
                ibag.extend(struct.pack("<HH", generator_index, 0))
                igen.extend(zone)
                generator_index += len(zone) // 4
                zone_index += 1
    # Each Hydra table includes its terminal record.
    phdr.extend(struct.pack("<20sHHHIII", fixed_name("EOP"), 0, 0, len(PRESETS), 0, 0, 0))
    pbag.extend(struct.pack("<HH", len(PRESETS), 0))
    pgen.extend(gen(0, 0))
    inst.extend(struct.pack("<20sH", fixed_name("EOI"), zone_index))
    ibag.extend(struct.pack("<HH", generator_index, 0))
    igen.extend(gen(0, 0))
    sample_headers.extend(struct.pack("<20sIIIIIBbHH", fixed_name("EOS"),
                                      0, 0, 0, 0, 0, 0, 0, 0, 0))
    tables = ((b"phdr", phdr), (b"pbag", pbag), (b"pmod", bytes(10)),
              (b"pgen", pgen), (b"inst", inst), (b"ibag", ibag),
              (b"imod", bytes(10)), (b"igen", igen), (b"shdr", sample_headers))
    body = (b"sfbk" + info + sf_list(b"sdta", chunk(b"smpl", bytes(sample_data)))
            + sf_list(b"pdta", b"".join(chunk(tag, bytes(val)) for tag, val in tables)))
    return chunk(b"RIFF", body)

def validate_bank(path: Path) -> dict:
    """Independently parse emitted bytes to validate structure and waveforms."""
    raw = path.read_bytes()
    assert raw[:4] == b"RIFF" and raw[8:12] == b"sfbk", "Not an SF2 RIFF bank"
    assert struct.unpack_from("<I", raw, 4)[0] + 8 == len(raw), "RIFF size mismatch"
    assert len(raw) < 1000000, "Bank exceeds compact-bank target"
    def read_chunks(start: int, end: int) -> list[tuple[bytes, bytes]]:
        result, pos = [], start
        while pos < end:
            assert pos + 8 <= end, "Truncated chunk header"
            tag, size = struct.unpack_from("<4sI", raw, pos)
            finish = pos + 8 + size
            assert finish <= end, f"Truncated {tag!r}"
            result.append((tag, raw[pos + 8:finish]))
            pos = finish + (size & 1)
        assert pos == end, "Invalid chunk alignment"
        return result
    top = read_chunks(12, len(raw))
    assert [tag for tag, _ in top] == [b"LIST"] * 3
    assert [val[:4] for _, val in top] == [b"INFO", b"sdta", b"pdta"]
    lists, pos = {}, 12
    for _, val in top:
        lists[val[:4]] = dict(read_chunks(pos + 12, pos + 8 + len(val)))
        pos += 8 + len(val) + (len(val) & 1)
    assert lists[b"INFO"][b"ifil"] == struct.pack("<HH", 2, 1)
    for key in (b"isng", b"INAM", b"ICOP"):
        assert lists[b"INFO"][key].endswith(b"\0")
    tables = lists[b"pdta"]
    assert list(tables) == [b"phdr", b"pbag", b"pmod", b"pgen", b"inst", b"ibag", b"imod", b"igen", b"shdr"]
    fmts = {b"phdr": "<20sHHHIII", b"pbag": "<HH", b"pmod": "<HHhHH",
            b"pgen": "<Hh", b"inst": "<20sH", b"ibag": "<HH",
            b"imod": "<HHhHH", b"igen": "<Hh", b"shdr": "<20sIIIIIBbHH"}
    records = {}
    for key, fmt in fmts.items():
        assert len(tables[key]) % struct.calcsize(fmt) == 0, f"Invalid {key!r} size"
        records[key] = list(struct.iter_unpack(fmt, tables[key]))
    assert records[b"phdr"][-1][0].rstrip(b"\0") == b"EOP"
    assert records[b"inst"][-1][0].rstrip(b"\0") == b"EOI"
    assert records[b"shdr"][-1][0].rstrip(b"\0") == b"EOS"
    for key in (b"pmod", b"imod"):
        assert records[key] == [(0, 0, 0, 0, 0)]
    assert records[b"pgen"][-1] == (0, 0) and records[b"igen"][-1] == (0, 0)
    assert records[b"phdr"][-1][3] == len(records[b"pbag"]) - 1
    assert records[b"inst"][-1][1] == len(records[b"ibag"]) - 1
    for bag, generator in ((b"pbag", b"pgen"), (b"ibag", b"igen")):
        indices = [row[0] for row in records[bag]]
        assert indices == sorted(indices)
        assert indices[-1] == len(records[generator]) - 1
        assert all(row[1] == 0 for row in records[bag])
    sample_bytes = lists[b"sdta"][b"smpl"]
    assert len(sample_bytes) % 2 == 0
    pcm = struct.unpack(f"<{len(sample_bytes) // 2}h", sample_bytes)
    samples = records[b"shdr"][:-1]
    assert len(PRESETS) == 24
    assert len(samples) == len(PRESETS) * len(KEY_ZONES)
    wave_hashes = []
    for index, row in enumerate(samples):
        name, start, end, loop_start, loop_end, rate, root, corr, link, kind = row
        assert start + 8 <= loop_start < loop_end <= end - 8
        assert loop_end - loop_start >= 32 and start < end
        assert end + 46 <= len(pcm) and not any(pcm[end:end + 46])
        assert (rate, root, corr, link, kind) == (44000, 69, 0, 0, 1)
        assert max(abs(v) for v in pcm[start:end]) > 1000
        assert abs(sum(pcm[start:end]) / (end - start)) < 1
        assert pcm[loop_start:loop_start + 100] == pcm[loop_end:loop_end + 100]
        if index + 1 < len(samples):
            assert samples[index + 1][1] >= end + 46
        wave_hashes.append(hashlib.sha256(sample_bytes[start * 2:end * 2]).hexdigest())
    assert len(set(wave_hashes[::len(KEY_ZONES)])) == len(PRESETS), "Main instrument waveforms must differ"
    presets, articulations = [], []
    for index, row in enumerate(records[b"phdr"][:-1]):
        name, program, bank, first_bag, *_ = row
        assert bank == 0
        last_bag = records[b"phdr"][index + 1][3]
        assert last_bag == first_bag + 1
        first = records[b"pbag"][first_bag][0]
        last = records[b"pbag"][last_bag][0]
        assert records[b"pgen"][first:last] == [(41, index)]
        zone_start = records[b"inst"][index][1]
        zone_end = records[b"inst"][index + 1][1]
        coverage, first_articulation = set(), None
        for zone in range(zone_start, zone_end):
            first = records[b"ibag"][zone][0]
            last = records[b"ibag"][zone + 1][0]
            generators = records[b"igen"][first:last]
            assert generators[0][0] == 43 and generators[-1][0] == 53
            assert len({op for op, _ in generators}) == len(generators)
            params = dict(generators)
            assert 0 <= params[53] < len(samples)
            assert params[54] == 1 and params[58] == 69
            low, high = params[43] & 255, (params[43] & 65535) >> 8
            assert 0 <= low <= high <= 127
            coverage.update(range(low, high + 1))
            assert all(op in params for op in (8, 34, 36, 37, 38))
            if first_articulation is None:
                first_articulation = tuple(params[op] for op in (8, 34, 36, 37, 38))
        assert len(coverage) == 128
        articulations.append(first_articulation)
        presets.append({"bank": bank, "program": program,
                        "name": name.rstrip(b"\0").decode("ascii"), "zones": zone_end - zone_start})
    assert len(presets) == len(PRESETS) and len({p["program"] for p in presets}) == len(PRESETS)
    assert len(set(articulations)) == len(PRESETS)
    return {"valid": True, "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest(),
            "format": "SoundFont 2.01 / 16-bit mono PCM", "sampleRate": 44000,
            "sampleCount": len(samples), "instrumentZoneCount": len(records[b"ibag"]) - 1,
            "guardFramesPerSample": 46, "presets": presets}

def make_readme(report: dict) -> str:
    rows = "\n".join(f"| 0 | {p.program} | {p.name} | {p.recipe} |" for p in PRESETS)
    return f"""# Chordloom Factory {VERSION}

`Chordloom-Factory.sf2` is an original compact bank of {len(PRESETS)} **synthesized
instrument approximations**. These intentionally simple wavetable voices are
not realistic sampled instruments. No recordings or third-party audio assets
were used. Every waveform is calculated from sine partials in the included
standard-library Python builder.

| Bank | Program (zero based) | Preset | Sound |
| --- | --- | --- | --- |
{rows}

This is a small custom bank, not a complete General MIDI set. Use these exact
bank/program pairs. Programs displayed one based are 1 greater.

## Format and playback

- SoundFont 2.01 RIFF `sfbk`, 16-bit mono PCM at 44,000 Hz.
- {report['sampleCount']} samples: four band-limited key splits for each voice.
- Each sample has a 440 Hz root (MIDI 69), a 100-frame periodic waveform,
  a 1,000-frame loop, 100-frame margins and 46 silent guard frames.
- {report['instrumentZoneCount']} instrument zones. Warm strings uses two detuned voices;
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

Bank size: {report['bytes']:,} bytes. SHA-256:
`{report['sha256']}`

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
"""

def main() -> None:
    source = Path(__file__).resolve()
    default = source.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=default)
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    output = args.output_dir.resolve()
    bank_path = output / "Chordloom-Factory.sf2"
    if not args.validate_only:
        output.mkdir(parents=True, exist_ok=True)
        bank_path.write_bytes(build_bank())
    report = validate_bank(bank_path)
    if not args.validate_only:
        (output / "validation.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        (output / "LICENSE.txt").write_text(LICENSE, encoding="utf-8")
        (output / "create_factory_bank.py").write_text(source.read_text(encoding="utf-8-sig"), encoding="utf-8")
        (output / "README.md").write_text(make_readme(report), encoding="utf-8")
        manifest = {"name": "Chordloom Factory", "version": VERSION, "file": bank_path.name,
                    "license": "CC0-1.0",
                    "description": "Original synthesized approximations; no recorded samples.",
                    "presets": [{"bank": 0, "program": p.program, "name": p.name,
                                 "description": p.recipe, "attackSeconds": p.attack,
                                 "decaySeconds": p.decay, "sustainCentibels": p.sustain_cb,
                                 "releaseSeconds": p.release, "filterCutoffHz": p.cutoff} for p in PRESETS]}
        (output / "presets.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"path": str(bank_path), **report}, indent=2))

if __name__ == "__main__":
    main()

