
/**
 * Command:
 *    node build/search-and-replace.js
*/

const fs = require('fs');
const path = require('path');

const themeDir = path.join(__dirname, '../themes');
const replaceFile = path.join(__dirname, 'search-and-replace.txt');

// Einfache Textbasierte Ersetzungen einlesen
const rawReplacements = fs.readFileSync(replaceFile, 'utf-8');
const replacementLines = rawReplacements.split('\n')
    .map(line => line.trim())
    .filter(line => line.includes('->'));

const replacements = replacementLines.map(line => {
    const [fromRaw, toRaw] = line.split('->');
    const from = fromRaw.trim().slice(1, -1); // entfernt die äußeren '
    const to = toRaw.trim().slice(1, -1);
    return { from, to };
});

// Alle JSON-Dateien bearbeiten
fs.readdirSync(themeDir).forEach(file => {
    if (path.extname(file) === '.json') {
        const filePath = path.join(themeDir, file);
        let content = fs.readFileSync(filePath, 'utf-8');

        replacements.forEach(({ from, to }) => {
            content = content.split(from).join(to); // stupides Suchen + Ersetzen
        });

        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✔ Datei aktualisiert: ${file}`);
    }
});
