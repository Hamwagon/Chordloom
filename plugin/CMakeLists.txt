cmake_minimum_required(VERSION 3.22)
project(Chordloom VERSION 1.0.0 LANGUAGES C CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
include(FetchContent)
FetchContent_Declare(JUCE GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
                         GIT_TAG 8.0.12 GIT_SHALLOW TRUE)
FetchContent_MakeAvailable(JUCE)
juce_add_plugin(Chordloom COMPANY_NAME "Chordloom" BUNDLE_ID "music.chordloom.generator"
    PLUGIN_MANUFACTURER_CODE Chlm PLUGIN_CODE Chgn FORMATS VST3 PRODUCT_NAME "Chordloom"
    IS_SYNTH TRUE NEEDS_MIDI_INPUT TRUE NEEDS_MIDI_OUTPUT TRUE IS_MIDI_EFFECT FALSE
    COPY_PLUGIN_AFTER_BUILD FALSE VST3_CATEGORIES Instrument Generator)
juce_generate_juce_header(Chordloom)
target_sources(Chordloom PRIVATE Source/PluginProcessor.cpp Source/PluginProcessor.h Source/ChordEngine.h Source/ScaleCatalog.h)
target_compile_definitions(Chordloom PUBLIC JUCE_WEB_BROWSER=0 JUCE_USE_CURL=0 JUCE_VST3_CAN_REPLACE_VST2=0)
target_link_libraries(Chordloom PRIVATE juce::juce_audio_utils
    PUBLIC juce::juce_recommended_config_flags juce::juce_recommended_warning_flags)
option(CHORDLOOM_BUILD_TESTS "Build chord engine checks" ON)
if(CHORDLOOM_BUILD_TESTS)
    enable_testing()
    add_executable(chordloom_core_test Source/ChordEngineTest.cpp)
    add_test(NAME chordloom_core COMMAND chordloom_core_test)
endif()
