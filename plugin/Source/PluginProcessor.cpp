#include "PluginProcessor.h"
juce::AudioProcessorValueTreeState::ParameterLayout ChordloomProcessor::createParameters() {
    using namespace juce;
    AudioProcessorValueTreeState::ParameterLayout p;
    StringArray scaleNames;
    for(const auto& scale:chordloom::scales) scaleNames.add(scale.name);
    p.add(std::make_unique<AudioParameterChoice>(ParameterID{"root",1},"Root",StringArray{"C","C#","D","D#","E","F","F#","G","G#","A","A#","B"},0));
    p.add(std::make_unique<AudioParameterChoice>(ParameterID{"scale",1},"Scale",scaleNames,0));
    p.add(std::make_unique<AudioParameterChoice>(ParameterID{"progression",1},"Progression",StringArray{"1 - 5 - 6 - 4","6 - 4 - 1 - 5","2 - 5 - 1 - 1","1 - 6 - 4 - 5","1 - 4 - 6 - 5","1 - 7 - 6 - 7","1 - 3 - 4 - 5","1 - 4 - 1 - 5","Generated (variation)"},0));
    p.add(std::make_unique<AudioParameterInt>(ParameterID{"variation",1},"Variation seed",0,127,0));
    p.add(std::make_unique<AudioParameterChoice>(ParameterID{"extension",1},"Chord size",StringArray{"Triads","Sevenths","Ninths"},0));
    p.add(std::make_unique<AudioParameterChoice>(ParameterID{"voicing",1},"Voicing",StringArray{"Root position","First inversion","Second inversion","Open"},0));
    p.add(std::make_unique<AudioParameterInt>(ParameterID{"octave",1},"Root octave (C4 = MIDI 60)",2,6,3));
    p.add(std::make_unique<AudioParameterInt>(ParameterID{"velocity",1},"Velocity",1,127,90));
    p.add(std::make_unique<AudioParameterInt>(ParameterID{"channel",1},"MIDI channel",1,16,1));
    p.add(std::make_unique<AudioParameterChoice>(ParameterID{"duration",1},"Bars per chord",StringArray{"Half bar","1 bar","2 bars","4 bars"},1));
    p.add(std::make_unique<AudioParameterFloat>(ParameterID{"gate",1},"Gate",NormalisableRange<float>{0.10f,1.0f,0.01f},0.90f));
    p.add(std::make_unique<AudioParameterBool>(ParameterID{"enabled",1},"Generate MIDI (host Play)",true));
    return p;
}
ChordloomProcessor::ChordloomProcessor()
    : AudioProcessor(BusesProperties().withOutput("Silent output",juce::AudioChannelSet::stereo(),true)),
      parameters(*this,nullptr,"ChordloomState",createParameters()) {
    constexpr const char* ids[]{"root","scale","progression","variation","extension","voicing","octave","velocity","channel","duration","gate","enabled"};
    for(std::size_t i=0;i<raw.size();++i) raw[i]=parameters.getRawParameterValue(ids[i]);
}
bool ChordloomProcessor::isBusesLayoutSupported(const BusesLayout& l) const {
    return l.getMainInputChannelSet().isDisabled()
        && (l.getMainOutputChannelSet()==juce::AudioChannelSet::stereo()
            || l.getMainOutputChannelSet()==juce::AudioChannelSet::mono());
}
void ChordloomProcessor::prepareToPlay(double sr,int) {
    sampleRateHz=sr;
    generated.ensureSize(65536);
    hasHeld=false; wasPlaying=false; hasExpected=false;
    cycle=std::numeric_limits<std::int64_t>::min();
}
chordloom::Settings ChordloomProcessor::readSettings() const noexcept {
    chordloom::Settings s;
    s.root=static_cast<int>(raw[0]->load()); s.scale=static_cast<int>(raw[1]->load());
    s.progression=static_cast<int>(raw[2]->load()); s.variation=static_cast<int>(raw[3]->load());
    s.extension=static_cast<int>(raw[4]->load()); s.voicing=static_cast<int>(raw[5]->load());
    s.octave=static_cast<int>(raw[6]->load()); s.velocity=static_cast<int>(raw[7]->load());
    s.channel=static_cast<int>(raw[8]->load()); s.duration=static_cast<int>(raw[9]->load());
    s.gate=raw[10]->load(); s.enabled=raw[11]->load()>0.5f;
    return s;
}
void ChordloomProcessor::noteOffs(juce::MidiBuffer& m,int offset) {
    if(!hasHeld) return;
    for(int i=0;i<held.size;++i)
        m.addEvent(juce::MidiMessage::noteOff(heldChannel,held.notes[static_cast<std::size_t>(i)]),offset);
    hasHeld=false;
}
void ChordloomProcessor::noteOns(juce::MidiBuffer& m,int offset,int step,const chordloom::Settings& s) {
    held=chordloom::makeChord(s,step); heldChannel=s.channel;
    for(int i=0;i<held.size;++i)
        m.addEvent(juce::MidiMessage::noteOn(heldChannel,held.notes[static_cast<std::size_t>(i)],static_cast<juce::uint8>(s.velocity)),offset);
    hasHeld=true;
}
void ChordloomProcessor::processBlock(juce::AudioBuffer<float>& audio,juce::MidiBuffer& midi) {
    juce::ScopedNoDenormals noDenormals;
    audio.clear(); generated.clear();
    const auto s=readSettings();
    bool playing=false;
    double ppq=0.0,bpm=120.0,quartersPerBar=4.0;
    if(auto* head=getPlayHead())
        if(auto p=head->getPosition())
            if(auto q=p->getPpqPosition())
                if(auto b=p->getBpm()) {
                    ppq=*q; bpm=*b;
                    playing=p->getIsPlaying() && std::isfinite(ppq) && std::isfinite(bpm) && bpm>0.0;
                    if(auto t=p->getTimeSignature())
                        if(t->numerator>0 && t->denominator>0) quartersPerBar=t->numerator*4.0/t->denominator;
                }
    const int count=audio.getNumSamples();
    const double increment=bpm/(60.0*sampleRateHz);
    const bool discontinuity=hasExpected && std::abs(ppq-expectedPpq)>std::max(0.005,increment*2.0);
    if(!playing || !s.enabled || s!=previous || discontinuity || !wasPlaying) {
        noteOffs(generated,0);
        cycle=std::numeric_limits<std::int64_t>::min();
    }
    // Incoming notes are consumed: the plugin owns its output note stream.
    if(playing && s.enabled) {
        const double length=quartersPerBar*chordloom::barsPerChord(s.duration);
        for(int sample=0;sample<count;++sample) {
            const double position=ppq+sample*increment;
            const double cell=std::floor(position/length);
            // A conservative bound also avoids floating-point overflow in conversion.
            if(std::abs(cell)>9.0e15) continue;
            const auto current=static_cast<std::int64_t>(cell);
            const double phase=position-cell*length;
            if(current!=cycle) {
                noteOffs(generated,sample); cycle=current;
                if(phase<length*s.gate)
                    noteOns(generated,sample,static_cast<int>((current%4+4)%4),s);
            }
            if(hasHeld && phase>=length*s.gate) noteOffs(generated,sample);
        }
    }
    midi.clear();
    midi.addEvents(generated,0,-1,0);
    previous=s; wasPlaying=playing && s.enabled;
    expectedPpq=ppq+count*increment; hasExpected=playing;
}
juce::AudioProcessorEditor* ChordloomProcessor::createEditor() {
    auto* editor=new juce::GenericAudioProcessorEditor(*this);
    editor->setSize(590,620);
    return editor;
}
void ChordloomProcessor::getStateInformation(juce::MemoryBlock& dest) {
    if(auto xml=parameters.copyState().createXml()) copyXmlToBinary(*xml,dest);
}
void ChordloomProcessor::setStateInformation(const void* data,int bytes) {
    if(auto xml=getXmlFromBinary(data,bytes))
        if(xml->hasTagName(parameters.state.getType())) parameters.replaceState(juce::ValueTree::fromXml(*xml));
}
juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter() { return new ChordloomProcessor(); }
