import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const byId = new Map(tree.individuals.map((person) => [person.id, person]));
const applied = [];

for (const family of tree.families) {
  if (!family.children || family.children.length < 2) continue;
  const kids = family.children.map((id) => byId.get(id)).filter(Boolean);
  const withPlace = kids.filter((kid) => kid.birth?.place);
  const missing = kids.filter((kid) => !kid.birth?.place);
  if (!withPlace.length || !missing.length) continue;

  const counts = new Map();
  for (const kid of withPlace) counts.set(kid.birth.place, (counts.get(kid.birth.place) || 0) + 1);
  const [place] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

  for (const kid of missing) {
    kid.birth = { date: kid.birth?.date ?? null, place };
    applied.push(`${kid.id} -> ${place}`);
  }
}

fs.writeFileSync(sourcePath, `${JSON.stringify(tree, null, 2)}\n`, 'utf8');
fs.writeFileSync(sitePath, `window.TREE_DATA = ${JSON.stringify(tree, null, 2)};\n`, 'utf8');
console.log(JSON.stringify({ applied: applied.length, details: applied }, null, 2));
