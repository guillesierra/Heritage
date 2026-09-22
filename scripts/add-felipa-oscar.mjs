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

const SOURCE = 'Árbol administrado por Óscar Á.G.';
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

// ===== 1) Refinar Felipa (defunción) =====
const felipa = byId.get('@I500153@');
felipa.death = { ...(felipa.death || {}), date: '12 JUN 1778', place: 'Meiro, Coaña, Principado de Asturias, España' };
felipa.deathYear = 1778;
felipa.living = false;
addNote('@I500153@', SOURCE);

// ===== 2) Refinar nombre del hijo Juan Antonio =====
const juanAntonio = byId.get('@I500337@');
juanAntonio.name = 'Juan Antonio Sánchez de Ron Miranda Villamil';
juanAntonio.surname = 'Sánchez de Ron Miranda Villamil';

// ===== 3) Hijos de José Francisco + Rosa (nietos: Diego Antonio y Juan Méndez-Trelles) =====
const diegoAntonioMT = N({ name: 'Diego Antonio Sánchez de Ron Méndez-Trelles', given: 'Diego Antonio', surname: 'Sánchez de Ron Méndez-Trelles', sex: 'M', notes: [`Nieto de Felipa Rodríguez Casariego; hijo de José Francisco Sánchez de Ron. ${SOURCE}`] });
const juanMT = N({ name: 'Juan Sánchez de Ron Méndez-Trelles', given: 'Juan', surname: 'Sánchez de Ron Méndez-Trelles', sex: 'M', notes: [`Nieto de Felipa Rodríguez Casariego. ${SOURCE}`] });
const famJosFcoRosa = tree.families.find((f) => f.id === '@F500063@');
famJosFcoRosa.children.push(diegoAntonioMT, juanMT);
byId.get(diegoAntonioMT).familyChild = famJosFcoRosa.id;
byId.get(juanMT).familyChild = famJosFcoRosa.id;

// Matrimonio: Diego Antonio Méndez-Trelles + Rosa María González Fernández (@I500415@)
const famDiegoRosa = addFamily(diegoAntonioMT, '@I500415@', []);
addNote('@I500415@', `Esposa de Diego Antonio Sánchez de Ron Méndez-Trelles (nieto de Felipa Rodríguez Casariego). ${SOURCE}`);

// ===== 4) Hermanos de Rosa Méndez-Trelles =====
const josefaMT = N({ name: 'Josefa Méndez-Trelles', given: 'Josefa', surname: 'Méndez-Trelles', sex: 'F', notes: [`Hermana de Rosa Méndez-Trelles (nuera de Felipa). ${SOURCE}`] });
const pelayoAntonioMT = N({ name: 'Pelayo Antonio Méndez-Trelles González-Trelles', given: 'Pelayo Antonio', surname: 'Méndez-Trelles González-Trelles', sex: 'M', notes: [`Hermano de Rosa Méndez-Trelles (nuera de Felipa). ${SOURCE}`] });
const famPelayoRosa = tree.families.find((f) => f.id === '@F500065@');
famPelayoRosa.children.push(josefaMT, pelayoAntonioMT);
byId.get(josefaMT).familyChild = famPelayoRosa.id;
byId.get(pelayoAntonioMT).familyChild = famPelayoRosa.id;

// ===== 5) Nietos adicionales Sánchez de Ron González (hijos de Diego Antonio + Rosa María) =====
const pelayoSRG = N({ name: 'Pelayo Sánchez de Ron González', given: 'Pelayo', surname: 'Sánchez de Ron González', sex: 'M', notes: [`Bisnieto de Felipa Rodríguez Casariego. ${SOURCE}`] });
const miguelSRG = N({ name: 'Miguel Sánchez de Ron González', given: 'Miguel', surname: 'Sánchez de Ron González', sex: 'M', notes: [`Bisnieto de Felipa Rodríguez Casariego. ${SOURCE}`] });
const diegoSRG = N({ name: 'Diego Sánchez de Ron González', given: 'Diego', surname: 'Sánchez de Ron González', sex: 'M', notes: [`Bisnieto de Felipa Rodríguez Casariego. ${SOURCE}`] });
famDiegoRosa.children.push(pelayoSRG, miguelSRG, diegoSRG);
for (const cid of [pelayoSRG, miguelSRG, diegoSRG]) byId.get(cid).familyChild = famDiegoRosa.id;

// ===== 6) Josefa García-Villamil (esposa de un bisnieto) + descendencia =====
const josefaVillamil = N({ name: 'Josefa García-Villamil Fernández-Barrera', given: 'Josefa', surname: 'García-Villamil Fernández-Barrera', sex: 'F', notes: [`Esposa de un bisnieto de Felipa Rodríguez Casariego. ${SOURCE}`] });
const hijosVillamil = [
  ['María', 'Sánchez de Ron García-Villamil', 'F'],
  ['José', 'Sánchez de Ron García-Villamil', 'M'],
  ['Manuel', 'Sánchez de Ron García', 'M'],
  ['Ramona', 'Sánchez de Ron García', 'F'],
  ['Joaquina', 'Sánchez de Ron García', 'F'],
  ['Constantina', 'Sánchez de Ron García', 'F'],
].map(([given, surname, sex]) => N({ name: `${given} ${surname}`, given, surname, sex, notes: [`Tatara-tatara-nieto/a de Felipa Rodríguez Casariego. ${SOURCE}`] }));
const famVillamil = addFamily('@I500425@', josefaVillamil, hijosVillamil);
for (const cid of hijosVillamil) byId.get(cid).familyChild = famVillamil.id;

// ===== 7) Josefa García-Lebredo (esposa de otro bisnieto) + descendencia =====
const josefaLebredo = N({ name: 'Josefa García-Lebredo', given: 'Josefa', surname: 'García-Lebredo', sex: 'F', notes: [`Esposa de un bisnieto de Felipa Rodríguez Casariego. ${SOURCE}`] });
const hijosLebredo = [
  ['Félix', 'M'], ['Felipe', 'M'], ['Arsenio', 'M'], ['Ramón', 'M'],
  ['Saturna', 'F'], ['Damiana', 'F'], ['Plácida', 'F'], ['Generosa', 'F'],
].map(([given, sex]) => N({ name: `${given} Sánchez de Ron González`, given, surname: 'Sánchez de Ron González', sex, notes: [`Tatara-tatara-nieto/a de Felipa Rodríguez Casariego. ${SOURCE}`] }));
const famLebredo = addFamily('@I500428@', josefaLebredo, hijosLebredo);
for (const cid of hijosLebredo) byId.get(cid).familyChild = famLebredo.id;

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
