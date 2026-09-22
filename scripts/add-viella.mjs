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

const SOURCE = 'Árbol administrado por P. Viella.';
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
const findId = (name) => tree.individuals.find((p) => p.name === name)?.id;

// ===== Ancestros del cuñado Manuel Viella García =====
const bernardoViyella = N({ name: 'Bernardo Viyella', given: 'Bernardo', surname: 'Viyella', sex: 'M', notes: [`Bisabuelo del cuñado de María de la Caridad. ${SOURCE}`] });
const isabelF = N({ name: 'Isabel Fernández', given: 'Isabel', surname: 'Fernández', sex: 'F', notes: [`Bisabuela del cuñado de María de la Caridad. ${SOURCE}`] });
const desconocidoV = N({ name: 'Nombre desconocido', given: null, surname: null, sex: 'M', notes: [`Abuelo del cuñado de María de la Caridad (nombre no conservado). ${SOURCE}`] });
const petraViyella = N({ name: 'Petra Viyella Fernández', given: 'Petra', surname: 'Viyella Fernández', sex: 'F', notes: [`Abuela del cuñado de María de la Caridad. ${SOURCE}`] });
const joseViyella = N({ name: 'José Viella', given: 'José', surname: 'Viella', sex: 'M', notes: [`Padre del cuñado de María de la Caridad. ${SOURCE}`] });
const josefaPolavieja = N({ name: 'Josefa Manuela García-Polavieja Méndez', given: 'Josefa Manuela', surname: 'García-Polavieja Méndez', sex: 'F', notes: [`Madre del cuñado de María de la Caridad. ${SOURCE}`] });
const franciscoPolavieja = N({ name: 'Francisco Antonio García-Polavieja Álvarez', given: 'Francisco Antonio', surname: 'García-Polavieja Álvarez', sex: 'M', notes: [`Abuelo del cuñado de María de la Caridad. ${SOURCE}`] });
const ramonaMontana = N({ name: 'Ramona Méndez-Montaña Pérez-Villamil', given: 'Ramona', surname: 'Méndez-Montaña Pérez-Villamil', sex: 'F', notes: [`Abuela del cuñado de María de la Caridad. ${SOURCE}`] });

const famBisabuelos = addFamily(bernardoViyella, isabelF, [desconocidoV]);
byId.get(desconocidoV).familyChild = famBisabuelos.id;
const famAbuelosP = addFamily(desconocidoV, petraViyella, [joseViyella]);
byId.get(joseViyella).familyChild = famAbuelosP.id;
const famAbuelosM = addFamily(franciscoPolavieja, ramonaMontana, [josefaPolavieja]);
byId.get(josefaPolavieja).familyChild = famAbuelosM.id;

// Hermanos del cuñado (hermanos de Manuel Viella García)
const hermanosViella = [
  ['Pilar "Casa Riveirega"', 'Viella García', 'F'],
  ['Florentina', 'Viella García', 'F'],
  ['María', 'Viella García', 'F'],
  ['Ramona', 'Viella García', 'F'],
  ['Balbina', 'Viella García', 'F'],
  ['Salvador', 'Villella', 'M'],
  ['Manuela', 'Villella García', 'F'],
  ['José Joaquín', 'Villella García', 'M'],
  ['Juana', 'Viella García', 'F'],
].map(([given, surname, sex]) => N({ name: `${given} ${surname}`, given, surname, sex, notes: [`Hermano/a del cuñado de María de la Caridad. ${SOURCE}`] }));
const manuelViella = findId('Manuel Viella García');
const famViellaPadres = addFamily(joseViyella, josefaPolavieja, [manuelViella, ...hermanosViella]);
byId.get(manuelViella).familyChild = famViellaPadres.id;
for (const id of hermanosViella) byId.get(id).familyChild = famViellaPadres.id;

