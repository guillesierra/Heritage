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

const SOURCE = 'Árbol administrado por M. Amor Sánchez de Ron.';
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
const addNote = (id, note) => {
  const p = byId.get(id);
  if (!p) return;
  p.notes ??= [];
  if (!p.notes.includes(note)) p.notes.push(note);
};

// ===== 1) Refinar personas existentes =====
const josephAntonio = byId.get('@I500162@');
josephAntonio.birth = { ...(josephAntonio.birth || {}), place: 'Armental, Navia, Principado de Asturias, España' };
addNote('@I500162@', `También «Joseph Antonio González Fernández-Medal»; ancestro directo (7.ª generación). ${SOURCE}`);

const anaMaria = byId.get('@I500163@');
anaMaria.name = 'Ana María Fernández-Pico Fernández-Casadoiro';
anaMaria.given = 'Ana María';
anaMaria.surname = 'Fernández-Pico Fernández-Casadoiro';
addNote('@I500163@', SOURCE);

addNote('@I500164@', `También «José Antonio González de Oneta (Cavanamarruga) Fernández-Chambergo». ${SOURCE}`);

const bernardaReal = byId.get('@I500165@');
bernardaReal.name = 'Bernarda Fernández-Medal González';
bernardaReal.given = 'Bernarda';
bernardaReal.surname = 'Fernández-Medal González';
addNote('@I500165@', SOURCE);

addNote('@I500033@', `También «Diego Antonio Ramón Sánchez de Ron González». ${SOURCE}`);
addNote('@I500039@', `Citado como «Diego Antonio Sánchez de Ron Méndez-Trelles» (yerno de Joseph Antonio González Fernández-Medal). ${SOURCE}`);

// ===== 2) Hijas de Joseph Antonio + Ana María (hermanas de Juana) =====
const rosaMariaGF = N({ name: 'Rosa María González Fernández', given: 'Rosa María', surname: 'González Fernández', sex: 'F', notes: [`Hija de Joseph Antonio González Fernández-Medal y Ana María. ${SOURCE}`] });
const mariaGF = N({ name: 'María González Fernández', given: 'María', surname: 'González Fernández', sex: 'F', notes: [`Hija de Joseph Antonio González Fernández-Medal y Ana María. ${SOURCE}`] });
const mariaJosefaGF = N({ name: 'María Josefa González Fernández', given: 'María Josefa', surname: 'González Fernández', sex: 'F', notes: [`Hija de Joseph Antonio González Fernández-Medal y Ana María. ${SOURCE}`] });
const joaquinaGF = N({ name: 'Joaquina González Fernández', given: 'Joaquina', surname: 'González Fernández', sex: 'F', notes: [`Hija de Joseph Antonio González Fernández-Medal y Ana María. ${SOURCE}`] });
const famJosAntAna = tree.families.find((f) => f.id === '@F500069@');
famJosAntAna.children.push(rosaMariaGF, mariaGF, mariaJosefaGF, joaquinaGF);
for (const cid of [rosaMariaGF, mariaGF, mariaJosefaGF, joaquinaGF]) byId.get(cid).familyChild = famJosAntAna.id;

// ===== 3) Nietos Sánchez de Ron González (hijos de Juana + Manuel José Antonio) =====
const nietosSRG = [
  ['Antonio José', 'M'], ['Domingo Antonio', 'M'], ['Josefa María Rosa', 'F'], ['María Josefa', 'F'],
  ['Joseph Antonio', 'M'], ['Ramona María', 'F'], ['Luis', 'M'], ['Juana', 'F'],
  ['Juan José', 'M'], ['Pedro José', 'M'], ['Joseph', 'M'], ['Rosa', 'F'],
];
const hijosSRG = [];
for (const [given, sex] of nietosSRG) {
  const id = N({ name: `${given} Sánchez de Ron González`, given, surname: 'Sánchez de Ron González', sex, notes: [`Nieto/a de Joseph Antonio González Fernández-Medal. ${SOURCE}`] });
  hijosSRG.push(id);
}
const famJuanaSR = tree.families.find((f) => f.id === '@F500014@');
famJuanaSR.children.push(...hijosSRG);
for (const cid of hijosSRG) byId.get(cid).familyChild = famJuanaSR.id;

// ===== 4) Fernández-Castañera (yerno + descendencia) =====
const luisCastanera = N({ name: 'Luis Fernández-Castañera Otero', given: 'Luis', surname: 'Fernández-Castañera Otero', sex: 'M', notes: [`Yerno de Joseph Antonio González Fernández-Medal. ${SOURCE}`] });
const juanCastanera = N({ name: 'Juan Fernández-Castañera González', given: 'Juan', surname: 'Fernández-Castañera González', sex: 'M', notes: [`Nieto de Joseph Antonio González Fernández-Medal. ${SOURCE}`] });
const ignacioCastanera = N({ name: 'Ignacio José Fernández-Castañera González', given: 'Ignacio José', surname: 'Fernández-Castañera González', sex: 'M', notes: [`Nieto de Joseph Antonio González Fernández-Medal. ${SOURCE}`] });
const franciscoCastanera = N({ name: 'Francisco Fernández-Castañera González', given: 'Francisco', surname: 'Fernández-Castañera González', sex: 'M', notes: [`Nieto de Joseph Antonio González Fernández-Medal. ${SOURCE}`] });
const rosaJosefaCastanera = N({ name: 'Rosa Josefa Fernández-Castañera González', given: 'Rosa Josefa', surname: 'Fernández-Castañera González', sex: 'F', notes: [`Nieta de Joseph Antonio González Fernández-Medal. ${SOURCE}`] });
const rosaCastanera = N({ name: 'Rosa Fernández-Castañera González', given: 'Rosa', surname: 'Fernández-Castañera González', sex: 'F', notes: [`Nieta de Joseph Antonio González Fernández-Medal. ${SOURCE}`] });
const famCastanera = { id: nextFamilyId(), husband: luisCastanera, wife: mariaGF, children: [juanCastanera, ignacioCastanera, franciscoCastanera, rosaJosefaCastanera, rosaCastanera], marriage: null, divorce: null };
tree.families.push(famCastanera);
for (const cid of [juanCastanera, ignacioCastanera, franciscoCastanera, rosaJosefaCastanera, rosaCastanera]) byId.get(cid).familyChild = famCastanera.id;
byId.get(luisCastanera).familySpouse.push(famCastanera.id);
byId.get(mariaGF).familySpouse.push(famCastanera.id);

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
