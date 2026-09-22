import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const byId = new Map(tree.individuals.map((p) => [p.id, p]));

const isRealDate = (p) => {
  const d = String(p.birth && p.birth.date || '');
  return !!d && !/ABT|BET|AFT|BEF/i.test(d);
};
const yearOf = (p) => {
  if (Number.isFinite(p.birthYear)) return p.birthYear;
  const m = String(p.birth && p.birth.date || '').match(/(1[0-9]{3}|20[0-9]{2})/);
  return m ? +m[1] : null;
};
// hijo -> [padres]
const parents = new Map();
for (const f of tree.families) for (const c of f.children) parents.set(c, [f.husband, f.wife].filter(Boolean));
// hijos (para recorrer descendientes)
const childMap = new Map();
for (const f of tree.families) {
  for (const par of [f.husband, f.wife].filter(Boolean)) {
    for (const c of f.children) {
      if (!childMap.has(par)) childMap.set(par, []);
      childMap.get(par).push(c);
    }
  }
}

// Quita estimaciones "ABT YYYY" (sin lugar) inconsistentes con fechas reales:
//  - la estimación no puede quedar después de un descendiente con fecha real
//    (padre estimado nacido después de su hijo real), ni
//  - antes de un ancestro con fecha real (hijo estimado nacido antes de su padre real).
let removed = 0;
for (const p of tree.individuals) {
  const d = String(p.birth && p.birth.date || '');
  if (!/^ABT \d{4}$/.test(d)) continue;
  if (p.birth && p.birth.place) continue;
  const est = yearOf(p);
  if (est == null) continue;

  let inconsistent = false;

  // Descendientes con fecha real: la estimación debe ser al menos 12 años anterior.
  {
    const queue = [p.id];
    const seen = new Set();
    while (queue.length && !inconsistent) {
      const cur = queue.shift();
      if (seen.has(cur)) continue;
      seen.add(cur);
      for (const cid of childMap.get(cur) || []) {
        const c = byId.get(cid);
        if (!c) continue;
        if (isRealDate(c)) {
          const cy = yearOf(c);
          if (cy != null && est > cy - 12) { inconsistent = true; break; }
        }
        queue.push(cid);
      }
    }
  }

  // Ancestros con fecha real: la estimación debe ser al menos 12 años posterior.
  if (!inconsistent) {
    const stack = [p.id];
    const seen = new Set();
    while (stack.length && !inconsistent) {
      const cur = stack.pop();
      if (seen.has(cur)) continue;
      seen.add(cur);
      for (const pid of parents.get(cur) || []) {
        const par = byId.get(pid);
        if (!par) continue;
        if (isRealDate(par)) {
          const py = yearOf(par);
          if (py != null && est < py + 12) { inconsistent = true; break; }
        }
        stack.push(pid);
      }
    }
  }

  if (inconsistent) {
    p.birth.date = null;
    p.birthYear = null;
    if (p.birth && !p.birth.place) p.birth = null;
    removed++;
    console.log('Limpieza:', p.name, '(estimación quitada)');
  }
}

tree.stats.knownBirthDates = tree.individuals.filter((person) => person.birth?.date).length;
tree.generatedAt = new Date().toISOString();
fs.writeFileSync(sourcePath, `${JSON.stringify(tree, null, 2)}\n`, 'utf8');
fs.writeFileSync(sitePath, `window.TREE_DATA = ${JSON.stringify(tree, null, 2)};\n`, 'utf8');
console.log(JSON.stringify({ removed, knownBirthDates: tree.stats.knownBirthDates }));
