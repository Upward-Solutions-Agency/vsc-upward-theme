const fs = require('fs');
const path = require('path');
const { parse, printParseErrorCode } = require('jsonc-parser');

const inputDir = path.join(__dirname, '../themes-dev');
const outputDir = path.join(__dirname, '../themes');

function ensureOutputDir() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}

function compileAll() {
  ensureOutputDir();
  fs.readdirSync(inputDir).forEach(file => {
    if (path.extname(file) === '.jsonc') {
      compileFile(path.join(inputDir, file));
    }
  });
}

function compileFile(inputPath) {
  if (!inputPath.endsWith('.jsonc')) return;

  const fileName = path.basename(inputPath);
  const outputName = fileName.replace(/\.jsonc$/, '.json');
  const outputPath = path.join(outputDir, outputName);

  const content = fs.readFileSync(inputPath, 'utf8');
  const errors = [];
  const parsed = parse(content, errors, { allowTrailingComma: true });

  if (errors.length) {
    console.error(`Fehler beim Parsen von ${fileName}:`);
    errors.forEach(err =>
      console.error(`  • ${printParseErrorCode(err.error)} an Offset ${err.offset}`)
    );
    process.exit(1);
  }

  fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2), 'utf8');
  console.log(`✅ Kompiliert: ${inputPath} → ${outputPath}`);
}

// Entry Point
const arg = process.argv[2];
if (!arg) {
  compileAll();
} else {
  ensureOutputDir();
  compileFile(arg);
}
