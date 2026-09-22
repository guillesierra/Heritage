import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'dist', 'data.js'), 'utf8'), dataContext);
const researchContext = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'dist', 'research.js'), 'utf8'), researchContext);
const appSource = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
const start = appSource.indexOf('  const tree = window.TREE_DATA;');
const end = appSource.indexOf('\n  function connectorMarkup()');
if (start < 0 || end < 0) throw new Error('No se pudo localizar el motor de disposición del árbol.');

const context = {
  window: {
    TREE_DATA: dataContext.window.TREE_DATA,
    RESEARCH_DATA: researchContext.window.RESEARCH_DATA,
  },
  localStorage: { getItem: () => null },
  document: { querySelector: () => null, querySelectorAll: () => [] },
};
vm.runInNewContext(`${appSource.slice(start, end)}\nthis.posterLayout = buildLayout();`, context);
const layout = context.posterLayout;
const output = {
  width: layout.width,
  height: layout.height,
  nodeWidth: layout.nodeWidth,
  nodeHeight: layout.nodeHeight,
  bands: layout.bands,
  positions: Object.fromEntries(layout.positions),
  people: dataContext.window.TREE_DATA.individuals,
  families: dataContext.window.TREE_DATA.families,
};

const outputDir = path.join(root, 'tmp', 'pdfs');
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, 'poster-layout.json');
fs.writeFileSync(outputPath, JSON.stringify(output), 'utf8');
console.log(JSON.stringify({ outputPath, width: layout.width, height: layout.height, people: output.people.length, families: output.families.length }));
