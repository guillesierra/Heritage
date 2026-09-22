import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const byId = new Map(tree.individuals.map((person) => [person.id, person]));

// Víctor Villoria Díaz: nacimiento ~1928 y defunción 22/09/2017 en Oviedo
const victor = byId.get('@I500073@');
victor.birth = { date: 'ABT 1928', place: null };
victor.birthYear = 1928;
victor.death = { date: '22 SEP 2017', place: 'Oviedo, Principado de Asturias, España' };
victor.deathYear = 2017;
victor.notes = ['Falleció a los 88 años; entierro en el cementerio de Moreda de Aller. Hermano: Faustino Villoria Díaz (†).'];

// José Luis Iglesias Ballina: fallecido antes de 23/12/2024; fundador de PRONOR
const joseLuisB = byId.get('@I500069@');
joseLuisB.death = { date: 'BEF 23 DEC 2024', place: null };
joseLuisB.notes = ['Fundador de PRONOR; administrador solidario de Obras y Reparaciones Andrín SL (Llanes) hasta 31/10/2006.'];

// Begoña Iglesias de la Puente: sustituye al "Nombre desconocido" (esposa de Juan Ignacio)
const begona = byId.get('@I500076@');
begona.name = 'Begoña Iglesias de la Puente';
begona.given = 'Begoña';
begona.surname = 'Iglesias de la Puente';
begona.notes = ['Esposa de Juan Ignacio Villoria Ordóñez.'];

// Faustino Villoria Díaz: nuevo, hermano de Víctor († antes de 2017)
const maxId = Math.max(...tree.individuals.map((p) => +p.id.replace(/\D/g, '')));
const faustinoId = `@I${maxId + 1}@`;
tree.individuals.push({
  id: faustinoId,
  name: 'Faustino Villoria Díaz',
  given: 'Faustino',
  surname: 'Villoria Díaz',
  sex: 'M',
  birth: null,
  death: { date: 'BEF 2017', place: null },
  birthYear: null,
  deathYear: null,
  living: false,
  occupations: [],
  notes: ['Hermano de Víctor Villoria Díaz; ya fallecido en septiembre de 2017.'],
  familyChild: null,
  familySpouse: [],
  sourceRefs: [],
  media: [],
  localPhoto: null,
});

// Familia con padres desconocidos para enlazar a Víctor y Faustino como hermanos
const maxF = Math.max(...tree.families.map((f) => +f.id.replace(/\D/g, '')));
const familiaHermanos = { id: `@F${maxF + 1}@`, husband: null, wife: null, children: ['@I500073@', faustinoId], marriage: null, divorce: null };
tree.families.push(familiaHermanos);
victor.familyChild = familiaHermanos.id;
tree.individuals[tree.individuals.length - 1].familyChild = familiaHermanos.id;

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
console.log(JSON.stringify({ faustinoId, stats: tree.stats }));
