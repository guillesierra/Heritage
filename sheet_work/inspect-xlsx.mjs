import fs from 'node:fs/promises';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const inputPath = process.argv[2];
if (!inputPath) throw new Error('Usage: node inspect-xlsx.mjs <input.xlsx>');

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);
const summary = await workbook.inspect({
  kind: 'workbook,sheet,table,region,drawing',
  maxChars: 30000,
  tableMaxRows: 80,
  tableMaxCols: 40,
  tableMaxCellChars: 180,
});
console.log(summary.ndjson);

await fs.mkdir(new URL('./renders/', import.meta.url), { recursive: true });
for (const sheet of workbook.worksheets.items) {
  try {
    const image = await workbook.render({ sheetName: sheet.name, autoCrop: 'all', scale: 1, format: 'png' });
    const safeName = sheet.name.replace(/[^a-z0-9_-]+/gi, '_');
    await fs.writeFile(new URL(`./renders/${safeName}.png`, import.meta.url), new Uint8Array(await image.arrayBuffer()));
  } catch (error) {
    console.error(JSON.stringify({ renderError: sheet.name, message: String(error?.message || error) }));
  }
}
