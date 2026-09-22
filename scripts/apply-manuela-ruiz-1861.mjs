import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const outputPath = path.join(root, 'dist', 'data.js');
const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const personById = new Map(tree.individuals.map((person) => [person.id, person]));
const familyById = new Map(tree.families.map((family) => [family.id, family]));
const person = (id) => {
  const value = personById.get(id);
  if (!value) throw new Error(`Falta la persona ${id}`);
  return value;
};
const family = (id) => {
  const value = familyById.get(id);
  if (!value) throw new Error(`Falta la familia ${id}`);
  return value;
};
const note = 'Fuente: Información aportada por el usuario el 22-09-2026; imagen de la partida pendiente de incorporar.';
const addNote = (target, value) => {
  target.notes ??= [];
  if (!target.notes.includes(value)) target.notes.push(value);
};
const addPerson = (id, name, given, surname, sex, place, familyChild, familySpouse) => {
  if (personById.has(id)) throw new Error(`ID ya existente: ${id}`);
  const value = {
    id, name, given, surname, sex,
    birth: place ? { date: null, place } : null,
    death: null, birthYear: null, deathYear: null, living: false,
    occupations: [], notes: [note], familyChild, familySpouse,
    sourceRefs: [], media: [], localPhoto: null
  };
  tree.individuals.push(value);
  personById.set(id, value);
};
const addFamily = (id, husband, wife, children) => {
  if (familyById.has(id)) throw new Error(`ID ya existente: ${id}`);
  const value = { id, husband, wife, children, marriage: null, divorce: null };
  tree.families.push(value);
  familyById.set(id, value);
};

const manuela = person('@I500130@');
const lucia = person('@I500145@');
const gregorio = person('@I500174@');
const manuelaParents = family('@F500061@');
const luciaParents = family('@F500076@');
if (manuelaParents.husband !== null || manuelaParents.wife !== lucia.id || luciaParents.husband !== gregorio.id) {
  throw new Error('La estructura previa de la rama no coincide con la esperada.');
}

manuela.birth = { date: '25 DEC 1861', place: 'San Cristóbal del Monte, Cantabria, España' };
manuela.birthYear = 1861;
addNote(manuela, note);
addNote(manuela, 'Corrección: el año 1860 que figuraba anteriormente en el árbol fue sustituido por el nacimiento del 25-12-1861 aportado por el usuario.');

lucia.name = 'Lucía Gutiérrez';
lucia.surname = 'Gutiérrez';
addNote(lucia, note);
addNote(lucia, 'El segundo apellido Estébanez y el vínculo anterior con Gregorio Estébanez quedan sin respaldo en la nueva información familiar.');

manuelaParents.husband = '@I500599@';
luciaParents.husband = '@I500602@';
luciaParents.wife = '@I500603@';
gregorio.familySpouse = (gregorio.familySpouse || []).filter((id) => id !== luciaParents.id);
addNote(gregorio, 'La atribución anterior como padre de Lucía Gutiérrez fue desplazada por los datos aportados por el usuario el 22-09-2026; identidad histórica pendiente de revisión.');

addPerson('@I500599@', 'Juan Ruiz', 'Juan', 'Ruiz', 'M', 'Villanueva de Henares, Castilla y León, España', '@F500193@', ['@F500061@']);
addPerson('@I500600@', 'Juan Ruiz', 'Juan', 'Ruiz', 'M', 'Villanueva de Henares, Castilla y León, España', null, ['@F500193@']);
addPerson('@I500601@', 'Teresa Lauderas', 'Teresa', 'Lauderas', 'F', 'San Martín de Hoyos, Cantabria, España', null, ['@F500193@']);
addPerson('@I500602@', 'Dionisio Gutiérrez', 'Dionisio', 'Gutiérrez', 'M', 'San Cristóbal del Monte, Cantabria, España', null, ['@F500076@']);
addPerson('@I500603@', 'Teresa García', 'Teresa', 'García', 'F', 'Moroso, Cantabria, España', null, ['@F500076@']);
addFamily('@F500193@', '@I500600@', '@I500601@', ['@I500599@']);
for (const finding of tree.findings || []) {
  if (finding.message === 'Falta la fecha de nacimiento de Lucía Gutiérrez Estébanez') {
    finding.message = 'Falta la fecha de nacimiento de Lucía Gutiérrez';
  }
}

tree.stats.individuals = tree.individuals.length;
tree.stats.families = tree.families.length;
tree.generatedAt = new Date().toISOString();
fs.writeFileSync(sourcePath, `${JSON.stringify(tree, null, 2)}\n`);
fs.writeFileSync(outputPath, `window.TREE_DATA = ${JSON.stringify(tree, null, 2)};\n`);
