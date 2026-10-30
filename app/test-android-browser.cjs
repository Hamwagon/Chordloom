// Run after `node android/tools/prepare-assets.cjs` and a Playwright Chromium install.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const os = require('node:os');
const {chromium} = require('playwright-core');
const assets = path.resolve(__dirname, '../android/app/src/main/assets');
const csp = "default-src 'none'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src blob: data:; worker-src blob:; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'none'";
const types = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain', '.json': 'application/json', '.sf2': 'application/octet-stream', '.sf3': 'application/octet-stream'};
const server = http.createServer((request, response) => {
  const resource = path.resolve(assets, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
  if (!resource.startsWith(assets + path.sep) || !fs.existsSync(resource) || !fs.statSync(resource).isFile()) {
    response.writeHead(404); response.end(); return;
  }
  response.writeHead(200, {'Content-Type': (types[path.extname(resource)] || 'application/octet-stream') + '; charset=utf-8', 'Content-Security-Policy': csp, 'X-Content-Type-Options': 'nosniff'});
  fs.createReadStream(resource).pipe(response);
});

(async () => {
  assert(fs.existsSync(path.join(assets, 'index.html')), 'Generate Android assets before this test.');
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless: true, executablePath: process.env.CHORDLOOM_CHROMIUM || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']});
  let page;
  try {
    page = await browser.newPage({viewport: {width: 393, height: 852}, deviceScaleFactor: 1, isMobile: true, hasTouch: true});
    const errors = [], external = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/^https?:/.test(request.url()) && !request.url().startsWith(origin + '/')) external.push(request.url()); });
    await page.addInitScript(() => {
      window.__nativeExports = [];
      window.ChordloomAndroid = {saveFile(base64, name, mime) { window.__nativeExports.push({base64, name, mime}); }};
    });
    await page.goto(origin + '/index.html');
    await page.waitForFunction(() => document.querySelectorAll('#chords .chord').length === 4);
    assert.equal(await page.locator('#connect').isVisible(), false, 'Android must not offer unsupported live MIDI.');
    assert.equal(await page.locator('#androidPalette').getAttribute('open'), null, 'Phone controls begin collapsed.');

    async function capture(click) {
      const count = await page.evaluate(() => window.__nativeExports.length);
      await click();
      await page.waitForFunction(n => window.__nativeExports.length === n + 1, count);
      const saved = await page.evaluate(() => window.__nativeExports.at(-1));
      await page.evaluate(name => window.dispatchEvent(new CustomEvent('chordloom-export', {detail: {success: true, name}})), saved.name);
      assert.equal(await page.locator('#status').textContent(), 'Saved ' + saved.name + '.');
      return saved;
    }

    const expectedMidi = await page.evaluate(() => Array.from(Chordloom.midi(read(), Chordloom.progression(read(), degrees))));
    const midi = await capture(() => page.locator('#export').click());
    assert.equal(midi.mime, 'audio/midi');
    assert.deepEqual(Buffer.from(midi.base64, 'base64'), Buffer.from(expectedMidi), 'Actual MIDI button must call the replaced lexical download binding without changing bytes.');

    await page.locator('#save').evaluate(element => element.closest('details').open = true);
    const session = await capture(() => page.locator('#save').click());
    const sessionBytes = Buffer.from(session.base64, 'base64');
    const snapshot = JSON.parse(sessionBytes);
    assert.equal(snapshot.version, 4);
    await page.locator('#androidPalette').evaluate(element => element.open = true);
    await page.locator('#root').selectOption('5');
    await page.locator('#tempo').fill('173');
    await page.locator('#tempo').dispatchEvent('change');
    await page.locator('#sessionFile').setInputFiles({name: 'roundtrip.json', mimeType: 'application/json', buffer: sessionBytes});
    await page.waitForFunction(() => document.getElementById('status').textContent.startsWith('Session loaded.'));
    assert.equal(await page.locator('#root').inputValue(), String(snapshot.settings.root));
    assert.equal(await page.locator('#tempo').inputValue(), String(snapshot.settings.tempo));
    assert.deepEqual(await page.evaluate(() => degrees), snapshot.degrees);

    // Choose a simple arrangement with supported guitar shapes, then exercise the real tab button.
    for (const [id, value] of [['root', '0'], ['scale', 'major'], ['extension', '3'], ['voicing', 'close'], ['octave', '3'], ['preset', 'Homecoming']]) await page.locator('#' + id).selectOption(value);
    await page.locator('#fretboardPanel').evaluate(element => element.open = true);
    await page.waitForFunction(() => !document.getElementById('exportTab').disabled);
    const expectedTab = await page.locator('#tablature').textContent();
    const tab = await capture(() => page.locator('#exportTab').click());
    assert.equal(Buffer.from(tab.base64, 'base64').toString('utf8'), expectedTab);

    await page.locator('#tempo').fill('240');
    await page.locator('#tempo').dispatchEvent('change');
    await page.locator('#tempo').blur();
    await page.locator('#soundBank').selectOption('factory');
    await page.waitForFunction(() => document.getElementById('instrument').options.length === 24);
    await page.locator('#play').click();
    await page.waitForFunction(() => { const audio = document.getElementById('audioPlayer'); return audio.readyState === 4 && !audio.paused && audio.currentTime > .05; }, null, {timeout: 30000});
    await page.evaluate(() => window.dispatchEvent(new Event('chordloom-pause')));
    assert.equal(await page.locator('#audioPlayer').evaluate(audio => audio.paused), true);
    assert.equal(await page.locator('#position').textContent(), 'READY');

    await page.locator('#soundfontFile').setInputFiles(path.resolve(__dirname, '../soundfonts/Chordloom-Soft-Keys.sf3'));
    await page.waitForFunction(() => document.getElementById('soundfontInfo').textContent.includes('Chordloom-Soft-Keys.sf3') && document.getElementById('instrument').options.length === 1);
    await page.locator('#play').click();
    await page.waitForFunction(() => { const audio = document.getElementById('audioPlayer'); return audio.readyState === 4 && !audio.paused && audio.currentTime > .05; }, null, {timeout: 30000});
    await page.locator('#stop').click();

    await page.locator('#android-licenses').evaluate(element => element.open = true);
    await page.waitForFunction(() => document.querySelector('.android-license-text').textContent.includes('Apache'));
    for (const width of [360, 393, 430]) {
      await page.setViewportSize({width, height: 852});
      const layout = await page.evaluate(() => ({viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth,
        undersized: [...document.querySelectorAll('button, select, input:not([type="checkbox"]):not([type="file"]), summary')].filter(element => { const rect = element.getBoundingClientRect(); return rect.width && (rect.height < 43 || rect.width < 43); }).map(element => element.id || element.className)}));
      assert(layout.document <= layout.viewport && layout.body <= layout.viewport, `Horizontal overflow at ${width}px: ${JSON.stringify(layout)}`);
      assert.deepEqual(layout.undersized, [], `Small touch targets at ${width}px`);
    }
    await page.setViewportSize({width: 393, height: 852});
    await page.locator('#androidPalette').evaluate(element => element.open = false);
    await page.locator('#fretboardPanel').evaluate(element => element.open = false);
    await page.locator('#android-licenses').evaluate(element => element.open = false);
    await page.evaluate(() => scrollTo(0, 0));
    const screenshot = path.join(os.tmpdir(), 'chordloom-android-393.png');
    await page.screenshot({path: screenshot, fullPage: true});
    assert.deepEqual(errors, [], 'No browser JavaScript errors');
    assert.deepEqual(external, [], 'All app resources remain local');
    console.log('PASS: 360/393/430px phone layout, touch targets, native MIDI/session/tab payloads, session roundtrip, 24 factory presets, factory/SF3 playback, lifecycle pause, local licenses and no external requests. Screenshot: ' + screenshot);
  } catch (error) {
    if (page) console.error('Browser state:', await page.evaluate(() => ({status: document.getElementById('status')?.textContent, play: document.getElementById('play')?.textContent, readyState: document.getElementById('audioPlayer')?.readyState, paused: document.getElementById('audioPlayer')?.paused, currentTime: document.getElementById('audioPlayer')?.currentTime})).catch(() => null));
    if (page) await page.screenshot({path: path.join(os.tmpdir(), 'chordloom-android-browser-failure.png'), fullPage: true}).catch(() => {});
    throw error;
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
