import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const byId = new Map(tree.individuals.map((p) => [p.id, p]));

// Revertir: Covadonga Iglesias Carbajo -> Covadonga Carbajo (hija de Francisco Javier Carbajo Acebal)
const covadonga = byId.get('@I500323@');
covadonga.name = 'Covadonga Carbajo';
covadonga.given = 'Covadonga';
covadonga.surname = 'Carbajo';
covadonga.notes = ['Hija de Francisco Javier Carbajo Acebal.'];

// Recrear la familia que la unía a Francisco Javier Carbajo Acebal
tree.families.push({
  id: '@F500128@',
  husband: '@I500322@',
  wife: null,
  children: ['@I500323@'],
  marriage: null,
  divorce: null,
});
covadonga.familyChild = '@F500128@';
const franciscoJavier = byId.get('@I500322@');
if (!(franciscoJavier.familySpouse || []).includes('@F500128@')) franciscoJavier.familySpouse.push('@F500128@');

tree.stats.families = tree.families.length;
tree.stats.knownBirthDates = tree.individuals.filter((p) => p.birth?.date).length;
tree.generatedAt = new Date().toISOString();

fs.writeFileSync(sourcePath, `${JSON.stringify(tree, null, 2)}\n`, 'utf8');
fs.writeFileSync(sitePath, `window.TREE_DATA = ${JSON.stringify(tree, null, 2)};\n`, 'utf8');
console.log(JSON.stringify({ name: covadonga.name, individuals: tree.stats.individuals, families: tree.stats.families }));
