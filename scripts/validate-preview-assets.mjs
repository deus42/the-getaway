import fs from 'node:fs';
import path from 'node:path';

const targetDir = process.env.TARGET_DIR;
if (!targetDir) {
  console.error('TARGET_DIR env var is required (e.g. site/previews/<branch>/)');
  process.exit(2);
}

const indexPath = path.join(targetDir, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error(`Missing ${indexPath}`);
  process.exit(2);
}

const html = fs.readFileSync(indexPath, 'utf8');
const re = /assets\/[^"']+/g;
const refs = Array.from(new Set(html.match(re) || []));

const missing = refs.filter((rel) => !fs.existsSync(path.join(targetDir, rel)));
if (missing.length) {
  console.error('ERROR: index.html references missing assets:');
  for (const m of missing) console.error(' - ' + m);
  process.exit(2);
}

console.log(`OK: validated ${refs.length} asset references in ${indexPath}`);
