import { DICTIONARY, PHRASES } from '../src/data';
import fs from 'fs';
import path from 'path';

const assetsDir = path.join(process.cwd(), 'public', 'assets');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

fs.writeFileSync(
  path.join(assetsDir, 'words.json'),
  JSON.stringify(DICTIONARY, null, 2)
);

fs.writeFileSync(
  path.join(assetsDir, 'phrases.json'),
  JSON.stringify(PHRASES, null, 2)
);

console.log('JSON files generated in public/assets/');
