#pragma once
#include <array>
#include <algorithm>
#include <cmath>
#include <cstdint>
#include <limits>
#include "ScaleCatalog.h"
namespace chordloom {
struct Settings {
    int root=0,scale=0,progression=0,variation=0,extension=0,voicing=0,octave=3;
    int velocity=90,channel=1,duration=1;
    float gate=0.90f;
    bool enabled=true;
    bool operator==(const Settings& o) const noexcept {
        return root==o.root && scale==o.scale && progression==o.progression
            && variation==o.variation && extension==o.extension && voicing==o.voicing
            && octave==o.octave && velocity==o.velocity && channel==o.channel
            && duration==o.duration && gate==o.gate && enabled==o.enabled;
    }
    bool operator!=(const Settings& o) const noexcept { return !(*this==o); }
};
struct Chord { std::array<int,5> notes{}; int size=3; };
inline constexpr int patterns[8][4] = {
    {0,4,5,3},{5,3,0,4},{1,4,0,0},{0,5,3,4},
    {0,3,5,4},{0,6,5,6},{0,2,3,4},{0,3,0,4}
};
inline int degree(const Settings& s,int step) noexcept {
    step=(step%4+4)%4;
    const int count=scales[std::clamp(s.scale,0,scaleCount-1)].size;
    if(s.progression<8) return patterns[std::clamp(s.progression,0,7)][step]%count;
    if(step==0) return 0;
    auto x=static_cast<std::uint32_t>(s.variation+1)*747796405u
          +static_cast<std::uint32_t>(step)*2891336453u;
    x=((x>>((x>>28u)+4u))^x)*277803737u;
    x=(x>>22u)^x;
    return static_cast<int>(x%static_cast<std::uint32_t>(count));
}
inline Chord makeChord(const Settings& s,int step) noexcept {
    Chord c; c.size=3+std::clamp(s.extension,0,2);
    const int d=degree(s,step);
    const auto& scale=scales[std::clamp(s.scale,0,scaleCount-1)];
    const int base=(std::clamp(s.octave,2,6)+1)*12+std::clamp(s.root,0,11);
    for(int i=0;i<c.size;++i) {
        const int n=d+i*2;
        c.notes[static_cast<std::size_t>(i)]=base+scale.notes[static_cast<std::size_t>(n%scale.size)]+12*(n/scale.size);
    }
    if(s.voicing==1 || s.voicing==2) {
        for(int k=0;k<s.voicing;++k) {
            int first=c.notes[0]+12;
            // Non-heptatonic extended chords can already contain this octave.
            while(std::find(c.notes.begin()+1,c.notes.begin()+c.size,first)!=c.notes.begin()+c.size) first+=12;
            for(int i=0;i<c.size-1;++i) c.notes[static_cast<std::size_t>(i)]=c.notes[static_cast<std::size_t>(i+1)];
            c.notes[static_cast<std::size_t>(c.size-1)]=first;
            std::sort(c.notes.begin(),c.notes.begin()+c.size);
        }
    }
    if(s.voicing==3) {
        int raised=c.notes[1]+12;
        bool collision=true;
        while(collision) {
            collision=false;
            for(int i=0;i<c.size;++i) if(i!=1 && c.notes[static_cast<std::size_t>(i)]==raised) collision=true;
            if(collision) raised+=12;
        }
        c.notes[1]=raised; std::sort(c.notes.begin(),c.notes.begin()+c.size);
    }
    // Shift the entire voicing by octaves, preserving scale membership and spacing.
    while(c.notes[static_cast<std::size_t>(c.size-1)]>127) for(int i=0;i<c.size;++i) c.notes[static_cast<std::size_t>(i)]-=12;
    while(c.notes[0]<0) for(int i=0;i<c.size;++i) c.notes[static_cast<std::size_t>(i)]+=12;
    return c;
}
inline double barsPerChord(int choice) noexcept {
    constexpr double values[]{0.5,1.0,2.0,4.0};
    return values[std::clamp(choice,0,3)];
}
}
