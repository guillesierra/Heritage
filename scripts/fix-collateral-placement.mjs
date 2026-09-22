import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const byId = new Map(tree.individuals.map((p) => [p.id, p]));
const nextFamilyId = (() => {
  let max = Math.max(...tree.families.map((f) => +f.id.replace(/\D/g, '')));
  return () => `@F${++max}@`;
})();

const famJuanViejo = tree.families.find((f) => f.id === '@F500082@');
const famLucas = tree.families.find((f) => f.id === '@F500138@');
const famMendezTrelles = tree.families.find((f) => f.id === '@F500135@');

// Quitar los 8 parientes colocados erróneamente como hijos de Juan "el viejo"
const mover = ['@I500367@', '@I500368@', '@I500369@', '@I500370@', '@I500371@', '@I500372@', '@I500373@', '@I500374@'];
famJuanViejo.children = famJuanViejo.children.filter((c) => !mover.includes(c));
for (const id of mover) byId.get(id).familyChild = null;

// 1) Hermanos de Juan "el viejo" (hijos de Lucas Fernández Infanzón + María Alfonso de la Vega)
for (const id of ['@I500367@', '@I500368@']) {
  famLucas.children.push(id);
  byId.get(id).familyChild = famLucas.id;
  byId.get(id).notes.push('Hermano(a) de Juan «el viejo» García-Infanzón y de la Vega.');
}

// 2) Leonor Rodríguez de Sierra: hermana de Alonso Méndez-Trelles (hija de Juan "el viejo")
famJuanViejo.children.push('@I500369@');
byId.get('@I500369@').familyChild = famJuanViejo.id;

// 3) Los "Infanzón y Sierra": hijos de Leonor Rodríguez de Sierra y un Infanzón desconocido
const famLeonor = { id: nextFamilyId(), husband: null, wife: '@I500369@', children: ['@I500370@', '@I500371@', '@I500372@'], marriage: null, divorce: null };
tree.families.push(famLeonor);
byId.get('@I500369@').familySpouse.push(famLeonor.id);
for (const id of ['@I500370@', '@I500371@', '@I500372@']) byId.get(id).familyChild = famLeonor.id;

// 4) María Álvarez de Luera Trelles: hermana de Alonso Fernández (hija de Alonso Méndez-Trelles)
famMendezTrelles.children.push('@I500373@');
byId.get('@I500373@').familyChild = famMendezTrelles.id;

// 5) Alonso García Infanzón y Trelles: generación de Ana (nieto de Alonso Méndez-Trelles).
//    Se enlaza como hijo de María Álvarez de Luera Trelles (primo de Ana) — por confirmar.
const famAlonsoTrelles = { id: nextFamilyId(), husband: null, wife: '@I500373@', children: ['@I500374@'], marriage: null, divorce: null };
tree.families.push(famAlonsoTrelles);
byId.get('@I500373@').familySpouse.push(famAlonsoTrelles.id);
byId.get('@I500374@').familyChild = famAlonsoTrelles.id;
byId.get('@I500374@').notes.push('Colocación aproximada (primo de la madre de Diego Antonio); por confirmar.');

tree.stats.families = tree.families.length;
tree.generatedAt = new Date().toISOString();

fs.writeFileSync(sourcePath, `${JSON.stringify(tree, null, 2)}\n`, 'utf8');
fs.writeFileSync(sitePath, `window.TREE_DATA = ${JSON.stringify(tree, null, 2)};\n`, 'utf8');
console.log(JSON.stringify({ families: tree.stats.families, individuals: tree.stats.individuals }));
