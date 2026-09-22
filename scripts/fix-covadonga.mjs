import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const byId = new Map(tree.individuals.map((p) => [p.id, p]));

// Covadonga Carbajo -> Covadonga Iglesias Carbajo, y quitar la relación con
// Francisco Javier Carbajo Acebal (no tiene relación con Ana Isabel Iglesias Carbajo).
const covadonga = byId.get('@I500323@');
covadonga.name = 'Covadonga Iglesias Carbajo';
covadonga.given = 'Covadonga';
covadonga.surname = 'Iglesias Carbajo';
covadonga.notes = (covadonga.notes || []).filter((n) => !n.includes('Francisco Javier Carbajo'));
covadonga.familyChild = null;

// Quitar la familia que la unía a Francisco Javier Carbajo Acebal (@F500128@)
tree.families = tree.families.filter((f) => f.id !== '@F500128@');
const franciscoJavier = byId.get('@I500322@');
franciscoJavier.familySpouse = (franciscoJavier.familySpouse || []).filter((f) => f !== '@F500128@');

tree.stats.families = tree.families.length;
tree.stats.knownBirthDates = tree.individuals.filter((p) => p.birth?.date).length;
tree.generatedAt = new Date().toISOString();

fs.writeFileSync(sourcePath, `${JSON.stringify(tree, null, 2)}\n`, 'utf8');
fs.writeFileSync(sitePath, `window.TREE_DATA = ${JSON.stringify(tree, null, 2)};\n`, 'utf8');
console.log(JSON.stringify({ name: covadonga.name, individuals: tree.stats.individuals, families: tree.stats.families }));
