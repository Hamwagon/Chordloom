#include "ChordEngine.h"
#include <iostream>
#include <cstdlib>
static void require(bool ok,const char* message) {
    if(!ok) { std::cerr<<message<<'\n'; std::exit(1); }
}
int main() {
    chordloom::Settings s;
    auto c=chordloom::makeChord(s,0);
    require(c.size==3 && c.notes[0]==48 && c.notes[1]==52 && c.notes[2]==55,"C major triad");
    s.root=9;s.scale=1;c=chordloom::makeChord(s,0);
    require(c.notes[0]==57 && c.notes[1]==60 && c.notes[2]==64,"A minor triad");
    s.root=0;s.scale=0;s.extension=2;c=chordloom::makeChord(s,0);
    require(c.size==5 && c.notes[3]==59 && c.notes[4]==62,"C major ninth");
    require(chordloom::scaleCount==70,"Scale catalog size");
    require(chordloom::scales[0].size==7 && chordloom::scales[1].notes[2]==3 && chordloom::scales[2].notes[5]==9 && chordloom::scales[3].notes[6]==10,"Legacy scale indices");
    for(int root=0;root<12;++root) for(int scale=0;scale<chordloom::scaleCount;++scale)
    for(int voice=0;voice<4;++voice) for(int ext=0;ext<3;++ext)
    for(int octave=2;octave<=6;++octave) for(int step=0;step<4;++step) {
        s.root=root;s.scale=scale;s.voicing=voice;s.extension=ext;s.octave=octave;
        c=chordloom::makeChord(s,step);
        for(int i=0;i<c.size;++i) {
            const int note=c.notes[static_cast<std::size_t>(i)];
            require(note>=0 && note<=127,"MIDI range");
            bool inScale=false;
            const auto& definition=chordloom::scales[scale];
            for(int j=0;j<definition.size;++j) if((note-root+120)%12==definition.notes[static_cast<std::size_t>(j)]) inScale=true;
            require(inScale,"Scale membership");
            if(i>0) require(c.notes[static_cast<std::size_t>(i-1)]<note,"Sorted distinct notes");
        }
    }
    s.progression=8;s.variation=42;
    require(chordloom::degree(s,0)==0,"Generated tonic first");
    for(int scale=0;scale<chordloom::scaleCount;++scale)
    for(int seed=0;seed<128;++seed) for(int step=0;step<4;++step) {
        s.scale=scale;
        s.variation=seed;const int d=chordloom::degree(s,step);
        require(d>=0 && d<chordloom::scales[scale].size,"Generated degree range");
    }
    require(chordloom::barsPerChord(0)==0.5 && chordloom::barsPerChord(3)==4.0,"Durations");
    for(int scale=0;scale<chordloom::scaleCount;++scale)
    for(int progression=0;progression<8;++progression) for(int step=0;step<4;++step) {
        s.scale=scale;s.progression=progression;
        require(chordloom::degree(s,step)>=0 && chordloom::degree(s,step)<chordloom::scales[scale].size,"Wrapped preset degrees");
    }
    std::cout<<"Chord engine checks passed: 70 scales\n";
}
