import fs from 'node:fs';

const input = process.argv[2];
if (!input) throw new Error('Usage: node scripts/parse-ged.mjs <input.ged> [output.json]');

const lines = fs.readFileSync(input, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
const records = [];
let current = null;

for (const raw of lines) {
  const match = raw.match(/^(\d+)\s+(?:(@[^@]+@)\s+)?([^\s]+)(?:\s+(.*))?$/);
  if (!match) continue;
  const [, levelText, pointer, tag, value = ''] = match;
  const level = Number(levelText);
  if (level === 0) {
    if (current) records.push(current);
    current = { pointer: pointer || null, tag, value, children: [] };
    current._stack = [current];
    continue;
  }
  if (!current) continue;
  const node = { tag, value, children: [] };
  while (current._stack.length > level) current._stack.pop();
  const parent = current._stack[level - 1] || current;
  parent.children.push(node);
  current._stack[level] = node;
  current._stack.length = level + 1;
}
if (current) records.push(current);

const child = (node, tag) => node.children.find((item) => item.tag === tag);
const children = (node, tag) => node.children.filter((item) => item.tag === tag);
const value = (node, tag) => child(node, tag)?.value || null;
const event = (node, tag) => {
  const item = child(node, tag);
  return item ? { date: value(item, 'DATE'), place: value(item, 'PLAC') } : null;
};
const cleanName = (name = '') => name.replaceAll('/', '').replace(/\s+/g, ' ').trim() || 'Nombre desconocido';
const extractYear = (text) => Number((text || '').match(/\b(1[0-9]{3}|20[0-9]{2})\b/)?.[1]) || null;

const individuals = records.filter((record) => record.tag === 'INDI').map((record) => {
  const birth = event(record, 'BIRT');
  const death = event(record, 'DEAT');
  const birthYear = extractYear(birth?.date);
  const deathYear = extractYear(death?.date);
  const id = record.pointer;
  const mediaItems = children(record, 'OBJE').filter((item) => value(item, 'FILE'));
  return {
    id,
    name: cleanName(value(record, 'NAME')),
    given: value(child(record, 'NAME') || { children: [] }, 'GIVN'),
    surname: value(child(record, 'NAME') || { children: [] }, 'SURN'),
    sex: value(record, 'SEX'),
    birth,
    death,
    birthYear,
    deathYear,
    living: !death && (!birthYear || birthYear >= 1926),
    occupations: children(record, 'OCCU').map((item) => ({ value: item.value, date: value(item, 'DATE'), place: value(item, 'PLAC') })),
    notes: children(record, 'NOTE').map((item) => item.value).filter(Boolean),
    familyChild: value(record, 'FAMC'),
    familySpouse: children(record, 'FAMS').map((item) => item.value),
    sourceRefs: children(record, 'SOUR').map((item) => item.value).filter(Boolean),
    media: mediaItems.map((item) => ({ title: value(item, 'TITL'), primary: value(item, '_PRIM') === 'Y' })),
    localPhoto: mediaItems.length ? `assets/photos/${id.replaceAll('@', '')}.jpg` : null,
  };
});

const families = records.filter((record) => record.tag === 'FAM').map((record) => ({
  id: record.pointer,
  husband: value(record, 'HUSB'),
  wife: value(record, 'WIFE'),
  children: children(record, 'CHIL').map((item) => item.value),
  marriage: event(record, 'MARR'),
  divorce: event(record, 'DIV'),
}));

const byId = Object.fromEntries(individuals.map((person) => [person.id, person]));
const findings = [];
const firstYear = extractYear;

for (const family of families) {
  const parents = [byId[family.husband], byId[family.wife]].filter(Boolean);
  for (const childId of family.children) {
    const childPerson = byId[childId];
    if (!childPerson) {
      findings.push({ severity: 'error', type: 'missing-reference', message: `${family.id} referencia al hijo inexistente ${childId}` });
      continue;
    }
    const childYear = firstYear(childPerson.birth?.date);
    for (const parent of parents) {
      const parentYear = firstYear(parent.birth?.date);
      if (parentYear && childYear) {
        const age = childYear - parentYear;
        if (age < 12 || age > 70) findings.push({ severity: age < 10 || age > 85 ? 'error' : 'warning', type: 'parent-age', personId: childPerson.id, relatedId: parent.id, message: `${parent.name} tendría ${age} años al nacer ${childPerson.name}` });
      }
    }
  }
}

for (const person of individuals) {
  const birthYear = firstYear(person.birth?.date);
  const deathYear = firstYear(person.death?.date);
  if (birthYear && deathYear && deathYear < birthYear) findings.push({ severity: 'error', type: 'chronology', personId: person.id, message: `La defunción de ${person.name} precede a su nacimiento` });
  if (!person.birth?.date) findings.push({ severity: 'info', type: 'missing-birth', personId: person.id, message: `Falta la fecha de nacimiento de ${person.name}` });
  if (person.name === 'Nombre desconocido' || !person.surname) findings.push({ severity: 'info', type: 'incomplete-name', personId: person.id, message: `Nombre incompleto en ${person.id}` });
}

const duplicateGroups = Object.entries(individuals.reduce((acc, person) => {
  const key = person.name.toLocaleLowerCase('es').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]/g, '');
  if (key) (acc[key] ||= []).push(person);
  return acc;
}, {})).filter(([, group]) => group.length > 1).map(([, group]) => group.map((person) => ({ id: person.id, name: person.name, birth: person.birth })));

const result = {
  generatedAt: new Date().toISOString(),
  stats: {
    individuals: individuals.length,
    families: families.length,
    photos: individuals.reduce((sum, person) => sum + person.media.length, 0),
    peopleWithPhotos: individuals.filter((person) => person.media.length).length,
    knownBirthDates: individuals.filter((person) => person.birth?.date).length,
    knownDeathDates: individuals.filter((person) => person.death?.date).length,
    livingEstimate: individuals.filter((person) => person.living).length,
    sourceLinkedPeople: individuals.filter((person) => person.sourceRefs.length).length,
  },
  individuals,
  families,
  findings,
  duplicateGroups,
};

const json = JSON.stringify(result, null, 2);
if (process.argv[3]) fs.writeFileSync(process.argv[3], process.argv[3].endsWith('.js') ? `window.TREE_DATA = ${json};\n` : json);
else process.stdout.write(json);
