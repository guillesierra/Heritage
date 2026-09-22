import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const byId = new Map(tree.individuals.map((person) => [person.id, person]));
const nextId = (() => {
  let max = Math.max(...tree.individuals.map((p) => +p.id.replace(/\D/g, '')));
  return () => `@I${++max}@`;
})();
const nextFamilyId = (() => {
  let max = Math.max(...tree.families.map((f) => +f.id.replace(/\D/g, '')));
  return () => `@F${++max}@`;
})();

const SOURCE = 'Árbol administrado por Alicia Rodríguez.';
const person = (data) => ({
  occupations: [], notes: [], sourceRefs: [], media: [], localPhoto: null,
  familyChild: null, familySpouse: [], birth: null, death: null, birthYear: null, deathYear: null,
  living: false,
  ...data,
});
const N = (data) => {
  const id = nextId();
  const p = person({ id, ...data });
  tree.individuals.push(p);
  byId.set(id, p);
  return id;
};
const addFamily = (husbandId, wifeId, childrenIds) => {
  const fam = { id: nextFamilyId(), husband: husbandId, wife: wifeId, children: childrenIds, marriage: null, divorce: null };
  tree.families.push(fam);
  for (const cid of childrenIds) {
    const c = byId.get(cid);
    if (c && !c.familyChild) c.familyChild = fam.id;
  }
  if (husbandId) byId.get(husbandId)?.familySpouse.push(fam.id);
  if (wifeId) byId.get(wifeId)?.familySpouse.push(fam.id);
  return fam;
};

// ===== Refinamientos =====
const bernarda = byId.get('@I500165@');
bernnarda.name = 'Bernarda Fernández-Medal García del Pardo';
bernnarda.surname = 'Fernández-Medal García del Pardo';
const juanPico = byId.get('@I500172@');
juanPico.name = 'Juan Fernández-Pico Méndez';
juanPico.surname = 'Fernández-Pico Méndez';

// ===== Tíos del esposo (hermanos de Rosa Méndez-Trelles @I500151@) =====
const domingoTio = N({ name: 'Domingo Antonio Méndez-Trelles', given: 'Domingo Antonio', surname: 'Méndez-Trelles', sex: 'M', notes: [`Tío del esposo de Juana González Fernández. ${SOURCE}`] });
const mariaTia = N({ name: 'María Méndez-Trelles González-Trelles', given: 'María', surname: 'Méndez-Trelles González-Trelles', sex: 'F', notes: [`Tía del esposo de Juana González Fernández. ${SOURCE}`] });
const manuelaTia = N({ name: 'Manuela Méndez-Trelles González-Trelles', given: 'Manuela', surname: 'Méndez-Trelles González-Trelles', sex: 'F', notes: [`Tía del esposo de Juana González Fernández. ${SOURCE}`] });
const famRosaPadres = tree.families.find((f) => f.id === '@F500065@');
famRosaPadres.children.push(domingoTio, mariaTia, manuelaTia);
for (const id of [domingoTio, mariaTia, manuelaTia]) byId.get(id).familyChild = famRosaPadres.id;

// ===== Hermanos de la cuñada (Rosa María González Fernández @I500415@) =====
const luisaJosefa = N({ name: 'Luisa Josefa González Fernández', given: 'Luisa Josefa', surname: 'González Fernández', sex: 'F', notes: [`Hermana de la cuñada de Juana González Fernández. ${SOURCE}`] });
const luisAntonio = N({ name: 'Luis Antonio González González', given: 'Luis Antonio', surname: 'González González', sex: 'M', notes: [`Hermano de la cuñada de Juana González Fernández. ${SOURCE}`] });
const juanAlonso = N({ name: 'Juan Alonso González González', given: 'Juan Alonso', surname: 'González González', sex: 'M', notes: [`Hermano de la cuñada de Juana González Fernández. ${SOURCE}`] });
const domingoJose = N({ name: 'Domingo José González González', given: 'Domingo José', surname: 'González González', sex: 'M', notes: [`Hermano de la cuñada de Juana González Fernández. ${SOURCE}`] });
const famRosaMaria = tree.families.find((f) => f.id === '@F500069@');
famRosaMaria.children.push(luisaJosefa, luisAntonio, juanAlonso, domingoJose);
for (const id of [luisaJosefa, luisAntonio, juanAlonso, domingoJose]) byId.get(id).familyChild = famRosaMaria.id;

// ===== Nietos del cuñado (descendientes de Diego Antonio Sánchez de Ron) =====
const lavandera = N({ name: 'María Teresa Fernández-Lavandera y Rodríguez', given: 'María Teresa', surname: 'Fernández-Lavandera y Rodríguez', sex: 'F', notes: [`Nuera del cuñado de Juana González Fernández. ${SOURCE}`] });
const nietosLavandera = [
  ['Teresa', 'Sánchez de Ron Fernández-Lavandera', 'F'],
  ['Francisca', 'Sánchez de Ron', 'F'],
  ['Juana', 'Sánchez de Ron Fernández-Lavandera', 'F'],
  ['Romualda Antonia', 'Sánchez de Ron', 'F'],
  ['Benancia María Benita', 'Sánchez de Ron', 'F'],
  ['Juan Manuel Antonio', 'Sánchez de Ron', 'M'],
].map(([given, surname, sex]) => N({ name: `${given} ${surname}`, given, surname, sex, notes: [`Nieto/a del cuñado de Juana González Fernández. ${SOURCE}`] }));
const jardon = N({ name: 'Rosa Méndez-Jardón García-Piedra', given: 'Rosa', surname: 'Méndez-Jardón García-Piedra', sex: 'F', notes: [`Nuera del cuñado de Juana González Fernández. ${SOURCE}`] });
const domingoJardon = N({ name: 'Domingo Sánchez de Ron Méndez Jardón', given: 'Domingo', surname: 'Sánchez de Ron Méndez Jardón', sex: 'M', notes: [`Nieto del cuñado de Juana González Fernández. ${SOURCE}`] });

// Conectar como descendientes de Diego Antonio Sánchez de Ron Méndez-Trelles (@I500437@)
// vía sus hijos "Sánchez de Ron González": usamos un hijo intermedio no nombrado para los Lavandera
const diegoAntonio = '@I500437@';
const hijoIntermedio = N({ name: 'Nombre desconocido', given: null, surname: 'Sánchez de Ron', sex: 'M', notes: [`Hijo de Diego Antonio Sánchez de Ron Méndez-Trelles (nombre no conservado). ${SOURCE}`] });
addFamily(diegoAntonio, null, [hijoIntermedio]);
byId.get(hijoIntermedio).familyChild = tree.families[tree.families.length - 1].id;
const famLavandera = addFamily(hijoIntermedio, lavandera, nietosLavandera);
for (const id of nietosLavandera) byId.get(id).familyChild = famLavandera.id;
const famJardon = addFamily(hijoIntermedio, jardon, [domingoJardon]);
byId.get(domingoJardon).familyChild = famJardon.id;

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
