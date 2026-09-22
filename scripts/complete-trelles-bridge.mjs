import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');
const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const people = new Map(tree.individuals.map((person) => [person.id, person]));

const update = (id, values) => Object.assign(people.get(id), values);
const addNote = (id, note) => {
  const person = people.get(id);
  person.notes ??= [];
  if (!person.notes.includes(note)) person.notes.push(note);
};

update('@I500255@', {
  birth: { date: 'ABT 1355', place: 'Trelles, Principado de Asturias, España' },
  birthYear: 1355,
  living: false,
});
addNote('@I500255@', 'Nacimiento aproximado calculado por Gonzalo Anes al suponer unos treinta años en 1385; tradición no documentada.');

update('@I500256@', {
  birth: { date: 'ABT 1380', place: 'Trelles, Principado de Asturias, España' },
  birthYear: 1380,
  living: false,
});
addNote('@I500256@', 'Nacimiento aproximado propuesto por Gonzalo Anes; tradición no documentada.');

update('@I500257@', {
  birth: { date: 'BET 1405 AND 1420', place: 'Pumarín, Principado de Asturias, España' },
  birthYear: 1412,
  living: false,
});
addNote('@I500257@', 'Nacimiento estimado entre 1405 y 1420; matrimonio situado hipotéticamente hacia 1440.');

update('@I500258@', {
  birth: { date: 'ABT 1445', place: 'Pumarín, Principado de Asturias, España' },
  birthYear: 1445,
  living: false,
});
addNote('@I500258@', 'Nacimiento aproximado hacia 1445 según la reconstrucción crítica de Gonzalo Anes.');

update('@I500259@', {
  birth: { date: 'ABT 1455', place: 'Trelles, Principado de Asturias, España' },
  birthYear: 1455,
  living: false,
});
addNote('@I500259@', 'Fecha generacional aproximada, inferida de la cronología atribuida a su hija Teresa; confianza muy baja.');

update('@I500260@', {
  birth: { date: 'ABT 1460', place: 'Asturias, Principado de Asturias, España' },
  birthYear: 1460,
  living: false,
});
addNote('@I500260@', 'Fecha y lugar amplios inferidos de la cronología atribuida a su hija Teresa; confianza muy baja.');

update('@I500252@', {
  birth: { date: 'ABT 1450', place: 'Trelles, Principado de Asturias, España' },
  birthYear: 1450,
  living: false,
});
people.get('@I500252@').notes = [
  'TRADICIÓN: sucesor de Lope Díaz y padre atribuido de Fernando Fernández; posible identificación con el Suero del padrón de 1524, no probada.',
];

update('@I500218@', {
  birth: { date: 'ABT 1480', place: 'Pumarín, Principado de Asturias, España' },
  birthYear: 1480,
  living: false,
});
addNote('@I500218@', 'Nacimiento hipotético hacia 1480 según la reconstrucción crítica de Gonzalo Anes.');

update('@I500219@', {
  birth: { date: 'ABT 1485', place: 'Pumarín, Principado de Asturias, España' },
  birthYear: 1485,
  living: false,
});
addNote('@I500219@', 'También «Teresa Trelles del Río y Valledor»; fecha aproximada inferida del matrimonio estimado en 1505–1510.');

update('@I500208@', {
  birth: { date: 'BET 1515 AND 1520', place: 'Pumarín, Principado de Asturias, España' },
  birthYear: 1517,
  living: false,
});
addNote('@I500208@', 'Nacimiento estimado entre 1515 y 1520 por Gonzalo Anes.');

update('@I500212@', {
  birth: { date: 'ABT 1580', place: 'Pumarín, Principado de Asturias, España' },
  birthYear: 1580,
  living: false,
});
addNote('@I500212@', 'Nacimiento aproximado inferido de su matrimonio en 1605.');

update('@I500209@', {
  birth: { date: 'ABT 1530', place: 'Coaña, Principado de Asturias, España' },
  birthYear: 1530,
  living: false,
});
addNote('@I500209@', 'Nacimiento aproximado inferido del matrimonio atribuido a 1550–1560; murió antes de 1598.');

update('@I500213@', {
  birth: { date: 'ABT 1575', place: 'Meiro, Principado de Asturias, España' },
  birthYear: 1575,
  living: false,
});
addNote('@I500213@', 'Nacimiento aproximado inferido de su matrimonio con Catalina en 1605.');

const bridgeParent = '@I500252@';
const bridgeChild = '@I500218@';
let bridge = tree.families.find((family) => family.husband === bridgeParent && family.wife == null && family.children.includes(bridgeChild));
if (!bridge) {
  const maxFamily = Math.max(...tree.families.map((family) => Number(family.id.replace(/\D/g, ''))));
  bridge = {
    id: `@F${maxFamily + 1}@`,
    husband: bridgeParent,
    wife: null,
    children: [bridgeChild],
    marriage: null,
    divorce: null,
  };
  tree.families.push(bridge);
  people.get(bridgeParent).familySpouse.push(bridge.id);
}

const marriage = tree.families.find((family) => family.id === '@F500087@');
marriage.marriage = { date: 'BET 1505 AND 1510', place: 'Trelles, Principado de Asturias, España' };

tree.stats.families = tree.families.length;
tree.stats.knownBirthDates = tree.individuals.filter((person) => person.birth?.date).length;
tree.stats.livingEstimate = tree.individuals.filter((person) => person.living).length;
tree.generatedAt = new Date().toISOString();

fs.writeFileSync(sourcePath, `${JSON.stringify(tree, null, 2)}\n`, 'utf8');
fs.writeFileSync(sitePath, `window.TREE_DATA = ${JSON.stringify(tree, null, 2)};\n`, 'utf8');
console.log(JSON.stringify({ bridge: bridge.id, stats: tree.stats }));
