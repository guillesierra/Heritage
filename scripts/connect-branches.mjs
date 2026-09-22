import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
let byId = new Map(tree.individuals.map((person) => [person.id, person]));
const nextId = (() => {
  let max = Math.max(...tree.individuals.map((p) => +p.id.replace(/\D/g, '')));
  return () => `@I${++max}@`;
})();
const nextFamilyId = (() => {
  let max = Math.max(...tree.families.map((f) => +f.id.replace(/\D/g, '')));
  return () => `@F${++max}@`;
})();

const addNote = (id, note) => {
  const person = byId.get(id);
  if (!person) return;
  person.notes ??= [];
  if (!person.notes.includes(note)) person.notes.push(note);
};

const placeholderParent = (familyId, surnameHint) => {
  const id = nextId();
  const person = {
    id,
    name: 'Nombre desconocido',
    given: null,
    surname: null,
    sex: 'U',
    birth: null,
    death: null,
    birthYear: null,
    deathYear: null,
    living: false,
    occupations: [],
    notes: [`Progenitor desconocido; agrupa a los hermanos ${surnameHint}.`],
    familyChild: null,
    familySpouse: [familyId],
    sourceRefs: [],
    media: [],
    localPhoto: null,
  };
  tree.individuals.push(person);
  return id;
};

// 1) Los "hermanos" que comparten familia con padres desconocidos no se
//    enlazan entre sí en el grafo (padres null). Se añade un progenitor
//    desconocido para que queden conectados como grupo de hermanos.
const siblingFamilies = [
  { id: '@F500125@', surname: 'Villoria Díaz' },
  { id: '@F500126@', surname: 'Iglesias Ballina' },
  { id: '@F500127@', surname: 'Carbajo Acebal' },
  { id: '@F500129@', surname: 'Ordóñez Fernández' },
];
for (const { id, surname } of siblingFamilies) {
  const family = tree.families.find((f) => f.id === id);
  if (!family || family.husband) continue;
  family.husband = placeholderParent(id, surname);
}

// 2) Puente Trelles/Coaña -> tronco principal. Leonor Suárez Trelles y
//    Villamil (dote de 1671, esposa de Alonso García-Infanzón) se enlaza como
//    hija de Lope Suárez de Trelles Coaña y Villamil (n. 1612), por coincidencia
//    de apellido «Suárez Trelles y Villamil» y cronología. Hipótesis no probada.
const leonor = byId.get('@I500202@');
const lope = byId.get('@I500214@');
if (leonor && lope && !leonor.familyChild) {
  const bridge = {
    id: nextFamilyId(),
    husband: '@I500214@',
    wife: null,
    children: ['@I500202@'],
    marriage: null,
    divorce: null,
  };
  tree.families.push(bridge);
  leonor.familyChild = bridge.id;
  lope.familySpouse.push(bridge.id);
  addNote('@I500202@', 'Conexión propuesta (hipótesis): hija de Lope Suárez de Trelles Coaña y Villamil por coincidencia de apellido «Suárez Trelles y Villamil» y cronología (dote de 1671).');
  addNote('@I500214@', 'Conexión propuesta (hipótesis): padre de Leonor Suárez Trelles y Villamil (dote de 1671).');
}

// 3) Diego Rodríguez de Trelles: «Hermano de Lope Méndez» (padrón de 1524).
//    Se enlaza como hermano de Lope Méndez de Trelles, hijo de Fernán López.
const diego = byId.get('@I500234@');
if (diego && !diego.familyChild) {
  const family = tree.families.find((f) => f.id === '@F500090@');
  if (family) {
    family.children.push('@I500234@');
    diego.familyChild = family.id;
    addNote('@I500234@', 'Conexión propuesta (hipótesis): hermano de Lope Méndez de Trelles, hijo de Fernán López de Trelles.');
  }
}

// 4) Amador Villoria Díaz: «Hijo de una hermana de Natividad Ordóñez Fernández».
//    Se enlaza a través de una madre desconocida (hermana de Natividad) que se
//    añade al grupo de hermanos Ordóñez Fernández.
const amador = byId.get('@I500329@');
if (amador && !amador.familyChild) {
  const ordonezFamily = tree.families.find((f) => f.id === '@F500129@');
  if (ordonezFamily) {
    const motherId = nextId();
    tree.individuals.push({
      id: motherId,
      name: 'Nombre desconocido',
      given: null,
      surname: 'Ordóñez Fernández',
      sex: 'F',
      birth: null,
      death: null,
      birthYear: null,
      deathYear: null,
      living: false,
      occupations: [],
      notes: ['Hermana de Natividad Ordóñez Fernández; madre de Amador Villoria Díaz (no localizada con precisión).'],
      familyChild: '@F500129@',
      familySpouse: [],
      sourceRefs: [],
      media: [],
      localPhoto: null,
    });
    const amadorFamily = {
      id: nextFamilyId(),
      husband: null,
      wife: motherId,
      children: ['@I500329@'],
      marriage: null,
      divorce: null,
    };
    tree.families.push(amadorFamily);
    ordonezFamily.children.push(motherId);
    amador.familyChild = amadorFamily.id;
    tree.individuals[tree.individuals.length - 1].familySpouse.push(amadorFamily.id);
  }
}

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
