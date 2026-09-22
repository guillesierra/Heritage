import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const byId = new Map(tree.individuals.map((p) => [p.id, p]));

const SOURCE = 'Árbol administrado por Óscar Á.G.';

// 1) Restaurar a "Diego Antonio Sánchez de Ron Méndez-Trelles" (@I500437@)
tree.individuals.push({
  id: '@I500437@',
  name: 'Diego Antonio Sánchez de Ron Méndez-Trelles',
  given: 'Diego Antonio',
  surname: 'Sánchez de Ron Méndez-Trelles',
  sex: 'M',
  birth: null, death: null, birthYear: null, deathYear: null, living: false,
  occupations: [], notes: [`Nieto de Felipa Rodríguez Casariego; hijo de José Francisco Sánchez de Ron. ${SOURCE}`],
  familyChild: '@F500063@', familySpouse: ['@F500149@'],
  sourceRefs: [], media: [], localPhoto: null,
});
byId.set('@I500437@', tree.individuals[tree.individuals.length - 1]);

// Añadirlo a la familia de José Francisco + Rosa
const famJosFco = tree.families.find((f) => f.id === '@F500063@');
if (!famJosFco.children.includes('@I500437@')) famJosFco.children.push('@I500437@');

// 2) Restaurar la familia "Diego Antonio + Rosa María" (@F500149@)
tree.families.push({
  id: '@F500149@',
  husband: '@I500437@',
  wife: '@I500415@',
  children: ['@I500441@', '@I500442@', '@I500443@'],
  marriage: null, divorce: null,
});

// 3) Sacar Pelayo/Miguel/Diego de la familia de Manuel José Antonio + Juana
const famManuelJuana = tree.families.find((f) => f.id === '@F500014@');
famManuelJuana.children = famManuelJuana.children.filter((c) => !['@I500441@', '@I500442@', '@I500443@'].includes(c));

// 4) Restaurar familyChild y notas de Pelayo/Miguel/Diego
for (const id of ['@I500441@', '@I500442@', '@I500443@']) {
  const p = byId.get(id);
  p.familyChild = '@F500149@';
  p.notes = [`Bisnieto de Felipa Rodríguez Casariego. ${SOURCE}`];
}

// 5) Restaurar Rosa María (@I500415@)
const rosaMaria = byId.get('@I500415@');
rosaMaria.familySpouse = ['@F500149@'];
rosaMaria.notes = [
  'Hija de Joseph Antonio González Fernández-Medal y Ana María. Árbol administrado por M. Amor Sánchez de Ron.',
  `Esposa de Diego Antonio Sánchez de Ron Méndez-Trelles (nieto de Felipa Rodríguez Casariego). ${SOURCE}`,
];

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
