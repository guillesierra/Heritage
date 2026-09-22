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

const SOURCE = 'Árbol administrado por M. Amor Sánchez de Ron.';

const person = (data) => ({
  occupations: [], notes: [], sourceRefs: [], media: [], localPhoto: null,
  familyChild: null, familySpouse: [], birth: null, death: null, birthYear: null, deathYear: null,
  living: false,
  ...data,
});

const addNote = (id, note) => {
  const p = byId.get(id);
  if (!p) return;
  p.notes ??= [];
  if (!p.notes.includes(note)) p.notes.push(note);
};

const newPeople = [];
const N = (data) => {
  const id = nextId();
  const p = person({ id, ...data });
  newPeople.push(p);
  return id;
};

// ===== 1) Refinar personas existentes =====
// Diego Antonio: lugar de nacimiento + nombre
const diegoAntonio = byId.get('@I500152@');
diegoAntonio.birth = { ...(diegoAntonio.birth || {}), place: 'Meiro, Coaña, Principado de Asturias, España' };
addNote('@I500152@', SOURCE);

// Felipa: nombre completo
const felipa = byId.get('@I500153@');
felipa.name = 'Felipa Rodríguez-Casariego y Acevedo';
felipa.given = 'Felipa';
felipa.surname = 'Rodríguez-Casariego y Acevedo';
addNote('@I500153@', `${SOURCE} (en el árbol figura como «Felipa Díaz Casariego»).`);

// ===== 2) Núcleo: hermano e hijos =====
const franciscoAntonio = N({ name: 'Francisco Antonio Sánchez de Ron', given: 'Francisco Antonio', surname: 'Sánchez de Ron', sex: 'M', notes: [`Hermano de Diego Antonio Sánchez de Ron Infanzón. ${SOURCE}`] });
const juanAntonio = N({ name: 'Juan Antonio Sánchez de Ron', given: 'Juan Antonio', surname: 'Sánchez de Ron', sex: 'M', notes: [`Hijo de Diego Antonio Sánchez de Ron Infanzón y Felipa. ${SOURCE}`] });
const mariaFrancisca = N({ name: 'María Francisca Sánchez de Ron', given: 'María Francisca', surname: 'Sánchez de Ron', sex: 'F', notes: [`Hija de Diego Antonio Sánchez de Ron Infanzón y Felipa. ${SOURCE}`] });
const mariaRosa = N({ name: 'María Rosa Sánchez de Ron', given: 'María Rosa', surname: 'Sánchez de Ron', sex: 'F', notes: [`Hija de Diego Antonio Sánchez de Ron Infanzón y Felipa. ${SOURCE}`] });

// ===== 3) Ancestros paternos (padres de Salvador) =====
const diegoVazquez = N({ name: 'Diego Sánchez de Ron Vázquez', given: 'Diego', surname: 'Sánchez de Ron Vázquez', sex: 'M', notes: [`Bisabuelo paterno de Diego Antonio. ${SOURCE}`] });
const magdalena = N({ name: 'Magdalena Álvarez-Rodil', given: 'Magdalena', surname: 'Álvarez-Rodil', sex: 'F', notes: [`Bisabuela paterna de Diego Antonio; esposa de Diego Sánchez de Ron Vázquez. ${SOURCE}`] });
const mariaVazquez = N({ name: 'María Vázquez', given: 'María', surname: 'Vázquez', sex: 'F', notes: [`Tatarabuela paterna de Diego Antonio; madre de Diego Sánchez de Ron Vázquez. ${SOURCE}`] });

// ===== 4) Ancestros maternos (generación Méndez-Trelles) =====
const alonsoMendezTrelles = N({ name: 'Alonso García-Infanzón Méndez-Trelles', given: 'Alonso', surname: 'García-Infanzón Méndez-Trelles', sex: 'M', notes: [`Bisabuelo materno de Diego Antonio; padre de Alonso García-Infanzón Fernández. ${SOURCE}`] });
const isabelVillaiz = N({ name: 'Isabel Fernández de Villaiz', given: 'Isabel', surname: 'Fernández de Villaiz', sex: 'F', notes: [`Bisabuela materna de Diego Antonio; esposa de Alonso García-Infanzón Méndez-Trelles. ${SOURCE}`] });
const lopeGarciaMendez = N({ name: 'Lope García Infanzón Méndez Trelles', given: 'Lope', surname: 'García Infanzón Méndez Trelles', sex: 'M', notes: [`Tío bisabuelo de Diego Antonio; hermano de Alonso García-Infanzón Méndez-Trelles. ${SOURCE}`] });
const mariaGarciaMendez = N({ name: 'María García Infanzón Méndez Trelles', given: 'María', surname: 'García Infanzón Méndez Trelles', sex: 'F', notes: [`Hermana del bisabuelo de Diego Antonio. ${SOURCE}`] });
const franciscaGarciaMendez = N({ name: 'Francisca García-Infanzón Méndez-Trelles', given: 'Francisca', surname: 'García-Infanzón Méndez-Trelles', sex: 'F', notes: [`Hermana del bisabuelo de Diego Antonio. ${SOURCE}`] });
const mariaMendezTrelles = N({ name: 'María Méndez-Trelles', given: 'María', surname: 'Méndez-Trelles', sex: 'F', notes: [`Tatarabuela materna de Diego Antonio; esposa de Juan «el viejo» García-Infanzón y de la Vega. ${SOURCE}`] });

