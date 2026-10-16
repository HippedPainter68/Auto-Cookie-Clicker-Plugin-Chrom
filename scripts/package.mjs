import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { zipSync, strToU8 } from 'fflate';
import { createHash } from 'node:crypto';
import path from 'node:path';
const files = {};
async function collect(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (entry.isDirectory()) await collect(path.join(directory, entry.name), name + '/');
    else files[name] = [new Uint8Array(await readFile(path.join(directory, entry.name))), { mtime: new Date('2020-01-01T00:00:00Z') }];
  }
}
await collect('extension');
files['INSTALLATION.txt'] = [strToU8('Auto Cookie Clicker Plugin Chrom\n\n1. Dieses ZIP entpacken.\n2. In Chrome chrome://extensions öffnen.\n3. Entwicklermodus einschalten.\n4. Entpackte Erweiterung laden → diesen Ordner mit manifest.json auswählen.\n5. Cookie Clicker neu laden, Erweiterungssymbol anklicken und Automatik starten.\n\nAnleitung, Quellcode, Lizenz und Testgrenzen:\nhttps://github.com/HippedPainter68/Auto-Cookie-Clicker-Plugin-Chrom\n\nAlle legitimen Achievements sind das Ziel, keine vollständige End-to-End-Garantie. Keine Ressourcen- oder Zeit-Cheats. Fenster-Erfolge verkleinern bei aktivierter Option kurz das Chrome-Fenster.\n'), { mtime:new Date('2020-01-01T00:00:00Z') }];
const version = JSON.parse(await readFile('extension/manifest.json', 'utf8')).version;
const name = `Auto-Cookie-Clicker-Plugin-Chrom-v${version}.zip`;
const zip = zipSync(files, { level:9 });
await mkdir('dist', {recursive:true});
await writeFile('dist/' + name, zip);
await writeFile('dist/SHA256SUMS.txt', createHash('sha256').update(zip).digest('hex') + '  ' + name + '\n');
console.log(`Packaged dist/${name}: ${Object.keys(files).length} files, ${zip.length} bytes`);
