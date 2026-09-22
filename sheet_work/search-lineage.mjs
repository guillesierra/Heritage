import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const paths = process.argv.slice(2);
if (!paths.length) throw new Error('Usage: node search-lineage.mjs <input.xlsx> [...]');

for (const inputPath of paths) {
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
  const sheets = workbook.worksheets.items.map((sheet) => sheet.name);
  const matches = await workbook.inspect({
    kind: 'match',
    searchTerm: 'Trelles|Mendo|Garci|Lope|Suero|Valledor|Teresa|Catalina|D[ií]az|del R[ií]o',
    options: { useRegex: true, maxResults: 500 },
    summary: 'Coincidencias del linaje de Trelles',
    maxChars: 50000,
  });
  console.log(JSON.stringify({ inputPath, sheets }));
  console.log(matches.ndjson);
}
