
/**
 * Command:
 *    node build/search-and-replace.js
*/

const fs = require('fs');
const path = require('path');

const themeDir = path.join(__dirname, '../themes');
const replaceFilePath = path.join(__dirname, 'search-and-replace.txt');
const separator = '----------------------------------------';
const nl = '\n';

// Helpers
const readText = p => fs.readFileSync(p, 'utf-8').replace(/\r\n/g, '\n');
const stripTrailingEmpty = arr => {
  let i = arr.length - 1;
  while (i >= 0 && arr[i].trim() === '') i--;
  return arr.slice(0, i + 1);
};

// 1) Datei lesen & splitten
const fullContent = readText(replaceFilePath);
const lines = fullContent.split(nl);
const sepIdx = lines.findIndex(l => l.trim() === separator);

const inputLines = sepIdx >= 0 ? lines.slice(0, sepIdx) : lines;
const historyLines = sepIdx >= 0 ? lines.slice(sepIdx) : [];

// 2) Eingabebereich bereinigen (nur nicht-leere Zeilen)
const inputLinesClean = inputLines.map(l => l.trim()).filter(Boolean);

// 3) Ersetzungen parsen (nur Zeilen mit ->)
const replacements = inputLinesClean
  .filter(l => l.includes('->'))
  .map(l => {
    const [fromRaw, toRaw] = l.split('->');
    const from = fromRaw.trim().slice(1, -1);
    const to   = toRaw.trim().slice(1, -1);
    return from ? ({ from, to }) : null;
  })
  .filter(Boolean);

// 4) Themes ersetzen
fs.readdirSync(themeDir).forEach(file => {
  if (path.extname(file) === '.json') {
    const fp = path.join(themeDir, file);
    let content = readText(fp);
    replacements.forEach(({ from, to }) => {
      content = content.split(from).join(to);
    });
    fs.writeFileSync(fp, content, 'utf-8');
    console.log(`✔ ${file}`);
  }
});

// 5) Eingabebereich selbst ersetzen (auf Original-Linien!)
let updatedInputLines = inputLines.map(line => {
  let u = line;
  replacements.forEach(({ from, to }) => {
    u = u.split(from).join(to);
  });
  return u;
});
updatedInputLines = stripTrailingEmpty(updatedInputLines);

// 6) Historien-Einträge bauen (alle nicht-leeren Zeilen, inkl. Überschriften)
const histEntries = inputLinesClean.map(line => {
  if (!line.includes('->')) return line; // Überschriften/sonstiges unverändert
  const [fromRaw, toRaw] = line.split('->');
  const from = fromRaw.trim().slice(1, -1);
  const to   = toRaw.trim().slice(1, -1);
  const arrow = (from === to) ? '= ' : '->';
  return `'${from}' ${arrow} '${to}'`;
});

// 7) Zusammenbauen & schreiben
let newContent;
if (inputLinesClean.length > 0) {
  const newHistoryBlock = [
    '', '', '',            // exakt 3 Leerzeilen
    separator,
    '',
    ...histEntries,
    ''                     // Leerzeile am Blockende
  ];

  newContent = [
    ...updatedInputLines,
    ...newHistoryBlock,
    ...historyLines
  ].join(nl);
} else {
  newContent = fullContent;
}

fs.writeFileSync(replaceFilePath, newContent, 'utf-8');
console.log('✔ Searched & Replaced');
