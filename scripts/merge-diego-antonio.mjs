import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const byId = new Map(tree.individuals.map((p) => [p.id, p]));

// 1) Fusionar "Diego Antonio Sánchez de Ron Méndez-Trelles" (@I500437@) con
//    "Manuel José Antonio Sánchez de Ron Méndez-Trelles" (@I500039@): variante de nombre.
const manuel = byId.get('@I500039@');
manuel.notes ??= [];
if (!manuel.notes.some((n) => n.includes('Diego Antonio'))) {
  manuel.notes.push('También citado como «Diego Antonio Sánchez de Ron Méndez-Trelles».');
}

// Quitar @I500437@ del árbol y de la familia de José Francisco + Rosa
tree.individuals = tree.individuals.filter((p) => p.id !== '@I500437@');
const famJosFco = tree.families.find((f) => f.id === '@F500063@');
famJosFco.children = famJosFco.children.filter((c) => c !== '@I500437@');

// 2) Eliminar la familia "Diego Antonio + Rosa María" (@F500149@) y mover
//    Pelayo, Miguel, Diego Sánchez de Ron González a Manuel José Antonio + Juana (@F500014@).
const famDiegoRosa = tree.families.find((f) => f.id === '@F500149@');
const hijosMovidos = famDiegoRosa.children;
tree.families = tree.families.filter((f) => f.id !== '@F500149@');

const famManuelJuana = tree.families.find((f) => f.id === '@F500014@');
for (const cid of hijosMovidos) {
  famManuelJuana.children.push(cid);
  byId.get(cid).familyChild = '@F500014@';
  byId.get(cid).notes = (byId.get(cid).notes || []).filter((n) => !n.includes('Bisnieto de Felipa'));
  byId.get(cid).notes.push('Bisnieto de Felipa Rodríguez Casariego; hijo de Manuel José Antonio Sánchez de Ron Méndez-Trelles y Juana.');
}

// Quitar F500149 del familySpouse de Rosa María (@I500415@) y su nota
const rosaMaria = byId.get('@I500415@');
rosaMaria.familySpouse = (rosaMaria.familySpouse || []).filter((f) => f !== '@F500149@');
rosaMaria.notes = (rosaMaria.notes || []).filter((n) => !n.includes('Esposa de Diego Antonio Sánchez de Ron Méndez-Trelles'));

tree.stats = {
  individuals: tree.individuals.length,
  families: tree.families.length,
  photos: tree.individuals.reduce((sum, item) => sum + item.media.length, 0),
  peopleWithPhotos: tree.individuals.filter((item) => item.media.length).length,
  knownBirthDates: tree.individuals.filter((item) => item.birth?.date).length,
  knownDeathDates: tree.individuals.filter((item) => item.death?.date).length,
  livingEstimate: tree.individuals.filter((item) => item.living).length,
  sourceLinkedPeople: tree.individuals.filter((item) => item.sourceRefs.length).length,
};
tree.generatedAt = new Date().toISOString();

fs.writeFileSync(sourcePath, `${JSON.stringify(tree, null, 2)}\n`, 'utf8');
fs.writeFileSync(sitePath, `window.TREE_DATA = ${JSON.stringify(tree, null, 2)};\n`, 'utf8');
console.log(JSON.stringify({ individuals: tree.stats.individuals, families: tree.stats.families }));
