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

const SOURCE = 'Árbol administrado por S. López López.';

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

// Refinar Dominga (variante de apellido)
const dominga = byId.get('@I500170@');
dominga.notes = [...(dominga.notes || []), `También «Dominga García-Sampelayo». ${SOURCE}`];

// ===== 1) Hijos adicionales de Diego + Dominga =====
const diegoGG = N({ name: 'Diego González García', given: 'Diego', surname: 'González García', sex: 'M', notes: [`Hijo de Diego González de Oneta Méndez y Dominga García-Sampelayo. ${SOURCE}`] });
const joseAntonioGG = N({ name: 'José Antonio González García', given: 'José Antonio', surname: 'González García', sex: 'M', notes: [`Hijo de Diego González de Oneta Méndez y Dominga García-Sampelayo. ${SOURCE}`] });
const fernandoGG = N({ name: 'Fernando González García', given: 'Fernando', surname: 'González García', sex: 'M', notes: [`Hijo de Diego González de Oneta Méndez y Dominga García-Sampelayo. ${SOURCE}`] });
const famDiegoDominga = tree.families.find((f) => f.id === '@F500073@');
famDiegoDominga.children.push(diegoGG, joseAntonioGG, fernandoGG);
for (const cid of [diegoGG, joseAntonioGG, fernandoGG]) byId.get(cid).familyChild = famDiegoDominga.id;

// ===== 2) Padres de Diego González de Oneta Méndez =====
const menOneta = N({ name: 'Men González de Oneta', given: 'Men', surname: 'González de Oneta', sex: 'M', notes: [`Suegro de Dominga García-Sampelayo; padre de Diego González de Oneta Méndez. ${SOURCE}`] });
const mariaMendez = N({ name: 'María Méndez', given: 'María', surname: 'Méndez', sex: 'F', notes: [`Suegra de Dominga García-Sampelayo; madre de Diego González de Oneta Méndez. ${SOURCE}`] });
const famOneta = { id: nextFamilyId(), husband: menOneta, wife: mariaMendez, children: ['@I500169@'], marriage: null, divorce: null };
tree.families.push(famOneta);
byId.get('@I500169@').familyChild = famOneta.id;
byId.get(menOneta).familySpouse.push(famOneta.id);
byId.get(mariaMendez).familySpouse.push(famOneta.id);

// ===== 3) Catalina Fernández (otra esposa) y sus padres =====
const catalina = N({ name: 'Catalina Fernández', given: 'Catalina', surname: 'Fernández', sex: 'F', notes: [`Otra esposa de Diego González de Oneta Méndez. ${SOURCE}`] });
const lucasFernandez = N({ name: 'Lucas Fernández', given: 'Lucas', surname: 'Fernández', sex: 'M', notes: [`Suegro de Diego González de Oneta Méndez; padre de Catalina Fernández. ${SOURCE}`] });
const mayorAlvarez = N({ name: 'Mayor Álvarez', given: 'Mayor', surname: 'Álvarez', sex: 'F', notes: [`Suegra de Diego González de Oneta Méndez; madre de Catalina Fernández. ${SOURCE}`] });
const famCatalina = { id: nextFamilyId(), husband: '@I500169@', wife: catalina, children: [], marriage: null, divorce: null };
tree.families.push(famCatalina);
byId.get(catalina).familySpouse.push(famCatalina.id);
byId.get('@I500169@').familySpouse.push(famCatalina.id);
const famLucasMayor = { id: nextFamilyId(), husband: lucasFernandez, wife: mayorAlvarez, children: [catalina], marriage: null, divorce: null };
tree.families.push(famLucasMayor);
byId.get(catalina).familyChild = famLucasMayor.id;
byId.get(lucasFernandez).familySpouse.push(famLucasMayor.id);
byId.get(mayorAlvarez).familySpouse.push(famLucasMayor.id);

