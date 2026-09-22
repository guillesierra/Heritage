import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const byId = new Map(tree.individuals.map((person) => [person.id, person]));

const ambrosio = byId.get('@I500049@');
ambrosio.death = null;
ambrosio.deathYear = null;
ambrosio.living = true;
ambrosio.notes = ['Defunción 09/05/1995 descartada: documentado vivo en Oviedo hasta 01/12/2006 (NIF 07716913E).'];

const porrata = byId.get('@I500113@');
porrata.name = 'Juan Manuel "Porrata" Martín Maíllo';
porrata.given = 'Juan Manuel "Porrata"';
porrata.birth = { date: '1887', place: 'Mogarraz, Castilla y León, España' };
porrata.birthYear = 1887;

const person = (data) => ({ occupations: [], notes: [], sourceRefs: [], media: [], localPhoto: null, ...data });

const newPeople = [
  person({ id: '@I500193@', name: 'Antonia Esperanza Maillo Martín', given: 'Antonia Esperanza', surname: 'Maillo Martín', sex: 'F', birth: { date: '18 DEC 1927', place: null }, death: { date: '1 JUL 1928', place: null }, birthYear: 1927, deathYear: 1928, living: false, familyChild: '@F500025@', familySpouse: [] }),
  person({ id: '@I500194@', name: 'Sabina Maillo Martín', given: 'Sabina', surname: 'Maillo Martín', sex: 'F', birth: { date: '18 AUG 1929', place: null }, death: { date: '19 OCT 1930', place: null }, birthYear: 1929, deathYear: 1930, living: false, familyChild: '@F500025@', familySpouse: [] }),
  person({ id: '@I500195@', name: 'Luciano Sierra Martínez', given: 'Luciano', surname: 'Sierra Martínez', sex: 'M', birth: null, death: null, birthYear: null, deathYear: null, living: true, familyChild: '@F500041@', familySpouse: [] }),
  person({ id: '@I500196@', name: 'María I. Sierra Martínez', given: 'María I.', surname: 'Sierra Martínez', sex: 'F', birth: null, death: null, birthYear: null, deathYear: null, living: true, familyChild: '@F500041@', familySpouse: [] }),
  person({ id: '@I500197@', name: 'Juliana Sierra Martínez', given: 'Juliana', surname: 'Sierra Martínez', sex: 'F', birth: null, death: null, birthYear: null, deathYear: null, living: true, familyChild: '@F500041@', familySpouse: [] }),
  person({ id: '@I500198@', name: 'Lola Sierra Martínez', given: 'Lola', surname: 'Sierra Martínez', sex: 'F', birth: null, death: null, birthYear: null, deathYear: null, living: true, familyChild: '@F500041@', familySpouse: [] }),
  person({ id: '@I500199@', name: 'Herminio Sierra Martínez', given: 'Herminio', surname: 'Sierra Martínez', sex: 'M', birth: null, death: null, birthYear: null, deathYear: null, living: true, familyChild: '@F500041@', familySpouse: [] }),
  person({ id: '@I500200@', name: 'Modesto Sierra Martínez', given: 'Modesto', surname: 'Sierra Martínez', sex: 'M', birth: null, death: null, birthYear: null, deathYear: null, living: true, familyChild: '@F500041@', familySpouse: [] }),
  person({ id: '@I500201@', name: 'Rosita Sierra Martínez', given: 'Rosita', surname: 'Sierra Martínez', sex: 'F', birth: null, death: null, birthYear: null, deathYear: null, living: true, familyChild: '@F500041@', familySpouse: [] }),
];

tree.individuals.push(...newPeople);

const family25 = tree.families.find((family) => family.id === '@F500025@');
family25.children = ['@I500193@', '@I500194@', ...family25.children];

const family41 = tree.families.find((family) => family.id === '@F500041@');
family41.children = [...family41.children, '@I500195@', '@I500196@', '@I500197@', '@I500198@', '@I500199@', '@I500200@', '@I500201@'];

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
console.log(JSON.stringify({ added: newPeople.length, stats: tree.stats }));
