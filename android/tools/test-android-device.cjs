#!/usr/bin/env node
// Run against a booted Android emulator. No desktop browser is launched.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');

const project = path.resolve(__dirname, '../..');
const flags = new Map();
for (let i = 2; i < process.argv.length; i += 2) flags.set(process.argv[i], process.argv[i + 1]);
const apk = path.resolve(project, flags.get('--apk') || 'android/app/build/outputs/apk/debug/app-debug.apk');
const output = path.resolve(project, flags.get('--out') || 'android/device-test-results');
fs.mkdirSync(output, { recursive: true });
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
const adb = process.env.ADB || (sdk ? path.join(sdk, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb') : 'adb');
let serial = flags.get('--serial') || process.env.ANDROID_SERIAL;
let androidDevice, page, webviewBounds;
const passed = [];
const errors = [];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
function adbCall(args, timeout = 30000, binary = false) {
  return cp.execFileSync(adb, [...(serial ? ['-s', serial] : []), ...args], {
    encoding: binary ? null : 'utf8', timeout, maxBuffer: 16 * 1024 * 1024,
  });
}
function proof(name, details = {}) {
  passed.push(name);
  console.log('PASS', name, JSON.stringify(details));
}
async function state() {
  return page.evaluate(() => ({
    degree: document.querySelector('#chords .chord select')?.value,
    paused: document.querySelector('audio')?.paused,
    currentTime: document.querySelector('audio')?.currentTime,
    readyState: document.querySelector('audio')?.readyState,
    status: document.querySelector('#status')?.textContent,
    lifecycle: window.deviceTestLifecycle || [],
  }));
}
async function advancing(previousSource) {
  await page.waitForFunction(old => {
    const audio = document.querySelector('audio');
    return audio && !audio.paused && audio.readyState >= 3 && audio.currentTime > .2
      && (!old || audio.src !== old);
  }, previousSource || null, { timeout: 90000 });
}
function uiNodes(name) {
  adbCall(['shell', 'uiautomator', 'dump', '/sdcard/chordloom-device-test.xml'], 30000);
  const xml = adbCall(['exec-out', 'cat', '/sdcard/chordloom-device-test.xml']);
  fs.writeFileSync(path.join(output, name + '.xml'), xml);
  const nodes = [];
  for (const node of xml.matchAll(/<node\b([^>]+)>/g)) {
    const attrs = {};
    for (const attr of node[1].matchAll(/([\w-]+)="([^"]*)"/g)) attrs[attr[1]] = attr[2];
    nodes.push(attrs);
  }
  return nodes;
}
function nativeTap(node) {
  assert(node, 'Expected option was absent from the native Android select popup');
  const box = node.bounds.match(/\d+/g).map(Number);
  adbCall(['shell', 'input', 'tap', String((box[0] + box[2]) / 2 | 0), String((box[1] + box[3]) / 2 | 0)]);
}
async function chooseNativeDegree(text, value, name) {
  const before = await page.evaluate(() => document.querySelector('audio').src);
  const select = page.locator('#chords .chord select').first();
  await select.scrollIntoViewIfNeeded();
  if (webviewBounds) {
    const point = await select.evaluate(element => {
      const box = element.getBoundingClientRect();
      return { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2, ratio: devicePixelRatio };
    });
    adbCall(['shell', 'input', 'tap', String(webviewBounds[0] + Math.round(point.x * point.ratio)), String(webviewBounds[1] + Math.round(point.y * point.ratio))]);
  } else {
    await select.click();
  }
  await sleep(400);
  let nodes = uiNodes(name);
  const optionIn = items => items.find(node => node.text === text && /CheckedTextView|RadioButton|TextView/.test(node.class));
  let option = optionIn(nodes);
  if (!option) {
    // Some WebView versions ignore CDP mouse input: tap its measured physical coordinates.
    const webview = nodes.find(node => node.class === 'android.webkit.WebView');
    assert(webview, 'No WebView bounds available for native tap fallback');
    const bounds = webview.bounds.match(/\d+/g).map(Number);
    const point = await select.evaluate(element => {
      const box = element.getBoundingClientRect();
      return { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2, ratio: devicePixelRatio };
    });
    adbCall(['shell', 'input', 'tap', String(bounds[0] + Math.round(point.x * point.ratio)), String(bounds[1] + Math.round(point.y * point.ratio))]);
    await sleep(400);
    nodes = uiNodes(name);
    option = optionIn(nodes);
  }
  console.log('NATIVE_SELECT_POPUP', name, JSON.stringify(nodes.filter(node => /^[IVX]+$/.test(node.text)).map(node => ({ text: node.text, class: node.class, bounds: node.bounds }))));
  nativeTap(option);
  await page.waitForFunction(degree => document.querySelector('#chords .chord select').value === degree, value, { timeout: 30000 });
  await advancing(before);
  const current = await state();
  assert.equal(current.lifecycle.filter(event => event.type === 'native-pause').length, 0, 'Opening a native select popup unexpectedly paused the Activity');
  assert.equal(current.lifecycle.filter(event => event.type === 'visibility' && event.hidden).length, 0, 'Opening a native select popup unexpectedly hid the document');
  proof(name, current);
}
async function saveDiagnostics() {
  try { fs.writeFileSync(path.join(output, 'logcat.txt'), adbCall(['logcat', '-d', '-t', '2000'], 15000)); } catch (error) { console.error('Logcat capture:', error.message); }
  try { fs.writeFileSync(path.join(output, 'android-screen.png'), adbCall(['exec-out', 'screencap', '-p'], 15000, true)); } catch (error) { console.error('Screenshot capture:', error.message); }
  if (page) {
    try { fs.writeFileSync(path.join(output, 'webview-state.json'), JSON.stringify(await Promise.race([state(), sleep(5000).then(() => ({ unavailable: true }))]), null, 2)); } catch (error) { console.error('State capture:', error.message); }
  }
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ serial, passed, errors }, null, 2));
}
const watchdog = setTimeout(() => {
  console.error('FAIL Overall Android test deadline exceeded (7 minutes).');
  errors.push('Overall Android test deadline exceeded');
  try { fs.writeFileSync(path.join(output, 'logcat-timeout.txt'), adbCall(['logcat', '-d', '-t', '1000'], 10000)); } catch (_) {}
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ serial, passed, errors }, null, 2));
  process.exit(1);
}, 420000);
watchdog.unref();

