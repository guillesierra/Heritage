import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const ana = tree.individuals.find((item) => item.id === '@I500066@');
const jose = tree.individuals.find((item) => item.id === '@I500071@');
if (!ana || !jose) throw new Error('No se encontraron @I500066@ o @I500071@.');

ana.birth = { ...(ana.birth || {}), date: '1962' };
ana.birthYear = 1962;

jose.birth = { date: '1959', place: null };
jose.birthYear = 1959;

fs.writeFileSync(sourcePath, `${JSON.stringify(tree, null, 2)}\n`, 'utf8');
fs.writeFileSync(sitePath, `window.TREE_DATA = ${JSON.stringify(tree, null, 2)};\n`, 'utf8');
console.log('ok');
