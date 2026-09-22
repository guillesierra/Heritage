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

const SOURCE = 'Árbol administrado por J. Castaño Pedrosa.';
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

// ===== 1) Refinar =====
const anaMaria = byId.get('@I500163@');
anaMaria.birth = { ...(anaMaria.birth || {}), place: 'Armental, Navia, Principado de Asturias, España' };
const mariaMadre = byId.get('@I500173@');
mariaMadre.name = 'María Fernández-Casadoiro';
mariaMadre.given = 'María';
mariaMadre.surname = 'Fernández-Casadoiro';
mariaMadre.notes = [...(mariaMadre.notes || []), SOURCE];

// ===== 2) Ancestros de Ana María =====
const franciscoConcha = N({ name: 'Francisco Fernández de la Concha Noriega', given: 'Francisco', surname: 'Fernández de la Concha Noriega', sex: 'M', notes: [`Abuelo de Ana María Fernández-Pico. ${SOURCE}`] });
const cathalinaMadriz = N({ name: 'Cathalina Gómez de la Madriz', given: 'Cathalina', surname: 'Gómez de la Madriz', sex: 'F', notes: [`Abuela de Ana María Fernández-Pico. ${SOURCE}`] });
const alonsoAlto = N({ name: 'Alonso Fernández del Alto', given: 'Alonso', surname: 'Fernández del Alto', sex: 'M', notes: [`Bisabuelo de Ana María Fernández-Pico. ${SOURCE}`] });
const isabelPuerta = N({ name: 'Isabel de la Puerta Colomo', given: 'Isabel', surname: 'de la Puerta Colomo', sex: 'F', notes: [`Bisabuela de Ana María Fernández-Pico. ${SOURCE}`] });

// Bisabuelos -> abuelo
const famBisabuelos = addFamily(alonsoAlto, isabelPuerta, [franciscoConcha]);
byId.get(franciscoConcha).familyChild = famBisabuelos.id;

// Tíos (hijos de Francisco de la Concha + Cathalina)
const cathalinaConcha = N({ name: 'Cathalina de la Concha Noriega', given: 'Cathalina', surname: 'de la Concha Noriega', sex: 'F', notes: [`Tía de Ana María Fernández-Pico. ${SOURCE}`] });
const franciscoConchaHijo = N({ name: 'Francisco Fernández de la Concha Noriega', given: 'Francisco', surname: 'Fernández de la Concha Noriega', sex: 'M', notes: [`Tío de Ana María Fernández-Pico (homónimo de su abuelo). ${SOURCE}`] });
const miguelConcha = N({ name: 'Miguel Fernández de la Concha Noriega', given: 'Miguel', surname: 'Fernández de la Concha Noriega', sex: 'M', notes: [`Tío de Ana María Fernández-Pico. ${SOURCE}`] });

// Abuelos -> padre (Juan Fernández Pico) + tíos
const famAbuelos = addFamily(franciscoConcha, cathalinaMadriz, ['@I500172@', cathalinaConcha, franciscoConchaHijo, miguelConcha]);
byId.get('@I500172@').familyChild = famAbuelos.id;
for (const cid of [cathalinaConcha, franciscoConchaHijo, miguelConcha]) byId.get(cid).familyChild = famAbuelos.id;

// ===== 3) Hermanos de Ana María =====
const juanFcoConcha = N({ name: 'Juan Francisco Fernández de la Concha', given: 'Juan Francisco', surname: 'Fernández de la Concha', sex: 'M', notes: [`Hermano de Ana María Fernández-Pico. ${SOURCE}`] });
const mariaFcaConcha = N({ name: 'María Francisca Fernández de la Concha', given: 'María Francisca', surname: 'Fernández de la Concha', sex: 'F', notes: [`Hermana de Ana María Fernández-Pico. ${SOURCE}`] });
const josephPico = N({ name: 'Joseph Fernández-Pico', given: 'Joseph', surname: 'Fernández-Pico', sex: 'M', notes: [`Hermano de Ana María Fernández-Pico. ${SOURCE}`] });
const famPadresAna = tree.families.find((f) => f.id === '@F500075@');
famPadresAna.children.push(juanFcoConcha, mariaFcaConcha, josephPico);
for (const cid of [juanFcoConcha, mariaFcaConcha, josephPico]) byId.get(cid).familyChild = famPadresAna.id;