(async () => {
  assert(fs.existsSync(apk), 'APK is missing: ' + apk);
  if (!serial) {
    const devices = adbCall(['devices']).split(/\r?\n/).map(line => line.trim().split(/\s+/)).filter(([id, status]) => id.startsWith('emulator-') && status === 'device');
    assert.equal(devices.length, 1, 'Expected one booted emulator; select one with --serial');
    serial = devices[0][0];
  }
  console.log('DEVICE', serial, 'API', adbCall(['shell', 'getprop', 'ro.build.version.sdk']).trim());
  console.log('APK_SHA256', require('node:crypto').createHash('sha256').update(fs.readFileSync(apk)).digest('hex'));
  adbCall(['install', '-r', apk], 120000);
  adbCall(['shell', 'am', 'force-stop', 'music.chordloom.android']);
  adbCall(['logcat', '-c']);
  adbCall(['shell', 'am', 'start', '-W', '-n', 'music.chordloom.android/.MainActivity'], 90000);
  let pid = '';
  for (let i = 0; i < 30 && !pid; i++) {
    pid = adbCall(['shell', 'pidof', 'music.chordloom.android']).trim().split(/\s+/)[0];
    if (!pid) await sleep(1000);
  }
  assert(pid, 'Android app process did not start');
  let playwright;
  try { playwright = require('playwright-core'); }
  catch (error) {
    if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw Error('Install playwright-core and set NODE_PATH to its node_modules directory.');
    playwright = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright-core'));
  }
  // Use Playwright's Android-aware CDP transport; a WebView is not desktop Chrome.
  const devices = await playwright._android.devices({ omitDriverInstall: true });
  androidDevice = devices.find(device => device.serial() === serial);
  assert(androidDevice, 'Android device was absent from Playwright ADB discovery');
  androidDevice.setDefaultTimeout(60000);
  const view = await androidDevice.webView({ pkg: 'music.chordloom.android' }, { timeout: 60000 });
  page = await view.page();
  assert(page, 'Chordloom WebView page was absent');
  page.setDefaultTimeout(60000);
  page.on('pageerror', error => errors.push('WebView: ' + error.message));
  await page.waitForURL('https://appassets.androidplatform.net/assets/index.html', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.querySelectorAll('#chords .chord').length === 4, null, { timeout: 60000 });
  proof('cold-load', await page.evaluate(() => ({ chords: document.querySelectorAll('#chords .chord').length, nativeBridge: typeof window.ChordloomAndroid?.saveFile, userAgent: navigator.userAgent })));
  const nativeView = uiNodes('cold-load').find(node => node.class === 'android.webkit.WebView');
  if (nativeView) webviewBounds = nativeView.bounds.match(/\d+/g).map(Number);
  await page.evaluate(() => {
    window.deviceTestLifecycle = [];
    document.addEventListener('visibilitychange', () => deviceTestLifecycle.push({ type: 'visibility', hidden: document.hidden }));
    window.addEventListener('chordloom-pause', () => deviceTestLifecycle.push({ type: 'native-pause' }));
    document.querySelector('#tempo').value = '240';
    document.querySelector('#tempo').dispatchEvent(new Event('change'));
    document.querySelector('#play').click();
  });
  await advancing();
  proof('built-in-playback', await state());
  await chooseNativeDegree('II', '1', 'built-in-native-degree-edit');
  await page.evaluate(() => {
    document.querySelector('#stop').click();
    const bank = document.querySelector('#soundBank');
    bank.value = 'factory'; bank.dispatchEvent(new Event('change'));
  });
  await page.waitForFunction(() => document.querySelector('#instrument').options.length === 24, null, { timeout: 60000 });
  await page.evaluate(() => document.querySelector('#play').click());
  await advancing();
  proof('factory-playback', await state());
  await chooseNativeDegree('III', '2', 'factory-native-degree-edit');
  await page.evaluate(() => {
    document.querySelector('#stop').click();
    document.querySelector('#tempo').value = '200';
    document.querySelector('#tempo').dispatchEvent(new Event('change'));
    document.querySelector('#play').click();
    const select = document.querySelector('#chords .chord select');
    select.value = '3'; select.dispatchEvent(new Event('change'));
  });
  await advancing();
  assert.equal((await state()).degree, '3');
  proof('edit-during-factory-preparation', await state());
  await page.evaluate(() => {
    document.querySelector('#stop').click();
    document.querySelector('#tempo').value = '220';
    document.querySelector('#tempo').dispatchEvent(new Event('change'));
    document.querySelector('#play').click();
    document.querySelector('#stop').click();
  });
  await sleep(1500);
  assert((await state()).paused, 'Cancelled render started playback afterward');
  proof('cancelled-render-stays-stopped', await state());
  await page.evaluate(() => document.querySelector('#play').click());
  await advancing();
  adbCall(['shell', 'input', 'keyevent', '3']);
  await sleep(1000);
  adbCall(['shell', 'am', 'start', '-n', 'music.chordloom.android/.MainActivity']);
  await sleep(500);
  assert((await state()).paused, 'Playback continued after leaving the foreground');
  proof('home-pause-and-resume', await state());
  await page.evaluate(() => document.querySelector('#play').click());
  await advancing();
  proof('replay-after-home', await state());
  await page.evaluate(() => document.querySelector('#stop').click());
  assert.equal(errors.length, 0, 'WebView page errors were reported');
  console.log('ANDROID_DEVICE_AUDIO_PASS', passed.length, 'checks');
})().catch(error => {
  errors.push(error.stack || String(error));
  console.error('ANDROID_DEVICE_AUDIO_FAIL', error);
  process.exitCode = 1;
}).finally(async () => {
  await saveDiagnostics();
  try { if (androidDevice) await androidDevice.close(); } catch (_) {}
  clearTimeout(watchdog);
});
