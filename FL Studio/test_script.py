"""Contract tests with a minimal public FL API test double; not a host test."""
import pathlib, runpy, sys, types, itertools
class Dialog:
    def __init__(self,*args): self.values = {}
    def addInputCombo(self,name,options,default): self.values[name] = default
    def addInputKnobInt(self,name,default,*args): self.values[name] = default
    def addInputKnob(self,name,default,*args): self.values[name] = default
    def getInputValue(self,name): return self.values[name]
class Note: pass
class Score:
    PPQ = 96
    def __init__(self): self.notes=[]
    def addNote(self,note): self.notes.append(note)
score=Score()
sys.modules['flpianoroll']=types.SimpleNamespace(ScriptDialog=Dialog,Note=Note,score=score)
script=runpy.run_path(str(pathlib.Path(__file__).with_name('Chordloom.pyscript')))
form=script['createDialog']()
script['apply'](form)
assert len(score.notes)==16
assert [n.number for n in score.notes[:4]]==[48,51,55,58]
assert score.notes[-1].time==12*96
assert all(n.length==346 for n in score.notes)
assert len(script['SCALES']) == len(script['SCALE_NAMES']) == 70
# Full harmonic coverage; timing variants are checked separately below.
cases=0
for root,scale,color,voicing,rhythm,count,bars in itertools.product(range(12),range(len(script['SCALES'])),range(3),range(3),range(3),range(1),range(1)):
    form=script['createDialog']()
    for k,v in {'Root':root,'Scale':scale,'Chord color':color,'Voicing':voicing,'Rhythm':rhythm,'Chord count':count,'Bars per chord':bars}.items(): form.values[k]=v
    sentinel=Note();score.notes=[sentinel]
    script['apply'](form)
    assert score.notes[0] is sentinel
    notes=score.notes[1:]
    chords=(4,8)[count];span=(1,2,4)[bars]*4*96
    expected=chords*(3+color) if rhythm==0 else chords*(span//96)*(3+color) if rhythm==1 else chords*(span//48)
    assert len(notes)==expected
    assert len({(n.time,n.number) for n in notes})==len(notes)
    for n in notes:
        assert 0<=n.number<=127 and n.time>=0 and n.length>0
        assert (n.number-root)%12 in script['SCALES'][scale]
        assert n.time+n.length<=chords*span
    cases+=1
# Exercise long durations and eight chords in all scales, including generated degrees.
for scale,count,bars,rhythm in itertools.product(range(70),range(2),range(3),range(3)):
    form=script['createDialog']()
    form.values.update({'Scale':scale,'Progression':6,'Chord count':count,'Bars per chord':bars,'Rhythm':rhythm,'Chord color':2})
    score.notes=[];script['apply'](form)
    end=(4,8)[count]*(1,2,4)[bars]*4*96
    assert all(n.time+n.length<=end and (n.number%12) in script['SCALES'][scale] for n in score.notes)
    assert len({(n.time,n.number) for n in score.notes})==len(score.notes)
    cases+=1
form=script['createDialog']();form.values['Progression']=6
score.notes=[];script['apply'](form);first=[(n.time,n.number) for n in score.notes]
score.notes=[];script['apply'](form);assert first==[(n.time,n.number) for n in score.notes]
print('PASS:',cases,'Piano roll configurations; reference notes, preserved existing notes, timing, scale membership and deterministic generation. FL host integration remains untested.')