// ===== 4) Madre y hermanos de Isabel Fernández-Chambergo =====
const mariaIsabelF = N({ name: 'María Isabel Fernández', given: 'María Isabel', surname: 'Fernández', sex: 'F', notes: [`Madre de Isabel Fernández-Chambergo Fernández (nuera de Dominga). ${SOURCE}`] });
const franciscaFC = N({ name: 'Francisca Fernández-Chambergo Fernández', given: 'Francisca', surname: 'Fernández-Chambergo Fernández', sex: 'F', notes: [`Hermana de Isabel Fernández-Chambergo Fernández. ${SOURCE}`] });
const alvaroFC = N({ name: 'Álvaro Fernández-Chambergo Fernández', given: 'Álvaro', surname: 'Fernández-Chambergo Fernández', sex: 'M', notes: [`Hermano de Isabel Fernández-Chambergo Fernández. ${SOURCE}`] });
const pedroFC = N({ name: 'Pedro Fernández-Chambergo Fernández', given: 'Pedro', surname: 'Fernández-Chambergo Fernández', sex: 'M', notes: [`Hermano de Isabel Fernández-Chambergo Fernández. ${SOURCE}`] });
const joseFC = N({ name: 'José Fernández-Chambergo Fernández', given: 'José', surname: 'Fernández-Chambergo Fernández', sex: 'M', notes: [`Hermano de Isabel Fernández-Chambergo Fernández. ${SOURCE}`] });
const miguelFC = N({ name: 'Miguel Fernández-Chambergo Fernández', given: 'Miguel', surname: 'Fernández-Chambergo Fernández', sex: 'M', notes: [`Hermano de Isabel Fernández-Chambergo Fernández. ${SOURCE}`] });
const anaFC = N({ name: 'Ana Fernández-Chambergo Fernández', given: 'Ana', surname: 'Fernández-Chambergo Fernández', sex: 'F', notes: [`Hermana de Isabel Fernández-Chambergo Fernández. ${SOURCE}`] });
const famPedroChambergo = tree.families.find((f) => f.id === '@F500074@');
famPedroChambergo.wife = mariaIsabelF;
famPedroChambergo.children.push(franciscaFC, alvaroFC, pedroFC, joseFC, miguelFC, anaFC);
for (const cid of [mariaIsabelF, franciscaFC, alvaroFC, pedroFC, joseFC, miguelFC, anaFC]) {
  if (cid !== mariaIsabelF) byId.get(cid).familyChild = famPedroChambergo.id;
}
byId.get(mariaIsabelF).familySpouse.push(famPedroChambergo.id);

// ===== 5) Nietos González-Cavanamarruga (hijos de Diego González García) =====
const juanCavanamarruga = N({ name: 'Juan Antonio González-Cavanamarruga', given: 'Juan Antonio', surname: 'González-Cavanamarruga', sex: 'M', notes: [`Nieto de Dominga García-Sampelayo. ${SOURCE}`] });
const mariaDomingaCav = N({ name: 'María Dominga González-Cavanamarruga', given: 'María Dominga', surname: 'González-Cavanamarruga', sex: 'F', notes: [`Nieta de Dominga García-Sampelayo. ${SOURCE}`] });
const mariaJosefaCav = N({ name: 'María Josefa González-Cavanamarruga', given: 'María Josefa', surname: 'González-Cavanamarruga', sex: 'F', notes: [`Nieta de Dominga García-Sampelayo. ${SOURCE}`] });
const famCavanamarruga = { id: nextFamilyId(), husband: diegoGG, wife: null, children: [juanCavanamarruga, mariaDomingaCav, mariaJosefaCav], marriage: null, divorce: null };
tree.families.push(famCavanamarruga);
for (const cid of [juanCavanamarruga, mariaDomingaCav, mariaJosefaCav]) byId.get(cid).familyChild = famCavanamarruga.id;
byId.get(diegoGG).familySpouse.push(famCavanamarruga.id);

// ===== 6) Bisnietos González Fernández (hijos de José Antonio González Fernández @I500164@ + Bernarda) =====
const bisnietosGF = [
  ['Joaquina Francisca', 'F'], ['Juan Antonio', 'M'], ['Francisco Javier', 'M'], ['Francisca', 'F'],
  ['Josefa María', 'F'], ['Manuel Antonio', 'M'], ['Tomás Antonio', 'M'], ['Domingo Antonio', 'M'],
  ['María Bernarda', 'F'], ['Bernardo Antonio', 'M'], ['Rosa María', 'F'], ['María Antonia', 'F'],
];
const hijosGF = [];
for (const [given, sex] of bisnietosGF) {
  const id = N({ name: `${given} González Fernández`, given, surname: 'González Fernández', sex, notes: [`Bisnieto/a de Dominga García-Sampelayo. ${SOURCE}`] });
  hijosGF.push(id);
}
// Duplicado "Domingo Antonio González Fernández" (aparece dos veces en el árbol de origen)
const domingoDup = N({ name: 'Domingo Antonio González Fernández', given: 'Domingo Antonio', surname: 'González Fernández', sex: 'M', notes: [`Bisnieto de Dominga García-Sampelayo (homónimo del anterior; posible duplicado en el árbol de origen). ${SOURCE}`] });
hijosGF.push(domingoDup);
const famGonzalezFernandez = tree.families.find((f) => f.id === '@F500070@');
famGonzalezFernandez.children.push(...hijosGF);
for (const cid of hijosGF) byId.get(cid).familyChild = famGonzalezFernandez.id;

