// Android-only adapter. Musical generation remains in the shared browser app.
(function (root) {
  'use strict';
  const MAX_EXPORT_BYTES = 16 * 1024 * 1024;

  async function encodeExport(data) {
    const bytes = new Uint8Array(await new Blob([data]).arrayBuffer());
    if (bytes.length > MAX_EXPORT_BYTES) throw new Error('The export is too large to save on Android.');
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 32768) {
      binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + 32768));
    }
    return btoa(binary);
  }

  // The small codec can also be checked without an Android or browser runtime.
  if (typeof module !== 'undefined' && module.exports) module.exports = { encodeExport, MAX_EXPORT_BYTES };
  if (typeof document === 'undefined') return;

  const $ = id => document.getElementById(id);
  const report = message => { if ($('status')) $('status').textContent = message; };
  document.documentElement.classList.add('chordloom-android');
  let exportPending = false;
  const browserDownload = root.download;
  root.download = function (data, name, type) {
    if (!root.ChordloomAndroid || typeof root.ChordloomAndroid.saveFile !== 'function') {
      return browserDownload(data, name, type);
    }
    if (exportPending) {
      queueMicrotask(() => report('Finish or cancel the current save before exporting another file.'));
      return;
    }
    exportPending = true;
    encodeExport(data).then(base64 => {
      report('Choose where to save ' + name + '.');
      root.ChordloomAndroid.saveFile(base64, name, type);
    }).catch(error => {
      exportPending = false;
      report('Could not save file: ' + error.message);
    });
  };
  root.addEventListener('chordloom-export', event => {
    exportPending = false;
    const result = event.detail || {};
    report(result.success ? 'Saved ' + (result.name || 'file') + '.' : result.cancelled ? 'Save cancelled. Your progression is unchanged.' : 'Could not save file: ' + (result.message || 'Please try again.'));
  });

  function pause() {
    if (typeof root.stop === 'function') root.stop(false);
    const audio = $('audioPlayer');
    if (audio) audio.pause();
  }
  root.ChordloomPause = pause;
  root.addEventListener('chordloom-pause', pause);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

  // Keep the progression and transport close to the top on a small screen.
  const aside = document.querySelector('.workspace > aside');
  if (aside) {
    const controls = document.createElement('details');
    controls.className = 'android-palette';
    controls.id = 'androidPalette';
    controls.open = root.matchMedia('(min-width: 651px)').matches;
    const summary = document.createElement('summary');
    summary.textContent = 'Palette & groove';
    const body = document.createElement('div');
    body.className = 'android-palette-body';
    while (aside.firstChild) body.append(aside.firstChild);
    controls.append(summary, body);
    aside.append(controls);
  }

  const midi = $('connect');
  if (midi) midi.hidden = true;
  if ($('midiOutput')) $('midiOutput').hidden = true;
  const sessions = midi && midi.closest('details');
  if (sessions) {
    sessions.querySelector('summary').textContent = 'Save & load sessions';
    const hint = sessions.querySelector('.hint');
    if (hint) hint.textContent = 'Save session JSON to keep your settings, chords and locks. Load it to continue later. This Android version exports MIDI files; live MIDI output is not available.';
  }
  const exportHint = document.querySelector('.export p');
  if (exportHint) exportHint.textContent = 'Save a MIDI file, then open or transfer it to your music app or DAW.';
  const local = document.querySelector('header .local');
  if (local) local.textContent = 'ANDROID · OFFLINE';
  if ($('loadSoundfont')) $('loadSoundfont').title = 'Load an .sf2 or .sf3 bank from your device';
  const tempo = $('tempo');
  if (tempo) tempo.setAttribute('inputmode', 'numeric');

  const help = document.createElement('details');
  help.id = 'android-help';
  help.className = 'android-help';
  const helpTitle = document.createElement('summary');
  helpTitle.textContent = 'Using Chordloom on Android';
  const helpText = document.createElement('p');
  helpText.className = 'hint';
  helpText.textContent = 'Open Palette & groove to change key, harmony and rhythm. Play previews the progression offline. Export MIDI and Export tab use the Android save picker. Save session JSON before closing the app to keep your work; sessions are not saved automatically. Load session restores it. Local SoundFonts must be selected again after reopening. Playback stops when Chordloom leaves the foreground.';
  help.append(helpTitle, helpText);
  const licenses = document.createElement('details');
  licenses.id = 'android-licenses';
  const licensesTitle = document.createElement('summary');
  licensesTitle.textContent = 'Third-party licenses';
  const licenseText = document.createElement('pre');
  licenseText.className = 'android-license-text';
  licenseText.textContent = 'Open to read the licenses included with this app.';
  licenses.append(licensesTitle, licenseText);
  let licensesLoaded = false, licensesLoading = false;
  licenses.addEventListener('toggle', async () => {
    if (!licenses.open || licensesLoaded || licensesLoading) return;
    licensesLoading = true;
    licenseText.textContent = 'Loading included licenses…';
    try {
      const response = await fetch('NOTICE.txt');
      if (!response.ok) throw new Error('License file unavailable.');
      licenseText.textContent = await response.text();
      licensesLoaded = true;
    } catch (error) {
      licenseText.textContent = 'Could not read the included licenses. Close and reopen this section to try again.';
    } finally {
      licensesLoading = false;
    }
  });
  const canvas = document.querySelector('.canvas');
  if (canvas) canvas.append(help, licenses);
  const footerLink = document.querySelector('footer a');
  if (footerLink) {
    footerLink.href = '#android-help';
    footerLink.textContent = 'Android help';
    footerLink.addEventListener('click', () => { help.open = true; });
  }
})(globalThis);
