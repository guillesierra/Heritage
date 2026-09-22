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

const SOURCE = 'Árbol administrado por J. Jardon.';
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

// ===== 1) Nota en María de la Caridad =====
byId.get('@I500015@').notes = [...(byId.get('@I500015@').notes || []), `Según ${SOURCE}, nacida el 11/01/1907 en Cabanella (Navia); en el GED consta 12/01/1907 en Talarén.`];

// ===== 2) Hermanos de María de la Caridad (8 nuevos) =====
const hermanos = [
  ['Jesús', 'M'], ['Julia Ángela', 'F'], ['María del Pilar', 'F'], ['María de la Providencia', 'F'],
  ['Teresa', 'F'], ['Aurelia', 'F'], ['Luisa María del Amparo', 'F'], ['María del Amparo', 'F'],
].map(([given, sex]) => N({ name: `${given} Sánchez González`, given, surname: 'Sánchez González', sex, notes: [`Hermano/a de María de la Caridad Sánchez González. ${SOURCE}`] }));
const famPadres = tree.families.find((f) => f.id === '@F500007@');
famPadres.children.push(...hermanos);
for (const id of hermanos) byId.get(id).familyChild = famPadres.id;
const [jesus, juliaAngela, pilar, providencia, teresa, aurelia, luisaAmparo, amparo] = hermanos;

// ===== 3) Hijos: renombrar "Pérez" -> Alfonso y añadir Amelia =====
const perez = byId.get('@I500021@');
perez.name = 'Alfonso Pérez Sánchez';
perez.given = 'Alfonso';
perez.surname = 'Pérez Sánchez';
const amelia = N({ name: 'Amelia Pérez Sánchez', given: 'Amelia', surname: 'Pérez Sánchez', sex: 'F', notes: [`Hija de Ramiro Pérez González y María de la Caridad Sánchez González. ${SOURCE}`] });
const famRamiro = tree.families.find((f) => f.id === '@F500005@');
famRamiro.children.push(amelia);
byId.get(amelia).familyChild = famRamiro.id;

// ===== 4) Corregir: Josefa García-Lebredo casada con Ramón (no con Pedro José) =====
const famLebredo = tree.families.find((f) => f.id === '@F500151@');
const hijosLebredo = famLebredo.children;
tree.families = tree.families.filter((f) => f.id !== '@F500151@');
byId.get('@I500428@').familySpouse = (byId.get('@I500428@').familySpouse || []).filter((f) => f !== '@F500151@');
byId.get('@I500451@').familySpouse = (byId.get('@I500451@').familySpouse || []).filter((f) => f !== '@F500151@');
const famLebredoRamón = addFamily('@I500033@', '@I500451@', hijosLebredo);
for (const cid of hijosLebredo) byId.get(cid).familyChild = famLebredoRamón.id;
byId.get('@I500451@').notes = [...(byId.get('@I500451@').notes || []).filter((n) => !n.includes('Pedro José')), `Segunda esposa de Ramón Sánchez de Ron González (tíos de María de la Caridad). ${SOURCE}`];

// ===== 5) Cuñados y sobrinos =====
// Jesús + Amalia Fernández Pérez -> Sánchez Fernández
const amalia = N({ name: 'Amalia Fernández Pérez', given: 'Amalia', surname: 'Fernández Pérez', sex: 'F', notes: [`Cuñada de María de la Caridad (esposa de Jesús). ${SOURCE}`] });
const sanchezFernandez = [
  ['Teresa Paulina', 'F'], ['María de la Purificación', 'F'], ['María Pura Serafina', 'F'], ['Esmeralda Clara', 'F'],
  ['Emilio José', 'M'], ['Ramón Constantino', 'M'], ['María Mercedes', 'F'], ['José', 'M'],
].map(([given, sex]) => N({ name: `${given} Sánchez Fernández`, given, surname: 'Sánchez Fernández', sex, notes: [`Sobrino/a de María de la Caridad Sánchez González. ${SOURCE}`] }));
const famJesus = addFamily(jesus, amalia, sanchezFernandez);
for (const id of sanchezFernandez) byId.get(id).familyChild = famJesus.id;

