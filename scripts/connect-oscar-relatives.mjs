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

// 1) Primos del padre -> hijos del tío abuelo Francisco González de Oneta
const franciscoOneta = findId('Francisco González de Oneta');
for (const nombre of ['Domingo González de Oneta', 'Pedro González de Oneta', 'Antonio González de Oneta']) {
  const id = findId(nombre);
  if (id) { byId.get(id).familyChild = null; addFamily(franciscoOneta, null, [id]); }
}

// 2) Primo del padre (Fernández-Chambergo) -> hijo del tío abuelo José Fernández-Chambergo
const joseChambergo = findId('José Fernández-Chambergo Fernández');
const cayetano = findId('José Antonio Cayetano Fernández-Chambergo');
if (cayetano && joseChambergo) addFamily(joseChambergo, null, [cayetano]);

// 3) Tía del padre -> esposa del tío abuelo Francisco
const josefaLovera = findId('Josefa Fernández-Lovera Fernández-Barreras');
if (josefaLovera && franciscoOneta) { addFamily(franciscoOneta, josefaLovera, []); byId.get(josefaLovera).notes.push('Colocación aproximada (esposa de un tío abuelo).'); }

// 4) Resto (Méndez y otros) -> agrupar bajo un antepasado Méndez enlazado a María Méndez (tatarabuela)
const mariaMendez = byId.get('@I500379@');
const restantes = [
  'Marcelino "Marcelo" Méndez Pérez', 'Constantina Méndez Pérez', 'Dominadora Méndez Pérez', 'Nemesio Méndez Pérez', 'Basilisa Méndez Pérez',
  'José Méndez del Campón', 'Juan Méndez del Campón González', 'Víctor Manuel Méndez Méndez', 'Nicolasa Méndez Méndez',
  'Nicolasa Pérez y Cancio', 'José Antonio Fernández-Pico Pérez', 'María Josefa Pérez-Villamil García',
  'Rosa María González Fernández', 'Josefa Méndez',
];
const idsRestantes = restantes.map(findId).filter(Boolean);
if (idsRestantes.length && mariaMendez) {
  // Familia con un progenitor desconocido (hermano de María Méndez) para agruparlos
  const fam = addFamily(null, mariaMendez, idsRestantes);
  for (const id of idsRestantes) byId.get(id).familyChild = fam.id;
  for (const id of idsRestantes) {
    const n = (byId.get(id).notes || []).find((x) => x.includes('grado') || x.includes('primo') || x.includes('Primo'));
    if (n) byId.get(id).notes.push('Colocación aproximada (parentesco lejano por la rama Méndez).');
  }
}

tree.stats.families = tree.families.length;
tree.generatedAt = new Date().toISOString();
fs.writeFileSync(sourcePath, `${JSON.stringify(tree, null, 2)}\n`, 'utf8');
fs.writeFileSync(sitePath, `window.TREE_DATA = ${JSON.stringify(tree, null, 2)};\n`, 'utf8');
console.log(JSON.stringify({ individuals: tree.stats.individuals, families: tree.stats.families }));