// ===== Descendencia (esposas/esposos de los sobrinos) =====
const mariaDoloresGarcia = N({ name: 'María Dolores (Lola) García García', given: 'María Dolores (Lola)', surname: 'García García', sex: 'F', notes: [`Esposa del sobrino de María de la Caridad (José Manuel Viella). ${SOURCE}`] });
const joaquinGarcia = N({ name: 'Joaquín García Pérez', given: 'Joaquín', surname: 'García Pérez', sex: 'M', notes: [`Suegro del sobrino de María de la Caridad. ${SOURCE}`] });
const elviraGarcia = N({ name: 'Elvira García Fernández', given: 'Elvira', surname: 'García Fernández', sex: 'F', notes: [`Suegra del sobrino de María de la Caridad. ${SOURCE}`] });
const mariaDoloresFernandez = N({ name: 'María de los Dolores Fernández Fernández', given: 'María de los Dolores', surname: 'Fernández Fernández', sex: 'F', notes: [`Nuera del sobrino de María de la Caridad. ${SOURCE}`] });
const josefaFernandez = N({ name: 'Josefa (Pepita del Caraxo) Fernández', given: 'Josefa (Pepita del Caraxo)', surname: 'Fernández', sex: 'F', notes: [`Esposa del sobrino de María de la Caridad. ${SOURCE}`] });
const manuelRodriguez = N({ name: 'Manuel Rodríguez Fernández', given: 'Manuel', surname: 'Rodríguez Fernández', sex: 'M', notes: [`Esposo de la sobrina de María de la Caridad. ${SOURCE}`] });
const sergioRodriguez = N({ name: 'Sergio Rodríguez Viella', given: 'Sergio', surname: 'Rodríguez Viella', sex: 'M', notes: [`Nieto de una hermana de María de la Caridad. ${SOURCE}`] });
const mercedesViella = N({ name: 'María Mercedes Viella Fernández', given: 'María Mercedes', surname: 'Viella Fernández', sex: 'F', notes: [`Nieta de una hermana de María de la Caridad. ${SOURCE}`] });
const viellaGarciaNieto = N({ name: 'Viella García', given: null, surname: 'Viella García', sex: 'U', notes: [`Nieto de una hermana de María de la Caridad (nombre incompleto). ${SOURCE}`] });
const valentinDorado = N({ name: 'Valentín Dorado Díaz', given: 'Valentín', surname: 'Dorado Díaz', sex: 'M', notes: [`Cuñado de una hermana de María de la Caridad. ${SOURCE}`] });

const joseManuel = findId('José Manuel Viella Sánchez');
const jesusPedro = findId('Jesús Pedro Viella Sánchez');
const mariaLuisa = findId('María Luisa Viella Sánchez');
const mariaDoloresViella = findId('María de los Dolores Viella Sánchez');

// José Manuel + María Dolores García; sus padres
const famJoseManuel = addFamily(joseManuel, mariaDoloresGarcia, []);
const famGarciaPadres = addFamily(joaquinGarcia, elviraGarcia, [mariaDoloresGarcia]);
byId.get(mariaDoloresGarcia).familyChild = famGarciaPadres.id;
// Nuera de José Manuel (hijo no nombrado) -> la enlazamos como esposa de un hijo desconocido
const hijoNoNombrado = N({ name: 'Nombre desconocido', given: null, surname: 'Viella', sex: 'M', notes: [`Hijo de José Manuel Viella (nombre no conservado). ${SOURCE}`] });
addFamily(joseManuel, mariaDoloresGarcia, [hijoNoNombrado]);
byId.get(hijoNoNombrado).familyChild = famJoseManuel.id;
addFamily(hijoNoNombrado, mariaDoloresFernandez, []);

// Jesús Pedro + Josefa Fernández -> María Mercedes
addFamily(jesusPedro, josefaFernandez, [mercedesViella]);
byId.get(mercedesViella).familyChild = tree.families[tree.families.length - 1].id;

// María Luisa + Manuel Rodríguez -> Sergio Rodríguez
const famRodriguez = addFamily(manuelRodriguez, mariaLuisa, [sergioRodriguez]);
byId.get(sergioRodriguez).familyChild = famRodriguez.id;

// Valentín Dorado con una hermana (María del Pilar)
const pilar = findId('María del Pilar Sánchez González');
addFamily(valentinDorado, pilar, []);

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
