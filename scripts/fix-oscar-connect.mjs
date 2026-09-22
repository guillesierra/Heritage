import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const byId = new Map(tree.individuals.map((p) => [p.id, p]));

// Componentes conectados
const adj = new Map(tree.individuals.map((x) => [x.id, []]));
tree.families.forEach((f) => {
  const pars = [f.husband, f.wife].filter((id) => id && byId.has(id));
  pars.forEach((a) => pars.forEach((b) => { if (a !== b) { adj.get(a).push(b); adj.get(b).push(a); } }));
  f.children.filter((id) => byId.has(id)).forEach((c) => pars.forEach((par) => { adj.get(par).push(c); adj.get(c).push(par); }));
});
const comp = new Map();
let cid = 0;
for (const id of byId.keys()) {
  if (comp.has(id)) continue;
  const q = [id]; comp.set(id, cid);
  while (q.length) { const c = q.pop(); for (const n of adj.get(c)) if (!comp.has(n)) { comp.set(n, cid); q.push(n); } }
  cid += 1;
}
const mainComp = comp.get('@I500001@');

// Personas desconectadas del componente principal (excluyendo los 3 sueltos históricos de Trelles)
const TRELLES_SUELTOS = new Set(['@I500250@', '@I500253@', '@I500254@']);
const desconectadas = [...byId.keys()].filter((id) => comp.get(id) !== mainComp && !TRELLES_SUELTOS.has(id));

// Conectar todas bajo María Méndez (tatarabuela) como rama aproximada
const mariaMendez = '@I500379@';
if (desconectadas.length) {
  const fam = {
    id: `@F${Math.max(...tree.families.map((f) => +f.id.replace(/\D/g, ''))) + 1}@`,
    husband: null, wife: mariaMendez, children: desconectadas, marriage: null, divorce: null,
  };
  tree.families.push(fam);
  for (const id of desconectadas) {
    const p = byId.get(id);
    p.familyChild = fam.id; // forzar
    p.notes = [...(p.notes || []).filter((n) => !n.includes('Colocación aproximada')), 'Colocación aproximada (parentesco lejano por la rama Méndez).'];
  }
  byId.get(mariaMendez).familySpouse.push(fam.id);
}

tree.stats.families = tree.families.length;
tree.generatedAt = new Date().toISOString();
fs.writeFileSync(sourcePath, `${JSON.stringify(tree, null, 2)}\n`, 'utf8');
fs.writeFileSync(sitePath, `window.TREE_DATA = ${JSON.stringify(tree, null, 2)};\n`, 'utf8');
console.log(JSON.stringify({ conectadas: desconectadas.length, familias: tree.stats.families }));
