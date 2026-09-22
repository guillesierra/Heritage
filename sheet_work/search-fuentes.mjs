import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const inputPath = 'genealogia_vigesimoquinta_pasada_mas_antiguos(1).xlsx';
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
const matches = await workbook.inspect({
  kind: 'match',
  searchTerm: '23\\.542|Universidad de Oviedo|tesis|Archivo Histórico de Asturias|1671',
  options: { useRegex: true, maxResults: 200 },
  summary: 'Fuentes de la dote de 1671',
  maxChars: 50000,
});
console.log(matches.ndjson);
