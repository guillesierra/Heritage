import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const place = 'Avilés, Principado de Asturias, España';

for (const id of ['@I500012@', '@I500188@', '@I500189@']) {
  const person = tree.individuals.find((item) => item.id === id);
  if (!person) throw new Error(`No encontrado: ${id}`);
  person.birth = { date: person.birth?.date ?? null, place };
}

fs.writeFileSync(sourcePath, `${JSON.stringify(tree, null, 2)}\n`, 'utf8');
fs.writeFileSync(sitePath, `window.TREE_DATA = ${JSON.stringify(tree, null, 2)};\n`, 'utf8');
console.log('ok');
