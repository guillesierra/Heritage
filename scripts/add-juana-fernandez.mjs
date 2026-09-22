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

const SOURCE = 'Árbol administrado por C. Fernández.';
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

// ===== 1) Refinar Juana =====
const juana = byId.get('@I500040@');
juana.name = 'Juana María González Fernández';
juana.given = 'Juana María';
juana.surname = 'González Fernández';
juana.birth = { ...(juana.birth || {}), place: 'Armental, Navia, Principado de Asturias, España' };
juana.death = { ...(juana.death || {}), place: 'Meiro, Coaña, Principado de Asturias, España' };
juana.notes = [...(juana.notes || []), SOURCE];

// ===== 2) Renombrar Joseph -> José y añadir el segundo José =====
const jose = byId.get('@I500429@');
jose.name = 'José Sánchez de Ron González';
jose.given = 'José';

const jose2 = N({ name: 'José Sánchez de Ron González', given: 'José', surname: 'Sánchez de Ron González', sex: 'M', notes: [`Hijo de Juana María González Fernández (segundo hijo llamado José; en el árbol de origen «José Sánchez de Ron González (2)»). ${SOURCE}`] });
const famJuana = tree.families.find((f) => f.id === '@F500014@');
famJuana.children.push(jose2);
byId.get(jose2).familyChild = famJuana.id;

// ===== 3) Mover los otros "Sánchez de Ron González" a Diego Antonio + Rosa María =====
// Hijos reales de Juana: Ramón (@I500033@), José (@I500429@), José(2), Rosa (@I500430@).
const mover = ['@I500419@', '@I500420@', '@I500421@', '@I500422@', '@I500423@', '@I500424@', '@I500425@', '@I500426@', '@I500427@', '@I500428@'];
famJuana.children = famJuana.children.filter((c) => !mover.includes(c));
const famDiegoRosa = tree.families.find((f) => f.id === '@F500149@');
for (const cid of mover) {
  famDiegoRosa.children.push(cid);
  byId.get(cid).familyChild = '@F500149@';
  byId.get(cid).notes = [...(byId.get(cid).notes || []).filter((n) => !n.includes('Nieto')), `Hijo/a de Diego Antonio Sánchez de Ron Méndez-Trelles y Rosa María González Fernández. ${SOURCE}`];
}

// ===== 4) Corregir García-Villamil: Josefa casada con José, no con Luis =====
const famVillamil = tree.families.find((f) => f.id === '@F500150@');
famVillamil.husband = '@I500429@';
byId.get('@I500429@').familySpouse.push('@F500150@');
byId.get('@I500425@').familySpouse = (byId.get('@I500425@').familySpouse || []).filter((f) => f !== '@F500150@');
byId.get('@I500444@').notes = [...(byId.get('@I500444@').notes || []), `Esposa de José Sánchez de Ron González (hijo de Juana María). ${SOURCE}`];

// ===== 5) Familia García de la Vega (esposo de una nieta) =====
const bernardoVega = N({ name: 'Bernardo García de la Vega Méndez-Casariego', given: 'Bernardo', surname: 'García de la Vega Méndez-Casariego', sex: 'M', notes: [`Suegro de una nieta de Juana María González Fernández. ${SOURCE}`] });
const joaquinaCartavio = N({ name: 'Joaquina Suárez-Cartavio Méndez de la Vega', given: 'Joaquina', surname: 'Suárez-Cartavio Méndez de la Vega', sex: 'F', notes: [`Suegra de una nieta de Juana María González Fernández. ${SOURCE}`] });
const joseVega = N({ name: 'José García de la Vega Suárez-Cartavio', given: 'José', surname: 'García de la Vega Suárez-Cartavio', sex: 'M', notes: [`Esposo de una nieta de Juana María González Fernández. ${SOURCE}`] });
const famVegaPadres = addFamily(bernardoVega, joaquinaCartavio, [joseVega]);
byId.get(joseVega).familyChild = famVegaPadres.id;

