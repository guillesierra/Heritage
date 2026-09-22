import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const byId = new Map(tree.individuals.map((person) => [person.id, person]));

const effectiveYear = (person) => {
  if (Number.isFinite(person.birthYear)) return person.birthYear;
  const match = String(person.birth?.date || '').match(/(1[0-9]{3}|20[0-9]{2})/);
  return match ? Number(match[1]) : null;
};

// Mapa de padres (hijo -> [padres]) y de hijos (persona -> [hijos])
const parentsOf = new Map();
const childrenOf = new Map();
for (const family of tree.families) {
  const parents = [family.husband, family.wife].filter(Boolean);
  for (const childId of family.children) {
    if (!byId.has(childId)) continue;
    parentsOf.set(childId, parents);
    for (const parentId of parents) {
      if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
      childrenOf.get(parentId).push(childId);
    }
  }
}

// Año de nacimiento efectivo: real o estimado (para propagar la estimación)
const year = new Map();
for (const person of tree.individuals) {
  const y = effectiveYear(person);
  if (y != null) year.set(person.id, y);
}

// Propagar en ambos sentidos:
//   - hacia abajo (padres -> hijo): hijo = media(padres) + 30 años.
//   - hacia arriba (hijos -> padre): padre = media(hijos) - 30 años.
const average = (values) => values.reduce((sum, y) => sum + y, 0) / values.length;
let changed = true;
let guard = 0;
while (changed && guard < 200) {
  changed = false;
  guard += 1;
  for (const person of tree.individuals) {
    if (year.has(person.id)) continue;
    const parentYears = (parentsOf.get(person.id) || []).map((id) => year.get(id)).filter((y) => Number.isFinite(y));
    if (parentYears.length) {
      year.set(person.id, Math.round(average(parentYears)) + 30);
      changed = true;
      continue;
    }
    const childYears = (childrenOf.get(person.id) || []).map((id) => year.get(id)).filter((y) => Number.isFinite(y));
    if (childYears.length) {
      year.set(person.id, Math.round(average(childYears)) - 30);
      changed = true;
    }
  }
}

let estimated = 0;
for (const person of tree.individuals) {
  if (effectiveYear(person) != null) continue; // ya tiene fecha real
  const estimate = year.get(person.id);
  if (estimate == null) continue;
  person.birthYear = estimate;
  if (!person.birth) person.birth = { date: null, place: null };
  if (!person.birth.date) person.birth.date = `ABT ${estimate}`;
  estimated += 1;
}

tree.stats.knownBirthDates = tree.individuals.filter((person) => person.birth?.date).length;
tree.generatedAt = new Date().toISOString();

fs.writeFileSync(sourcePath, `${JSON.stringify(tree, null, 2)}\n`, 'utf8');
fs.writeFileSync(sitePath, `window.TREE_DATA = ${JSON.stringify(tree, null, 2)};\n`, 'utf8');
console.log(JSON.stringify({ estimated, knownBirthDates: tree.stats.knownBirthDates }));