// ===== 7) García-Piquera (esposo de una nieta + descendencia) =====
const antonioPiquera = N({ name: 'Antonio García-Piquera López-Acevedo', given: 'Antonio', surname: 'García-Piquera López-Acevedo', sex: 'M', notes: [`Esposo de una nieta de Dominga García-Sampelayo. ${SOURCE}`] });
const joseAntonioPiquera = N({ name: 'José Antonio García-Piquera', given: 'José Antonio', surname: 'García-Piquera', sex: 'M', notes: [`Bisnieto de Dominga García-Sampelayo. ${SOURCE}`] });
const mariaAntoniaPiquera = N({ name: 'María Antonia García-Piquera', given: 'María Antonia', surname: 'García-Piquera', sex: 'F', notes: [`Bisnieta de Dominga García-Sampelayo. ${SOURCE}`] });
const franciscoAntonioPiquera = N({ name: 'Francisco Antonio García-Piquera', given: 'Francisco Antonio', surname: 'García-Piquera', sex: 'M', notes: [`Bisnieto de Dominga García-Sampelayo. ${SOURCE}`] });
const juanPiqueraCav = N({ name: 'Juan García-Piquera González-Cavanamarruga', given: 'Juan', surname: 'García-Piquera González-Cavanamarruga', sex: 'M', notes: [`Bisnieto de Dominga García-Sampelayo. ${SOURCE}`] });
const famPiquera = { id: nextFamilyId(), husband: antonioPiquera, wife: mariaJosefaCav, children: [joseAntonioPiquera, mariaAntoniaPiquera, franciscoAntonioPiquera, juanPiqueraCav], marriage: null, divorce: null };
tree.families.push(famPiquera);
for (const cid of [joseAntonioPiquera, mariaAntoniaPiquera, franciscoAntonioPiquera, juanPiqueraCav]) byId.get(cid).familyChild = famPiquera.id;
byId.get(antonioPiquera).familySpouse.push(famPiquera.id);
byId.get(mariaJosefaCav).familySpouse.push(famPiquera.id);

// ===== 8) Fernández-Pico (yerno de un nieto + descendencia) =====
const franciscoPico = N({ name: 'Francisco Antonio Fernández-Pico Pérez', given: 'Francisco Antonio', surname: 'Fernández-Pico Pérez', sex: 'M', notes: [`Yerno de un nieto de Dominga García-Sampelayo. ${SOURCE}`] });
const rosaRamonaPico = N({ name: 'Rosa Ramona Fernández-Pico González', given: 'Rosa Ramona', surname: 'Fernández-Pico González', sex: 'F', notes: [`Tatara-tatara-nieta de Dominga García-Sampelayo. ${SOURCE}`] });
const manuelaJosefaPico = N({ name: 'Manuela Josefa Fernández-Pico', given: 'Manuela Josefa', surname: 'Fernández-Pico', sex: 'F', notes: [`Tatara-tatara-nieta de Dominga García-Sampelayo. ${SOURCE}`] });
const mariaRamonaPico = N({ name: 'María Ramona Fernández-Pico', given: 'María Ramona', surname: 'Fernández-Pico', sex: 'F', notes: [`Tatara-tatara-nieta de Dominga García-Sampelayo. ${SOURCE}`] });
// Rosa María González Fernández (bisnieta) como esposa de Francisco Antonio Fernández-Pico
const famPico = { id: nextFamilyId(), husband: franciscoPico, wife: hijosGF[10], children: [rosaRamonaPico, manuelaJosefaPico, mariaRamonaPico], marriage: null, divorce: null };
tree.families.push(famPico);
for (const cid of [rosaRamonaPico, manuelaJosefaPico, mariaRamonaPico]) byId.get(cid).familyChild = famPico.id;
byId.get(franciscoPico).familySpouse.push(famPico.id);
byId.get(hijosGF[10]).familySpouse.push(famPico.id);

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