// ===== 5) Hermanos de Alonso García-Infanzón Fernández (tíos abuelos) =====
const juanGarciaFernandez = N({ name: 'Juan García-Infanzón Fernández', given: 'Juan', surname: 'García-Infanzón Fernández', sex: 'M', notes: [`Tío abuelo de Diego Antonio; hermano de Alonso García-Infanzón Fernández. ${SOURCE}`] });
const domingoGarciaFernandez = N({ name: 'Domingo García-Infanzón Fernández', given: 'Domingo', surname: 'García-Infanzón Fernández', sex: 'M', notes: [`Tío abuelo de Diego Antonio. ${SOURCE}`] });
const anaMendezFernandez = N({ name: 'Ana Méndez-Infanzón Fernández', given: 'Ana', surname: 'Méndez-Infanzón Fernández', sex: 'F', notes: [`Tía abuela de Diego Antonio. ${SOURCE}`] });
const mariaMendezFernandez = N({ name: 'María Méndez-Infanzón Fernández', given: 'María', surname: 'Méndez-Infanzón Fernández', sex: 'F', notes: [`Tía abuela de Diego Antonio. ${SOURCE}`] });
const franciscoGarciaFernandez = N({ name: 'Francisco García-Infanzón Fernández', given: 'Francisco', surname: 'García-Infanzón Fernández', sex: 'M', notes: [`Tío abuelo de Diego Antonio. ${SOURCE}`] });

// ===== 6) Tíos + familia Canzio =====
const roqueSanchezRon = N({ name: 'Roque Sánchez de Ron Miranda Villamil', given: 'Roque', surname: 'Sánchez de Ron Miranda Villamil', sex: 'M', notes: [`Tío de Diego Antonio; hermano de Diego Sánchez de Ron Miranda Villamil Trelles. ${SOURCE}`] });
const juanaCanzio = N({ name: 'Juana Canzio y la Vega', given: 'Juana', surname: 'Canzio y la Vega', sex: 'F', notes: [`Tía de Diego Antonio; esposa de Roque Sánchez de Ron. ${SOURCE}`] });
const phelipaCanzio = N({ name: 'Phelipa Bernarda Sánchez de Canzio', given: 'Phelipa Bernarda', surname: 'Sánchez de Canzio', sex: 'F', notes: [`Prima de Diego Antonio. ${SOURCE}`] });
const rosaCanzio = N({ name: 'Rosa Sánchez de Canzio y la Vega', given: 'Rosa', surname: 'Sánchez de Canzio y la Vega', sex: 'F', notes: [`Prima de Diego Antonio. ${SOURCE}`] });
const nicolasCanzio = N({ name: 'Nicolás Venito Sánchez de Canzio', given: 'Nicolás Venito', surname: 'Sánchez de Canzio', sex: 'M', notes: [`Primo de Diego Antonio. ${SOURCE}`] });
const roqueAgustinoCanzio = N({ name: 'Roque Agustino Sánchez de Canzio', given: 'Roque Agustino', surname: 'Sánchez de Canzio', sex: 'M', notes: [`Primo de Diego Antonio. ${SOURCE}`] });
const josephYgnacioCanzio = N({ name: 'Joseph Ygnacio Antonio Sánchez de Canzio', given: 'Joseph Ygnacio Antonio', surname: 'Sánchez de Canzio', sex: 'M', notes: [`Primo de Diego Antonio. ${SOURCE}`] });
const franciscoBernardoCanzio = N({ name: 'Francisco Bernardo Sánchez de Canzio', given: 'Francisco Bernardo', surname: 'Sánchez de Canzio', sex: 'M', notes: [`Primo de Diego Antonio. ${SOURCE}`] });
const amaroRejo = N({ name: 'Amaro Rejo Seuy y Mon', given: 'Amaro', surname: 'Rejo Seuy y Mon', sex: 'M', notes: [`Esposo de una prima de Diego Antonio. ${SOURCE}`] });

