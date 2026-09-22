import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const lowercaseWords = new Set(['a', 'al', 'da', 'das', 'de', 'del', 'do', 'dos', 'e', 'el', 'la', 'las', 'los', 'por', 'y']);

const accentMap = new Map([
  ['perez', 'Pérez'], ['pelaez', 'Peláez'], ['gonzalez', 'González'], ['rodriguez', 'Rodríguez'],
  ['sanchez', 'Sánchez'], ['martinez', 'Martínez'], ['maillo', 'Maíllo'], ['martin', 'Martín'],
  ['mendez', 'Méndez'], ['diaz', 'Díaz'], ['lopez', 'López'], ['gutierrez', 'Gutiérrez'],
  ['estebanez', 'Estébanez'], ['fernandez', 'Fernández'], ['garcia', 'García'], ['iglesias', 'Iglesias'],
  ['ordonez', 'Ordóñez'], ['suarez', 'Suárez'], ['jimenez', 'Jiménez'], ['jose', 'José'],
  ['maria', 'María'], ['jesus', 'Jesús'], ['sebastian', 'Sebastián'], ['valentin', 'Valentín'],
  ['ramon', 'Ramón'], ['catalina', 'Catalina'], ['angel', 'Ángel'], ['victor', 'Víctor'],
  ['nicolas', 'Nicolás'], ['jeronimo', 'Jerónimo'], ['jeronima', 'Jerónima'],
]);

const stripAccents = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const preserveExact = new Set(['Nombre desconocido', 'Soeur et père à confirmer', 'Comunidad autónoma por confirmar']);

const smartTitleCase = (value = '', lowerInitialParticle = false) => {
  const text = String(value).trim();
  if (!text || preserveExact.has(text)) return text;
  const quoted = [];
  const protectedText = text.replace(/“[^”]*”|"[^"]*"|«[^»]*»/g, (match) => {
    quoted.push(match);
    return `\u0000${quoted.length - 1}\u0000`;
  });
  const cased = protectedText.split(/(\s+|-)/).map((part, index) => {
    if (!part || /^(\s+|-)$/.test(part)) return part;
    if (part.startsWith('\u0000')) return part;
    const lower = part.toLocaleLowerCase('es-ES');
    const key = stripAccents(lower);
    if (accentMap.has(key)) return accentMap.get(key);
    if ((index > 0 || lowerInitialParticle) && lowercaseWords.has(key)) return lower;
    return lower.charAt(0).toLocaleUpperCase('es-ES') + lower.slice(1);
  }).join('');
  return cased.replace(/\u0000(\d+)\u0000/g, (_, index) => quoted[Number(index)]);
};

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const byId = new Map(tree.individuals.map((person) => [person.id, person]));
let changed = 0;

for (const person of tree.individuals) {
  const given = person.given == null ? null : smartTitleCase(person.given);
  const surname = person.surname == null ? null : smartTitleCase(person.surname, true);
  if (given !== person.given) { person.given = given; changed += 1; }
  if (surname !== person.surname) { person.surname = surname; changed += 1; }
  if (given || surname) {
    const name = [given, surname].filter(Boolean).join(' ');
    if (name !== person.name) { person.name = name; changed += 1; }
  } else if (person.name != null) {
    const name = smartTitleCase(person.name);
    if (name !== person.name) { person.name = name; changed += 1; }
  }
  if (person.id === '@I500013@') {
    person.birth = { ...(person.birth || {}), date: '2000' };
    person.birthYear = 2000;
    changed += 1;
  }
  if (person.id === '@I500255@') {
    person.birth = person.birth ? { ...person.birth, date: null } : null;
    person.birthYear = null;
    person.death = { ...(person.death || {}), date: '1385', place: 'Aljubarrota, Portugal' };
    person.deathYear = 1385;
    changed += 1;
  }
  if (['@I500255@', '@I500256@', '@I500257@', '@I500258@', '@I500259@', '@I500260@', '@I500219@', '@I500208@', '@I500212@'].includes(person.id) && person.living) {
    person.living = false;
    changed += 1;
  }
  for (const eventName of ['birth', 'death']) {
    const event = person[eventName];
    if (!event?.place) continue;
    const fixed = event.place.split(',').map((part) => smartTitleCase(part)).join(', ');
    if (fixed !== event.place) {
      event.place = fixed;
      changed += 1;
    }
  }
}

for (const family of tree.families) {
  for (const eventName of ['marriage', 'divorce']) {
    const event = family[eventName];
    if (!event?.place) continue;
    const fixed = event.place.split(',').map((part) => smartTitleCase(part)).join(', ');
    if (fixed !== event.place) {
      event.place = fixed;
      changed += 1;
    }
  }
}

const before = tree.findings.length;
tree.findings = tree.findings.filter((finding) => !(finding.type === 'missing-birth' && finding.personId === '@I500013@'));
if (tree.findings.length !== before) changed += 1;

for (const finding of tree.findings) {
  if (finding.type === 'missing-birth' && finding.personId && byId.has(finding.personId)) {
    const fixed = `Falta la fecha de nacimiento de ${byId.get(finding.personId).name}`;
    if (fixed !== finding.message) {
      finding.message = fixed;
      changed += 1;
    }
  }
}

for (const group of tree.duplicateGroups) {
  for (const entry of group) {
    if (!entry.name) continue;
    const fixed = smartTitleCase(entry.name);
    if (fixed !== entry.name) {
      entry.name = fixed;
      changed += 1;
    }
  }
}

tree.stats = {
  ...tree.stats,
  individuals: tree.individuals.length,
  families: tree.families.length,
  peopleWithPhotos: tree.individuals.filter((person) => person.localPhoto).length,
  knownBirthDates: tree.individuals.filter((person) => person.birth?.date).length,
  knownDeathDates: tree.individuals.filter((person) => person.death?.date).length,
  livingEstimate: tree.individuals.filter((person) => person.living).length,
  sourceLinkedPeople: tree.individuals.filter((person) => person.sourceRefs?.length).length,
};

fs.writeFileSync(sourcePath, `${JSON.stringify(tree, null, 2)}\n`, 'utf8');
fs.writeFileSync(sitePath, `window.TREE_DATA = ${JSON.stringify(tree, null, 2)};\n`, 'utf8');
console.log(JSON.stringify({ changed }));