const joseGarciaSanchez = N({ name: 'José García Sánchez', given: 'José', surname: 'García Sánchez', sex: 'M', notes: [`Bisnieto de Juana María González Fernández. ${SOURCE}`] });
const marcelinaVega = N({ name: 'Marcelina García de la Vega Sánchez', given: 'Marcelina', surname: 'García de la Vega Sánchez', sex: 'F', notes: [`Bisnieta de Juana María González Fernández. ${SOURCE}`] });
const julianaVega = N({ name: 'Juliana García de la Vega Sánchez', given: 'Juliana', surname: 'García de la Vega Sánchez', sex: 'F', notes: [`Bisnieta de Juana María González Fernández. ${SOURCE}`] });
const manuelGarciaSanchez = N({ name: 'Manuel García Sánchez', given: 'Manuel', surname: 'García Sánchez', sex: 'M', notes: [`Bisnieto de Juana María González Fernández. ${SOURCE}`] });
const mariaDoloresGarcia = N({ name: 'María Dolores García Sánchez', given: 'María Dolores', surname: 'García Sánchez', sex: 'F', notes: [`Bisnieta de Juana María González Fernández. ${SOURCE}`] });
const famVega = addFamily(joseVega, '@I500445@', [joseGarciaSanchez, marcelinaVega, julianaVega, manuelGarciaSanchez, mariaDoloresGarcia]);
for (const cid of [joseGarciaSanchez, marcelinaVega, julianaVega, manuelGarciaSanchez, mariaDoloresGarcia]) byId.get(cid).familyChild = famVega.id;

// Serafina Fernández Fernández (esposa de un bisnieto) + tatara-tatara-nieta
const serafina = N({ name: 'Serafina Fernández Fernández', given: 'Serafina', surname: 'Fernández Fernández', sex: 'F', notes: [`Esposa de un bisnieto de Juana María González Fernández. ${SOURCE}`] });
const manuelaGarciaF = N({ name: 'Manuela García Fernández', given: 'Manuela', surname: 'García Fernández', sex: 'F', notes: [`Tatara-tatara-nieta de Juana María González Fernández. ${SOURCE}`] });
const famSerafina = addFamily(joseGarciaSanchez, serafina, [manuelaGarciaF]);
byId.get(manuelaGarciaF).familyChild = famSerafina.id;

// Juan García del Real (esposo de otra nieta)
const juanReal = N({ name: 'Juan García del Real García', given: 'Juan', surname: 'García del Real García', sex: 'M', notes: [`Esposo de una nieta de Juana María González Fernández. ${SOURCE}`] });
const famReal = addFamily(juanReal, '@I500450@', []);

// ===== 6) Familia de la nuera García-Villamil =====
const pedroVillamil = N({ name: 'Pedro Antonio García-Villamil Martínez', given: 'Pedro Antonio', surname: 'García-Villamil Martínez', sex: 'M', notes: [`Padre de la nuera de Juana María González Fernández. ${SOURCE}`] });
const josefaBarreras = N({ name: 'Josefa María Teresa Fernández-Barreras', given: 'Josefa María Teresa', surname: 'Fernández-Barreras', sex: 'F', notes: [`Madre de la nuera de Juana María González Fernández. ${SOURCE}`] });
const joseVillamilH = N({ name: 'José García-Villamil Fernández-Barreras', given: 'José', surname: 'García-Villamil Fernández-Barreras', sex: 'M', notes: [`Hermano de la nuera de Juana María González Fernández. ${SOURCE}`] });
const juanVillamilH = N({ name: 'Juan García-Villamil Fernández-Barreras', given: 'Juan', surname: 'García-Villamil Fernández-Barreras', sex: 'M', notes: [`Hermano de la nuera de Juana María González Fernández. ${SOURCE}`] });
const famVillamilPadres = addFamily(pedroVillamil, josefaBarreras, ['@I500444@', joseVillamilH, juanVillamilH]);
byId.get('@I500444@').familyChild = famVillamilPadres.id;
for (const cid of [joseVillamilH, juanVillamilH]) byId.get(cid).familyChild = famVillamilPadres.id;

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
