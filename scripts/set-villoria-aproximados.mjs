import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const byId = new Map(tree.individuals.map((person) => [person.id, person]));

// Años de nacimiento estimados (ABT) para mantener coherencia generacional.
const estimaciones = [
  ['@I500069@', 1935], // José Luis Iglesias Ballina (padre de Ana Isabel, ~25-30 años mayor)
  ['@I500070@', 1937], // Isabel María Carbajo Acebal (madre de Ana Isabel)
  ['@I500072@', 1930], // Natividad Ordóñez Fernández (madre de Luis Ángel, ~28 años mayor)
  ['@I500074@', 1958], // Juan Ignacio Villoria Ordóñez (hermano de Luis Ángel, de su edad)
  ['@I500076@', 1960], // Begoña Iglesias de la Puente (esposa de Juan Ignacio)
  ['@I500075@', 1997], // Carmen Villoria Iglesias (prima de María, algo más joven)
];

for (const [id, year] of estimaciones) {
  const person = byId.get(id);
  if (!person) continue;
  person.birth = { date: `ABT ${year}`, place: null };
  person.birthYear = year;
}

fs.writeFileSync(sourcePath, `${JSON.stringify(tree, null, 2)}\n`, 'utf8');
fs.writeFileSync(sitePath, `window.TREE_DATA = ${JSON.stringify(tree, null, 2)};\n`, 'utf8');
console.log(JSON.stringify(estimaciones));
