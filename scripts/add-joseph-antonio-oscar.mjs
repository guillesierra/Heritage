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

// Nota: Óscar indica madre "Desconocido" (el GED/M. Amor dan a Bernarda Fernández-Medal).
byId.get('@I500162@').notes = [...(byId.get('@I500162@').notes || []), `Según ${SOURCE}, la madre figura como «Desconocido».`];

// ===== Tíos (hermanos del padre @I500164@, hijos de Domingo González García + Isabel Fernández-Chambergo) =====
const juanTio = N({ name: 'Juan Antonio González de Oneta Fernández', given: 'Juan Antonio', surname: 'González de Oneta Fernández', sex: 'M', notes: [`Tío de Joseph Antonio González Fernández-Medal. ${SOURCE}`] });
const mariaDomingaTia = N({ name: 'María Dominga González de Oneta', given: 'María Dominga', surname: 'González de Oneta', sex: 'F', notes: [`Tía de Joseph Antonio González Fernández-Medal. ${SOURCE}`] });
const mariaJosefaTia = N({ name: 'María Josefa González de Oneta García', given: 'María Josefa', surname: 'González de Oneta García', sex: 'F', notes: [`Tía de Joseph Antonio González Fernández-Medal. ${SOURCE}`] });
const famDomingoIsabel = tree.families.find((f) => f.id === '@F500071@');
famDomingoIsabel.children.push(juanTio, mariaDomingaTia, mariaJosefaTia);
for (const id of [juanTio, mariaDomingaTia, mariaJosefaTia]) byId.get(id).familyChild = famDomingoIsabel.id;

// ===== Tío abuelo (hermano de Domingo, hijo de Diego González de Oneta + Dominga) =====
const franciscoOneta = N({ name: 'Francisco González de Oneta', given: 'Francisco', surname: 'González de Oneta', sex: 'M', notes: [`Tío abuelo de Joseph Antonio González Fernández-Medal. ${SOURCE}`] });
const famDiegoDominga = tree.families.find((f) => f.id === '@F500073@');
famDiegoDominga.children.push(franciscoOneta);
byId.get(franciscoOneta).familyChild = famDiegoDominga.id;

// ===== Parientes lejanos (primos de 2º/3º grado, etc.) =====
const addStandalone = (name, given, surname, sex, note) => N({ name, given, surname, sex, notes: [`${note} ${SOURCE}`] });

// Primos del padre
const domingoPrimo = addStandalone('Domingo González de Oneta', 'Domingo', 'González de Oneta', 'M', 'Primo del padre de Joseph Antonio González Fernández-Medal.');
const pedroPrimo = addStandalone('Pedro González de Oneta', 'Pedro', 'González de Oneta', 'M', 'Primo del padre de Joseph Antonio González Fernández-Medal.');
const antonioPrimo = addStandalone('Antonio González de Oneta', 'Antonio', 'González de Oneta', 'M', 'Primo del padre de Joseph Antonio González Fernández-Medal.');

// Tía del padre
const josefaLovera = addStandalone('Josefa Fernández-Lovera Fernández-Barreras', 'Josefa', 'Fernández-Lovera Fernández-Barreras', 'F', 'Tía del padre de Joseph Antonio González Fernández-Medal.');

// Primo del padre (Fernández-Chambergo)
const cayetanoChambergo = addStandalone('José Antonio Cayetano Fernández-Chambergo', 'José Antonio Cayetano', 'Fernández-Chambergo', 'M', 'Primo del padre de Joseph Antonio González Fernández-Medal.');

// Primos (Méndez Pérez)
const marcelinoMendez = addStandalone('Marcelino "Marcelo" Méndez Pérez', 'Marcelino "Marcelo"', 'Méndez Pérez', 'M', 'Primo de 3.er grado de Joseph Antonio González Fernández-Medal.');
const constantinaMendez = addStandalone('Constantina Méndez Pérez', 'Constantina', 'Méndez Pérez', 'F', 'Prima de 3.er grado de Joseph Antonio González Fernández-Medal.');
const dominadoraMendez = addStandalone('Dominadora Méndez Pérez', 'Dominadora', 'Méndez Pérez', 'F', 'Prima de 3.er grado de Joseph Antonio González Fernández-Medal.');
const nemesioMendez = addStandalone('Nemesio Méndez Pérez', 'Nemesio', 'Méndez Pérez', 'M', 'Primo de 3.er grado de Joseph Antonio González Fernández-Medal.');
const basilisaMendez = addStandalone('Basilisa Méndez Pérez', 'Basilisa', 'Méndez Pérez', 'F', 'Prima de 3.er grado de Joseph Antonio González Fernández-Medal.');
const famMendezPerez = addFamily(null, null, [marcelinoMendez, constantinaMendez, dominadoraMendez, nemesioMendez, basilisaMendez]);

// Primos de 2.º grado (Méndez del Campón / Méndez Méndez)
const joseMendezCampon = addStandalone('José Méndez del Campón', 'José', 'Méndez del Campón', 'M', 'Yerno de un primo de Joseph Antonio González Fernández-Medal.');
const juanMendezCampon = addStandalone('Juan Méndez del Campón González', 'Juan', 'Méndez del Campón González', 'M', 'Primo de 2.º grado de Joseph Antonio González Fernández-Medal.');
const victorMendez = addStandalone('Víctor Manuel Méndez Méndez', 'Víctor Manuel', 'Méndez Méndez', 'M', 'Primo de 2.º grado de Joseph Antonio González Fernández-Medal.');
const nicolasaMendez = addStandalone('Nicolasa Méndez Méndez', 'Nicolasa', 'Méndez Méndez', 'F', 'Prima de 2.º grado de Joseph Antonio González Fernández-Medal.');
const famMendezMendez = addFamily(null, null, [victorMendez, nicolasaMendez]);
const famCampon = addFamily(joseMendezCampon, null, [juanMendezCampon]);

// Otros
const nicolasaPerez = addStandalone('Nicolasa Pérez y Cancio', 'Nicolasa', 'Pérez y Cancio', 'F', 'Esposa de un primo de 2.º grado de Joseph Antonio González Fernández-Medal.');
const joseAntonioPico = addStandalone('José Antonio Fernández-Pico Pérez', 'José Antonio', 'Fernández-Pico Pérez', 'M', 'Primo de 2.º grado de Joseph Antonio González Fernández-Medal.');
const mariaJosefaVillamil = addStandalone('María Josefa Pérez-Villamil García', 'María Josefa', 'Pérez-Villamil García', 'F', 'Esposa de un primo del padre de Joseph Antonio González Fernández-Medal.');

// Hija de su primo (homónima de su hija)
const rosaMariaPrima = addStandalone('Rosa María González Fernández', 'Rosa María', 'González Fernández', 'F', 'Hija de un primo de Joseph Antonio González Fernández-Medal (homónima de su hija).');
const josefaMendezPrima = addStandalone('Josefa Méndez', 'Josefa', 'Méndez', 'F', 'Hija de un primo de Joseph Antonio González Fernández-Medal.');

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
