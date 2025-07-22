
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
const lines = fullContent.split('\n');
const sepIdx = lines.findIndex(l => l.trim() === separator);

const inputLines = sepIdx >= 0 ? lines.slice(0, sepIdx) : lines;
const historyLines = sepIdx >= 0 ? lines.slice(sepIdx) : [];

// 2) Eingabebereich bereinigen (Leerzeilen komplett raus für Verarbeitung/Historie)
const inputLinesClean = inputLines.map(l => l.trim()).filter(Boolean);

// 3) Ersetzungen parsen
const replacements = inputLinesClean
  .filter(l => l.includes('->'))
  .map(l => {
    const [fromRaw, toRaw] = l.split('->');
    const from = fromRaw.trim().slice(1, -1);
    const to = toRaw.trim().slice(1, -1);
    if (!from.length) return null;
    return { from, to };
  })
  .filter(Boolean);

// 4) Themes ersetzen
fs.readdirSync(themeDir).forEach(file => {
  if (path.extname(file) === '.json') {
    const filePath = path.join(themeDir, file);
    let content = readText(filePath);
    replacements.forEach(({ from, to }) => {
      content = content.split(from).join(to);
    });
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✔ Datei aktualisiert: ${file}`);
  }
});

// 5) Eingabebereich selbst ersetzen (auf Original-Linien!)
let updatedInputLines = inputLines.map(line => {
  let updated = line;
  replacements.forEach(({ from, to }) => {
    updated = updated.split(from).join(to);
  });
  return updated;
});

// 5a) Trailende Leerzeilen vor dem Separator entfernen
updatedInputLines = stripTrailingEmpty(updatedInputLines);

// 6) Historie anhängen (nur wenn es etwas gibt)
let updatedContent;
if (inputLinesClean.length > 0) {
  // genau drei Leerzeilen vor der Trennlinie
  const newHistoryBlock = [
    '', '', '',
    separator,
    '',
    ...inputLinesClean
  ];

  updatedContent = [
    ...updatedInputLines,
    ...newHistoryBlock,
    ...historyLines // unverändert anhängen
  ].join(nl);
} else {
  updatedContent = fullContent;
}

// 7) Datei zurückschreiben
fs.writeFileSync(replaceFilePath, updatedContent, 'utf-8');
console.log('✔ Datei aktualisiert: search-and-replace.txt');