// ===== 4) Descendientes: yernos y nietos =====
const bousono = N({ name: 'José Antonio Fernández-Bousoño García-Lebredo', given: 'José Antonio', surname: 'Fernández-Bousoño García-Lebredo', sex: 'M', notes: [`Yerno de Ana María Fernández-Pico. ${SOURCE}`] });
const rosaBousono = N({ name: 'Rosa Fernández-Bousoño González', given: 'Rosa', surname: 'Fernández-Bousoño González', sex: 'F', notes: [`Nieta de Ana María Fernández-Pico. ${SOURCE}`] });
const fernandoBousono = N({ name: 'Fernando Antonio Fernández-Bousoño', given: 'Fernando Antonio', surname: 'Fernández-Bousoño', sex: 'M', notes: [`Nieto de Ana María Fernández-Pico. ${SOURCE}`] });
const bernardoBousono = N({ name: 'Bernardo Fernández-Bousoño González', given: 'Bernardo', surname: 'Fernández-Bousoño González', sex: 'M', notes: [`Nieto de Ana María Fernández-Pico. ${SOURCE}`] });
const famBousono = addFamily(bousono, '@I500417@', [rosaBousono, fernandoBousono, bernardoBousono]);
for (const cid of [rosaBousono, fernandoBousono, bernardoBousono]) byId.get(cid).familyChild = famBousono.id;
byId.get('@I500417@').notes = [...(byId.get('@I500417@').notes || []), `Esposa de José Antonio Fernández-Bousoño García-Lebredo. ${SOURCE}`];

const castrillon = N({ name: 'José Fernández-Castrillón', given: 'José', surname: 'Fernández-Castrillón', sex: 'M', notes: [`Yerno de Ana María Fernández-Pico. ${SOURCE}`] });
const josefaCastrillon = N({ name: 'Josefa Fernández-Castrillón González', given: 'Josefa', surname: 'Fernández-Castrillón González', sex: 'F', notes: [`Nieta de Ana María Fernández-Pico. ${SOURCE}`] });
const joseCastrillon = N({ name: 'José Fernández-Castrillón González', given: 'José', surname: 'Fernández-Castrillón González', sex: 'M', notes: [`Nieto de Ana María Fernández-Pico. ${SOURCE}`] });
const teresaCastrillon = N({ name: 'Teresa Fernández-Castrillón González', given: 'Teresa', surname: 'Fernández-Castrillón González', sex: 'F', notes: [`Nieta de Ana María Fernández-Pico. ${SOURCE}`] });
const famCastrillon = addFamily(castrillon, '@I500418@', [josefaCastrillon, joseCastrillon, teresaCastrillon]);
for (const cid of [josefaCastrillon, joseCastrillon, teresaCastrillon]) byId.get(cid).familyChild = famCastrillon.id;
byId.get('@I500418@').notes = [...(byId.get('@I500418@').notes || []), `Esposa de José Fernández-Castrillón. ${SOURCE}`];

