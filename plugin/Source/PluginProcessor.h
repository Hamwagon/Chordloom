#pragma once
#include <JuceHeader.h>
#include "ChordEngine.h"
class ChordloomProcessor final : public juce::AudioProcessor {
public:
    ChordloomProcessor();
    const juce::String getName() const override { return "Chordloom"; }
    void prepareToPlay(double,int) override;
    void releaseResources() override {}
    void processBlock(juce::AudioBuffer<float>&,juce::MidiBuffer&) override;
    bool isBusesLayoutSupported(const BusesLayout&) const override;
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return true; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }
    bool hasEditor() const override { return true; }
    juce::AudioProcessorEditor* createEditor() override;
    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int) override {}
    const juce::String getProgramName(int) override { return {}; }
    void changeProgramName(int,const juce::String&) override {}
    void getStateInformation(juce::MemoryBlock&) override;
    void setStateInformation(const void*,int) override;
    juce::AudioProcessorValueTreeState parameters;
private:
    static juce::AudioProcessorValueTreeState::ParameterLayout createParameters();
    chordloom::Settings readSettings() const noexcept;
    void noteOffs(juce::MidiBuffer&,int);
    void noteOns(juce::MidiBuffer&,int,int,const chordloom::Settings&);
    std::array<std::atomic<float>*,12> raw{};
    chordloom::Settings previous;
    chordloom::Chord held;
    bool hasHeld=false,wasPlaying=false,hasExpected=false;
    int heldChannel=1;
    std::int64_t cycle=std::numeric_limits<std::int64_t>::min();
    double sampleRateHz=44100.0,expectedPpq=0.0;
    juce::MidiBuffer generated;
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(ChordloomProcessor)
};
