import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const [inputPath, range] = process.argv.slice(2);
if (!inputPath || !range) throw new Error('Usage: node inspect-range.mjs <input.xlsx> <Sheet!A1:Z99>');
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
const result = await workbook.inspect({
  kind: 'table',
  range,
  include: 'values,formulas',
  tableMaxRows: 250,
  tableMaxCols: 30,
  tableMaxCellChars: 1200,
  maxChars: 80000,
});
console.log(result.ndjson);
