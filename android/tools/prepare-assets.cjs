#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const source = path.join(root, 'app');
const target = path.join(root, 'android/app/src/main/assets');
const check = process.argv.includes('--check');
if (!check) execFileSync(process.execPath, [path.join(source, 'build.cjs')], {stdio: 'inherit'});
const read = name => fs.readFileSync(path.join(source, name));
let html = read('index.html').toString('utf8');
html = html.replace('width=device-width,initial-scale=1', 'width=device-width,initial-scale=1,viewport-fit=cover')
  .replace('</head>', '<link rel="stylesheet" href="android.css"></head>')
  .replace('</body>', '<script src="android.js"></script></body>');
const expected = new Map([['index.html', Buffer.from(html)]]);
for (const match of html.matchAll(/(?:src|href)="([a-z-]+\.(?:js|css))"/g)) {
  expected.set(match[1], read(match[1]));
}
const notices = [
  ['spessasynth_core 4.3.22', 'app/vendor/LICENSE-spessasynth_core.txt'],
  ['stb-vorbis 0.0.6', 'app/vendor/LICENSE-stb-vorbis.txt'],
  ['Chordloom factory sound bank', 'soundfonts/LICENSE.txt']
].map(([name, file]) => name + '\n\n' + fs.readFileSync(path.join(root, file), 'utf8')).join('\n\n');
expected.set('NOTICE.txt', Buffer.from(notices));
if (check) {
  for (const [name, bytes] of expected) {
    const file = path.join(target, name);
    if (!fs.existsSync(file) || !fs.readFileSync(file).equals(bytes)) throw Error('Stale Android asset: ' + name);
  }
  const extra = fs.readdirSync(target).filter(name => !expected.has(name));
  if (extra.length) throw Error('Unexpected Android assets: ' + extra.join(', '));
  console.log('PASS: Android assets match current shared sources and license notices.');
} else {
  fs.rmSync(target, {recursive:true, force:true});
  fs.mkdirSync(target, {recursive:true});
  for (const [name, bytes] of expected) fs.writeFileSync(path.join(target, name), bytes);
  console.log('Prepared ' + expected.size + ' offline Android assets.');
}
