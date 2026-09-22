import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const byId = new Map(tree.individuals.map((person) => [person.id, person]));

const maxId = Math.max(...tree.individuals.map((p) => +p.id.replace(/\D/g, '')));
const miguelId = `@I${maxId + 1}@`;
const maxF = Math.max(...tree.families.map((f) => +f.id.replace(/\D/g, '')));
const familiaId = `@F${maxF + 1}@`;

tree.individuals.push({
  id: miguelId,
  name: 'Miguel Ángel Iglesias Ballina',
  given: 'Miguel Ángel',
  surname: 'Iglesias Ballina',
  sex: 'M',
  birth: { date: '28 JUL 1951', place: 'Vigo, Galicia, España' },
  death: { date: '6 NOV 2012', place: 'Oviedo, Principado de Asturias, España' },
  birthYear: 1951,
  deathYear: 2012,
  living: false,
  occupations: [],
  notes: ['Histórico dirigente de CCOO; viuda Mari Sol González Robles.'],
  familyChild: familiaId,
  familySpouse: [],
  sourceRefs: [],
  media: [],
  localPhoto: null,
});

// Familia de origen con padres desconocidos para enlazar a José Luis y Miguel Ángel como hermanos
tree.families.push({ id: familiaId, husband: null, wife: null, children: ['@I500069@', miguelId], marriage: null, divorce: null });
byId.get('@I500069@').familyChild = familiaId;

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

fs.writeFileSync(sourcePath, `${JSON.stringify(tree, null, 2)}\n`, 'utf8');
fs.writeFileSync(sitePath, `window.TREE_DATA = ${JSON.stringify(tree, null, 2)};\n`, 'utf8');
console.log(JSON.stringify({ miguelId, familiaId }));
