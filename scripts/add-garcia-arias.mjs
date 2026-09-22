import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

if (tree.individuals.some((person) => person.id === '@I500178@')) {
  throw new Error('La rama García Arias ya está añadida (existe @I500178@).');
}

const person = (data) => ({
  occupations: [],
  notes: [],
  sourceRefs: [],
  media: [],
  localPhoto: null,
  ...data,
});

const newIndividuals = [
  person({ id: '@I500178@', name: 'Sr. García', given: 'Sr.', surname: 'García', sex: 'M', birth: null, death: null, birthYear: null, deathYear: null, living: true, familyChild: null, familySpouse: ['@F500079@'] }),
  person({ id: '@I500179@', name: 'Sra. Arias', given: 'Sra.', surname: 'Arias', sex: 'F', birth: null, death: null, birthYear: null, deathYear: null, living: true, familyChild: null, familySpouse: ['@F500079@'] }),
  person({ id: '@I500180@', name: 'José Luis García Arias', given: 'José Luis', surname: 'García Arias', sex: 'M', birth: { date: '1940/1941', place: null }, death: { date: '2026', place: 'Avilés, Principado de Asturias, España' }, birthYear: 1940, deathYear: 2026, living: false, familyChild: '@F500079@', familySpouse: ['@F500080@'] }),
  person({ id: '@I500181@', name: 'Roberto "Pichi" García Arias', given: 'Roberto "Pichi"', surname: 'García Arias', sex: 'M', birth: { date: '1942/1943', place: null }, death: { date: '2023', place: 'Avilés, Principado de Asturias, España' }, birthYear: 1942, deathYear: 2023, living: false, familyChild: '@F500079@', familySpouse: [] }),
  person({ id: '@I500182@', name: 'Mariceli García Arias', given: 'Mariceli', surname: 'García Arias', sex: 'F', birth: null, death: null, birthYear: null, deathYear: null, living: true, familyChild: '@F500079@', familySpouse: [] }),
  person({ id: '@I500183@', name: 'Pili García Arias', given: 'Pili', surname: 'García Arias', sex: 'F', birth: null, death: null, birthYear: null, deathYear: null, living: true, familyChild: '@F500079@', familySpouse: [] }),
  person({ id: '@I500184@', name: 'Mari Carmen García Arias', given: 'Mari Carmen', surname: 'García Arias', sex: 'F', birth: null, death: null, birthYear: null, deathYear: null, living: true, familyChild: '@F500079@', familySpouse: [] }),
  person({ id: '@I500185@', name: 'Margot García Arias', given: 'Margot', surname: 'García Arias', sex: 'F', birth: null, death: null, birthYear: null, deathYear: null, living: true, familyChild: '@F500079@', familySpouse: [] }),
  person({ id: '@I500186@', name: 'Rosi García Arias', given: 'Rosi', surname: 'García Arias', sex: 'F', birth: null, death: null, birthYear: null, deathYear: null, living: true, familyChild: '@F500079@', familySpouse: [] }),
  person({ id: '@I500187@', name: 'Isabel Becerril Santos', given: 'Isabel', surname: 'Becerril Santos', sex: 'F', birth: null, death: null, birthYear: null, deathYear: null, living: true, familyChild: null, familySpouse: ['@F500080@'] }),
  person({ id: '@I500188@', name: 'Daniel García Becerril', given: 'Daniel', surname: 'García Becerril', sex: 'M', birth: null, death: null, birthYear: null, deathYear: null, living: true, familyChild: '@F500080@', familySpouse: [] }),
  person({ id: '@I500189@', name: 'Luis Miguel García Becerril', given: 'Luis Miguel', surname: 'García Becerril', sex: 'M', birth: null, death: null, birthYear: null, deathYear: null, living: true, familyChild: '@F500080@', familySpouse: ['@F500081@'] }),
  person({ id: '@I500190@', name: 'María', given: 'María', surname: null, sex: 'F', birth: null, death: null, birthYear: null, deathYear: null, living: true, notes: ['Esposa de Luis Miguel García Becerril; apellidos no localizados.'], familyChild: null, familySpouse: ['@F500081@'] }),
  person({ id: '@I500191@', name: 'Eugenia', given: 'Eugenia', surname: null, sex: 'F', birth: null, death: null, birthYear: null, deathYear: null, living: true, notes: ['Hija de Luis Miguel García Becerril.'], familyChild: '@F500081@', familySpouse: [] }),
  person({ id: '@I500192@', name: 'Miguel', given: 'Miguel', surname: null, sex: 'M', birth: null, death: null, birthYear: null, deathYear: null, living: true, notes: ['Hijo de Luis Miguel García Becerril.'], familyChild: '@F500081@', familySpouse: [] }),
];

const newFamilies = [
  { id: '@F500079@', husband: '@I500178@', wife: '@I500179@', children: ['@I500180@', '@I500181@', '@I500182@', '@I500183@', '@I500184@', '@I500185@', '@I500186@'], marriage: null, divorce: null },
  { id: '@F500080@', husband: '@I500180@', wife: '@I500187@', children: ['@I500188@', '@I500012@', '@I500189@'], marriage: null, divorce: null },
  { id: '@F500081@', husband: '@I500189@', wife: '@I500190@', children: ['@I500191@', '@I500192@'], marriage: null, divorce: null },
];

const elena = tree.individuals.find((item) => item.id === '@I500012@');
if (!elena) throw new Error('No se encontró @I500012@.');
elena.name = 'María Elena García Becerril';
elena.given = 'María Elena';
elena.surname = 'García Becerril';
elena.familyChild = '@F500080@';

tree.individuals.push(...newIndividuals);
tree.families.push(...newFamilies);

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
console.log(JSON.stringify({ addedIndividuals: newIndividuals.length, addedFamilies: newFamilies.length, stats: tree.stats }));
