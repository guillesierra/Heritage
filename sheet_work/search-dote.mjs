import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const paths = process.argv.slice(2);
for (const inputPath of paths) {
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
  const sheets = workbook.worksheets.items.map((sheet) => sheet.name);
  const matches = await workbook.inspect({
    kind: 'match',
    searchTerm: 'Alonso Garc[ií]a|Antonia|Folgueras|Leonor|dote|1671|Infanz[ió]n',
    options: { useRegex: true, maxResults: 300 },
    summary: 'Búsqueda Alonso/Antonia/Leonor/dote',
    maxChars: 60000,
  });
  console.log('=== ' + inputPath + ' ===');
  console.log('sheets:', sheets.join(', '));
  console.log(matches.ndjson);
}