// ===== 7) Bartolomé (tío) =====
const bartolome = N({ name: 'Bartolomé García Infanzón', given: 'Bartolomé', surname: 'García Infanzón', sex: 'M', notes: [`Tío de Diego Antonio. ${SOURCE}`] });

// ===== 8) Ancestros profundos (5-6 generaciones) =====
const mariaAlfonsoVega = N({ name: 'María Alfonso de la Vega', given: 'María', surname: 'Alfonso de la Vega', sex: 'F', notes: [`Ancestro directo (5 generaciones) de Diego Antonio; esposa de Lucas Fernández Infanzón. ${SOURCE}`] });
const gonzaloGarcia = N({ name: 'Gonzalo García Infanzón', given: 'Gonzalo', surname: 'García Infanzón', sex: 'M', notes: [`Ancestro directo (6 generaciones) de Diego Antonio. ${SOURCE}`] });
const balesquida = N({ name: 'Balesquida Méndez', given: 'Balesquida', surname: 'Méndez', sex: 'F', notes: [`Ancestro directo (6 generaciones) de Diego Antonio; esposa de Gonzalo García Infanzón. ${SOURCE}`] });

// ===== 9) Parientes de la generación de los abuelos (de la Vega / Sierra) =====
const mariaAlfonsoGarciaVega = N({ name: 'María Alfonso García Infanzón y de la Vega', given: 'María Alfonso', surname: 'García Infanzón y de la Vega', sex: 'F', notes: [`Tía abuela del abuelo de Diego Antonio. ${SOURCE}`] });
const alonsoLopezVega = N({ name: 'Alonso López Infanzón y de la Vega', given: 'Alonso', surname: 'López Infanzón y de la Vega', sex: 'M', notes: [`Tío abuelo del abuelo de Diego Antonio. ${SOURCE}`] });
const leonorSierra = N({ name: 'Leonor Rodríguez de Sierra', given: 'Leonor', surname: 'Rodríguez de Sierra', sex: 'F', notes: [`Tía del abuelo de Diego Antonio. ${SOURCE}`] });
const alvaroInfanzon = N({ name: 'Álvaro Infanzón y Sierra', given: 'Álvaro', surname: 'Infanzón y Sierra', sex: 'M', notes: [`Primo del abuelo de Diego Antonio. ${SOURCE}`] });
const miguelGarciaSierra = N({ name: 'Miguel García Infanzón y Sierra', given: 'Miguel', surname: 'García Infanzón y Sierra', sex: 'M', notes: [`Primo del abuelo de Diego Antonio. ${SOURCE}`] });
const juanInfanzon = N({ name: 'Juan Infanzón y Sierra', given: 'Juan', surname: 'Infanzón y Sierra', sex: 'M', notes: [`Primo del abuelo de Diego Antonio. ${SOURCE}`] });
const mariaLueraTrelles = N({ name: 'María Álvarez de Luera Trelles', given: 'María Álvarez', surname: 'de Luera Trelles', sex: 'F', notes: [`Tía de la madre de Diego Antonio (Ana Méndez Infanzón Trelles). ${SOURCE}`] });
const alonsoGarciaTrelles = N({ name: 'Alonso García Infanzón y Trelles', given: 'Alonso', surname: 'García Infanzón y Trelles', sex: 'M', notes: [`Primo de la madre de Diego Antonio (Ana Méndez Infanzón Trelles). ${SOURCE}`] });

tree.individuals.push(...newPeople);
byId = new Map(tree.individuals.map((p) => [p.id, p]));

// ===== Familias =====
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

// F-B: Diego Antonio + Felipa -> añadir 3 hijos (José Francisco ya está)
const famDiegoAntonio = tree.families.find((f) => f.id === '@F500064@');
famDiegoAntonio.children.push(juanAntonio, mariaFrancisca, mariaRosa);
for (const cid of [juanAntonio, mariaFrancisca, mariaRosa]) byId.get(cid).familyChild = famDiegoAntonio.id;

// F-A: Diego + Ana -> añadir hermano Francisco Antonio
const famDiegoAna = tree.families.find((f) => f.id === '@F500066@');
famDiegoAna.children.push(franciscoAntonio);
byId.get(franciscoAntonio).familyChild = famDiegoAna.id;

// F-C: Diego Sánchez de Ron Vázquez + Magdalena -> Salvador (padres de @I500158@)
const famVazquez = addFamily(diegoVazquez, magdalena, ['@I500158@']);
byId.get('@I500158@').familyChild = famVazquez.id;