// María del Amparo + Manuel Viella García -> Viella Sánchez
const viella = N({ name: 'Manuel Viella García', given: 'Manuel', surname: 'Viella García', sex: 'M', notes: [`Cuñado de María de la Caridad (esposo de María del Amparo). ${SOURCE}`] });
const viellaSanchez = [
  ['María Luisa', 'F'], ['María de los Dolores', 'F'], ['José Manuel', 'M'], ['Jesús Pedro', 'M'],
].map(([given, sex]) => N({ name: `${given} Viella Sánchez`, given, surname: 'Viella Sánchez', sex, notes: [`Sobrino/a de María de la Caridad Sánchez González. ${SOURCE}`] }));
const famViella = addFamily(viella, amparo, viellaSanchez);
for (const id of viellaSanchez) byId.get(id).familyChild = famViella.id;

// Aurelia + José Méndez Sánchez -> Méndez Sánchez
const mendez = N({ name: 'José Méndez Sánchez', given: 'José', surname: 'Méndez Sánchez', sex: 'M', notes: [`Cuñado de María de la Caridad (esposo de Aurelia). ${SOURCE}`] });
const mendezSanchez = [
  ['José Elías', 'M'], ['María del Carmen Amparo', 'F'], ['Belarmino', 'M'],
].map(([given, sex]) => N({ name: `${given} Méndez Sánchez`, given, surname: 'Méndez Sánchez', sex, notes: [`Sobrino/a de María de la Caridad Sánchez González. ${SOURCE}`] }));
const famMendez = addFamily(mendez, aurelia, mendezSanchez);
for (const id of mendezSanchez) byId.get(id).familyChild = famMendez.id;

// Elías Manuel Méndez Suárez (cuñado, esposo de Luisa María del Amparo)
const eliasMendez = N({ name: 'Elías Manuel Méndez Suárez', given: 'Elías Manuel', surname: 'Méndez Suárez', sex: 'M', notes: [`Cuñado de María de la Caridad (esposo de Luisa María del Amparo). ${SOURCE}`] });
addFamily(eliasMendez, luisaAmparo, []);

// Teresa + Manuel Fernández-Cueto -> Fernández Sánchez
const fernandezCueto = N({ name: 'Manuel Fernández-Cueto García-Pertierra', given: 'Manuel', surname: 'Fernández-Cueto García-Pertierra', sex: 'M', notes: [`Cuñado de María de la Caridad (esposo de Teresa). ${SOURCE}`] });
const fernandezSanchez = [
  ['María Olvido', 'F'], ['Celso', 'M'],
].map(([given, sex]) => N({ name: `${given} Fernández Sánchez`, given, surname: 'Fernández Sánchez', sex, notes: [`Sobrino/a de María de la Caridad Sánchez González. ${SOURCE}`] }));
const famFernandez = addFamily(fernandezCueto, teresa, fernandezSanchez);
for (const id of fernandezSanchez) byId.get(id).familyChild = famFernandez.id;

// Ramón Pérez Méndez (cuñado, hermano de Ramiro Pérez González)
const ramonPerezMendez = N({ name: 'Ramón Pérez Méndez', given: 'Ramón', surname: 'Pérez Méndez', sex: 'M', notes: [`Cuñado de María de la Caridad (hermano de Ramiro Pérez González). ${SOURCE}`] });
const famRamiroPadres = tree.families.find((f) => f.id === '@F500006@');
if (famRamiroPadres) { famRamiroPadres.children.push(ramonPerezMendez); byId.get(ramonPerezMendez).familyChild = famRamiroPadres.id; }

// Rodríguez Pérez (nieta)
const rodriguezPerez = N({ name: 'Rodríguez Pérez', given: null, surname: 'Rodríguez Pérez', sex: 'F', notes: [`Nieta de María de la Caridad Sánchez González (apellidos incompletos en origen). ${SOURCE}`] });

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
