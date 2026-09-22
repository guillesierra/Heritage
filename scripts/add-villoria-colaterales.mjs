import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
let byId = new Map(tree.individuals.map((person) => [person.id, person]));
let idCounter = Math.max(...tree.individuals.map((p) => +p.id.replace(/\D/g, '')));
let famCounter = Math.max(...tree.families.map((f) => +f.id.replace(/\D/g, '')));
const newId = () => `@I${++idCounter}@`;
const newFam = () => `@F${++famCounter}@`;

const person = (data) => ({ occupations: [], notes: [], sourceRefs: [], media: [], localPhoto: null, familyChild: null, familySpouse: [], ...data });

// Apodo de Isabel María Carbajo Acebal
byId.get('@I500070@').notes = ['Apodada «Pitusa».'];

// Nuevas personas
const franciscoJavier = person({ id: newId(), name: 'Francisco Javier Carbajo Acebal', given: 'Francisco Javier', surname: 'Carbajo Acebal', sex: 'M', birth: null, death: { date: '9 JUL 2020', place: 'Vigo, Galicia, España' }, birthYear: null, deathYear: 2020, living: false, notes: ['Hermano de Isabel María Carbajo Acebal.'] });
const covadonga = person({ id: newId(), name: 'Covadonga Carbajo', given: 'Covadonga', surname: 'Carbajo', sex: 'F', birth: null, death: null, birthYear: null, deathYear: null, living: true, notes: ['Hija de Francisco Javier Carbajo Acebal.'] });
const ignacio = person({ id: newId(), name: 'Ignacio Carbajo Acebal', given: 'Ignacio', surname: 'Carbajo Acebal', sex: 'M', birth: null, death: { date: '29 AUG 2014', place: 'Oviedo, Principado de Asturias, España' }, birthYear: null, deathYear: 2014, living: false, notes: ['Hermano de Isabel María Carbajo Acebal.'] });
const mariaLuisa = person({ id: newId(), name: 'María Luisa Ordóñez Fernández', given: 'María Luisa', surname: 'Ordóñez Fernández', sex: 'F', birth: null, death: null, birthYear: null, deathYear: null, living: true, notes: ['Hermana de Natividad Ordóñez Fernández.'] });
const manuel = person({ id: newId(), name: 'Manuel Ordóñez Fernández', given: 'Manuel', surname: 'Ordóñez Fernández', sex: 'M', birth: null, death: null, birthYear: null, deathYear: null, living: true, notes: ['Hermano de Natividad; Director General de la Cuenca del Caudal (HUNOSA).'] });
const mariaTeresa = person({ id: newId(), name: 'María Teresa Ordóñez Fernández', given: 'María Teresa', surname: 'Ordóñez Fernández', sex: 'F', birth: null, death: null, birthYear: null, deathYear: null, living: true, notes: ['Hermana de Natividad Ordóñez Fernández.'] });
const mariaIsabel = person({ id: newId(), name: 'María Isabel Ordóñez Fernández', given: 'María Isabel', surname: 'Ordóñez Fernández', sex: 'F', birth: null, death: null, birthYear: null, deathYear: null, living: true, notes: ['Hermana de Natividad Ordóñez Fernández.'] });
const amador = person({ id: newId(), name: 'Amador Villoria Díaz', given: 'Amador', surname: 'Villoria Díaz', sex: 'M', birth: null, death: null, birthYear: null, deathYear: null, living: true, notes: ['Hijo de una hermana de Natividad Ordóñez Fernández.'] });
const mariaAngeles = person({ id: newId(), name: 'María de los Ángeles Iglesias Ballina', given: 'María de los Ángeles', surname: 'Iglesias Ballina', sex: 'F', birth: null, death: null, birthYear: null, deathYear: null, living: true, notes: ['Hermana de José Luis Iglesias Ballina.'] });

tree.individuals.push(franciscoJavier, covadonga, ignacio, mariaLuisa, manuel, mariaTeresa, mariaIsabel, amador, mariaAngeles);
byId = new Map(tree.individuals.map((person) => [person.id, person]));

// Familia Carbajo Acebal (hermanos de Isabel María)
const famCarbajo = { id: newFam(), husband: null, wife: null, children: ['@I500070@', franciscoJavier.id, ignacio.id], marriage: null, divorce: null };
tree.families.push(famCarbajo);
for (const id of famCarbajo.children) byId.get(id).familyChild = famCarbajo.id;

// Covadonga, hija de Francisco Javier
const famCovadonga = { id: newFam(), husband: franciscoJavier.id, wife: null, children: [covadonga.id], marriage: null, divorce: null };
tree.families.push(famCovadonga);
covadonga.familyChild = famCovadonga.id;
franciscoJavier.familySpouse.push(famCovadonga.id);

// Familia Ordóñez Fernández (hermanos de Natividad)
const famOrdonez = { id: newFam(), husband: null, wife: null, children: ['@I500072@', mariaLuisa.id, manuel.id, mariaTeresa.id, mariaIsabel.id], marriage: null, divorce: null };
tree.families.push(famOrdonez);
for (const id of famOrdonez.children) byId.get(id).familyChild = famOrdonez.id;

// María de los Ángeles, hermana de José Luis y Miguel Ángel (familia existente @F500126@)
const famIglesias = tree.families.find((f) => f.id === '@F500126@');
famIglesias.children.push(mariaAngeles.id);
mariaAngeles.familyChild = famIglesias.id;

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
console.log(JSON.stringify({ added: 9, stats: tree.stats }));