// F-D: [desconocido] + María Vázquez -> Diego Sánchez de Ron Vázquez
const famMariaVazquez = addFamily(null, mariaVazquez, [diegoVazquez]);

// F-E: Alonso Méndez-Trelles + Isabel -> Alonso Fernández (@I500160@) y sus hermanos
const famMendezTrelles = addFamily(alonsoMendezTrelles, isabelVillaiz, ['@I500160@', juanGarciaFernandez, domingoGarciaFernandez, anaMendezFernandez, mariaMendezFernandez, franciscoGarciaFernandez]);
byId.get('@I500160@').familyChild = famMendezTrelles.id;

// F-F: reestructurar F500082 (Juan "el viejo" + María Méndez-Trelles -> hijos Méndez-Trelles)
const juanViejo = byId.get('@I500203@');
juanViejo.name = 'Juan "el viejo" García-Infanzón y de la Vega';
juanViejo.given = 'Juan "el viejo"';
juanViejo.surname = 'García-Infanzón y de la Vega';
const famJuanViejo = tree.families.find((f) => f.id === '@F500082@');
famJuanViejo.wife = mariaMendezTrelles;
famJuanViejo.children = [alonsoMendezTrelles, lopeGarciaMendez, mariaGarciaMendez, franciscaGarciaMendez, '@I500204@', '@I500205@'];
byId.get('@I500204@').name = 'Juan García-Infanzón Méndez-Trelles';
byId.get('@I500204@').surname = 'García-Infanzón Méndez-Trelles';
byId.get('@I500205@').name = 'Miguel García-Infanzón Méndez-Trelles';
byId.get('@I500205@').surname = 'García-Infanzón Méndez-Trelles';
byId.get(alonsoMendezTrelles).familyChild = famJuanViejo.id;
byId.get(lopeGarciaMendez).familyChild = famJuanViejo.id;
byId.get(mariaGarciaMendez).familyChild = famJuanViejo.id;
byId.get(franciscaGarciaMendez).familyChild = famJuanViejo.id;
byId.get(mariaMendezTrelles).familySpouse.push(famJuanViejo.id);

// F-G: Roque + Juana Canzio -> primos Canzio
addFamily(roqueSanchezRon, juanaCanzio, [phelipaCanzio, rosaCanzio, nicolasCanzio, roqueAgustinoCanzio, josephYgnacioCanzio, franciscoBernardoCanzio]);

// Roque, hermano de Diego @I500156@ (hijo de Salvador + Dominga)
const famSalvador = tree.families.find((f) => f.id === '@F500067@');
famSalvador.children.push(roqueSanchezRon);
byId.get(roqueSanchezRon).familyChild = famSalvador.id;

// F-H: Amaro Rejo, esposo de Phelipa Bernarda
addFamily(amaroRejo, phelipaCanzio, []);

// F-I: Bartolomé, hermano de Alonso Méndez-Trelles (hijo de Juan el viejo)
famJuanViejo.children.push(bartolome);
byId.get(bartolome).familyChild = famJuanViejo.id;

// Ancestros profundos: Lucas Fernández Infanzón (@I500265@) + María Alfonso de la Vega -> Juan "el viejo"
const lucas = byId.get('@I500265@');
lucas.name = 'Lucas Fernández Infanzón';
lucas.given = 'Lucas';
lucas.surname = 'Fernández Infanzón';
addNote('@I500265@', `Ancestro directo (5 generaciones) de Diego Antonio. ${SOURCE}`);
const famLucas = addFamily('@I500265@', mariaAlfonsoVega, ['@I500203@']);
byId.get('@I500203@').familyChild = famLucas.id;

// Gonzalo García Infanzón + Balesquida -> Lucas Fernández Infanzón
const famGonzalo = addFamily(gonzaloGarcia, balesquida, ['@I500265@']);
byId.get('@I500265@').familyChild = famGonzalo.id;

// Parientes de la Vega / Sierra -> hijos de Juan "el viejo" (generación del abuelo)
for (const cid of [mariaAlfonsoGarciaVega, alonsoLopezVega, leonorSierra, alvaroInfanzon, miguelGarciaSierra, juanInfanzon, mariaLueraTrelles, alonsoGarciaTrelles]) {
  famJuanViejo.children.push(cid);
  byId.get(cid).familyChild = famJuanViejo.id;
}

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
console.log(JSON.stringify({ added: newPeople.length, families: tree.stats.families, individuals: tree.stats.individuals }));