// Navia-Armal (esposo de Rosa + bisnietos)
const naviaArmal = N({ name: 'Francisco Navia-Armal Manso', given: 'Francisco', surname: 'Navia-Armal Manso', sex: 'M', notes: [`Esposo de Rosa Fernández-Bousoño González (nieta de Ana María). ${SOURCE}`] });
const hijosNavia = [
  ['José', 'Navia-Armal Fernández-Bousoño', 'M'],
  ['Manuela Francisca', 'Navia-Armal', 'F'],
  ['Francisco Tomás Ángel', 'Navia-Armal', 'M'],
  ['Manuel', 'Navia-Armal Fernández-Bousoño', 'M'],
  ['Carmela Ramona', 'Navia-Armal', 'F'],
  ['Juan', 'Navia-Armal Fernández-Bousoño', 'M'],
  ['Ramona Manuela', 'Navia-Armal', 'F'],
  ['María del Carmen', 'Navia-Armal', 'F'],
].map(([given, surname, sex]) => N({ name: `${given} ${surname}`, given, surname, sex, notes: [`Bisnieto/a de Ana María Fernández-Pico. ${SOURCE}`] }));
const famNavia = addFamily(naviaArmal, rosaBousono, hijosNavia);
for (const cid of hijosNavia) byId.get(cid).familyChild = famNavia.id;

// Padres y hermanos del yerno Fernández-Bousoño
const bousonoPadre = N({ name: 'Jose Antonio Fernández Bousoño', given: 'Jose Antonio', surname: 'Fernández Bousoño', sex: 'M', notes: [`Padre del yerno de Ana María Fernández-Pico. ${SOURCE}`] });
const teresaLebredo = N({ name: 'Teresa García Lebredo Méndez', given: 'Teresa', surname: 'García Lebredo Méndez', sex: 'F', notes: [`Madre del yerno de Ana María Fernández-Pico. ${SOURCE}`] });
const bousonoHermano = N({ name: 'Jose Antonio Fernández Bousoño', given: 'Jose Antonio', surname: 'Fernández Bousoño', sex: 'M', notes: [`Hermano del yerno de Ana María Fernández-Pico (homónimo de su padre). ${SOURCE}`] });
const antonioPinheiro = N({ name: 'Antônio Pedro Fernandes Pinheiro', given: 'Antônio Pedro', surname: 'Fernandes Pinheiro', sex: 'M', notes: [`Hermano del yerno de Ana María Fernández-Pico. ${SOURCE}`] });
const joaquimPinheiro = N({ name: 'Joaquim Caetano Fernandes Pinheiro', given: 'Joaquim Caetano', surname: 'Fernandes Pinheiro', sex: 'M', notes: [`Hermano del yerno de Ana María Fernández-Pico. ${SOURCE}`] });
const famBousonoPadres = addFamily(bousonoPadre, teresaLebredo, [bousono, bousonoHermano, antonioPinheiro, joaquimPinheiro]);
for (const cid of [bousono, bousonoHermano, antonioPinheiro, joaquimPinheiro]) byId.get(cid).familyChild = famBousonoPadres.id;

// Abuelos del yerno (portugueses)
const franciscoFernandes = N({ name: 'Francisco Fernandes', given: 'Francisco', surname: 'Fernandes', sex: 'M', notes: [`Abuelo del yerno de Ana María Fernández-Pico. ${SOURCE}`] });
const mariaPereira = N({ name: 'Maria Pereira São Francisco', given: 'Maria', surname: 'Pereira São Francisco', sex: 'F', notes: [`Abuela del yerno de Ana María Fernández-Pico. ${SOURCE}`] });
const famAbuelosBousono = addFamily(franciscoFernandes, mariaPereira, [bousonoPadre]);
byId.get(bousonoPadre).familyChild = famAbuelosBousono.id;

// Suegros de la nieta (padres de Francisco Navia-Armal)
const naviaArmalPadre = N({ name: 'Pedro José Ramón Navia-Armal Fernández-Lovera', given: 'Pedro José Ramón', surname: 'Navia-Armal Fernández-Lovera', sex: 'M', notes: [`Suegro de Rosa Fernández-Bousoño González. ${SOURCE}`] });
const ramonaManso = N({ name: 'Ramona Manso Sierra', given: 'Ramona', surname: 'Manso Sierra', sex: 'F', notes: [`Suegra de Rosa Fernández-Bousoño González. ${SOURCE}`] });
const famNaviaPadres = addFamily(naviaArmalPadre, ramonaManso, [naviaArmal]);
byId.get(naviaArmal).familyChild = famNaviaPadres.id;

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
