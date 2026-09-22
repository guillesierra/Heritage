import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'data', 'tree.json');
const sitePath = path.join(root, 'dist', 'data.js');

const tree = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
let byId = new Map(tree.individuals.map((person) => [person.id, person]));
const nextId = (() => {
  let max = 0;
  for (const person of tree.individuals) max = Math.max(max, +person.id.replace(/\D/g, ''));
  let n = max + 1;
  return () => `@I${n++}@`;
})();
const nextFamilyId = (() => {
  let max = 0;
  for (const family of tree.families) max = Math.max(max, +family.id.replace(/\D/g, ''));
  let n = max + 1;
  return () => `@F${n++}@`;
})();

const A = (place) => `${place}, Principado de Asturias, España`;
const M = (place) => `${place}, Comunidad de Madrid, España`;

// Corrección Santiago Martínez García: defunción 27/05/2024 (esquela El Comercio)
const santiago = byId.get('@I500007@');
santiago.death.date = '27 MAY 2024';

// [workbookId, name, given, surname, sex, birthDate, birthPlace, deathDate, deathPlace, birthYear, deathYear, note]
const raw = [
  [73, 'Leonor Suárez Trelles y Villamil', 'Leonor', 'Suárez Trelles y Villamil', 'F', null, null, null, null, null, null, 'Esposa de Alonso García-Infanzón (dote de 1671).'],
  [74, 'Juan García Infanzón', 'Juan', 'García Infanzón', 'M', null, A('Coaña'), null, null, null, null, 'Probanza de 1627 con sus hijos Juan, Miguel y Alonso.'],
  [75, 'Juan García Infanzón', 'Juan', 'García Infanzón', 'M', null, A('Coaña'), null, null, null, null, 'Hermano de Miguel y Alonso.'],
  [76, 'Miguel García Infanzón', 'Miguel', 'García Infanzón', 'M', null, A('Coaña'), null, null, null, null, 'Hermano de Juan y Alonso.'],
  [77, 'Pelayo Antonio Méndez Trelles', 'Pelayo Antonio', 'Méndez Trelles', 'M', null, A('Villacondide'), null, null, null, null, 'Padre del homónimo; patrono de las Pías Memorias de Villacondide.'],
  [78, 'Pelayo Antonio Méndez Trelles', 'Pelayo Antonio', 'Méndez Trelles', 'M', null, A('Villacondide'), null, null, null, null, 'Hijo homónimo «menor»; padrón de Villacondide de 1780.'],
  [79, 'Suero González de Trelles', 'Suero', 'González de Trelles', 'M', 'BET 1515 AND 1520', A('Pumarín'), 'BEF 1610', null, 1517, 1610, 'Nacimiento estimado entre 1515 y 1520 por Gonzalo Anes; natural de Pumarín.'],
  [80, 'María Alfonso Infanzón', 'María Alfonso', 'Infanzón', 'F', 'ABT 1530', A('Coaña'), 'BEF 1598', null, 1530, 1598, 'Nacimiento aproximado inferido del matrimonio atribuido a 1550–1560; hija de Lucas Fernández Infanzón y María Alfonso.'],
  [81, 'Lucas Fernández Infanzón', 'Lucas', 'Fernández Infanzón', 'M', null, A('Coaña'), null, null, null, null, null],
  [82, 'María Alfonso', 'María', 'Alfonso', 'F', null, A('Coaña'), null, null, null, null, null],
  [83, 'Catalina Suárez de Trelles Infanzón', 'Catalina', 'Suárez de Trelles Infanzón', 'F', 'ABT 1580', A('Pumarín'), null, null, 1580, null, 'Nacimiento aproximado inferido de su matrimonio en 1605; casó en Villacondide con Gonzalo Méndez de Coaña.'],
  [84, 'Gonzalo Méndez de Coaña', 'Gonzalo', 'Méndez de Coaña', 'M', 'ABT 1575', A('Meiro'), null, null, 1575, null, 'Nacimiento aproximado inferido de su matrimonio con Catalina en 1605.'],
  [85, 'Lope Suárez de Trelles Coaña y Villamil', 'Lope', 'Suárez de Trelles Coaña y Villamil', 'M', '12 APR 1612', A('Serandinas'), null, null, 1612, null, 'Bautizado en Villacondide; natural de Serandinas.'],
  [86, 'Benito Trelles Coaña y Villamil', 'Benito', 'Trelles Coaña y Villamil', 'M', '4 APR 1613', A('Serandinas'), '7 NOV 1682', M('Madrid'), 1613, 1682, 'Fallecido en Madrid.'],
  [87, 'Lope Suárez de Meiro', 'Lope', 'Suárez de Meiro', 'M', null, A('Serandinas'), null, null, null, null, 'Natural de Serandinas.'],
  [88, 'Leonor Alfonso de Lantoira y Villamil', 'Leonor', 'Alfonso de Lantoira y Villamil', 'F', null, A('San Juan de Moldes'), null, null, null, null, 'Casa de Lantoira.'],
  [89, 'Fernando Fernández de Trelles', 'Fernando', 'Fernández de Trelles', 'M', 'ABT 1480', A('Pumarín'), null, null, 1480, null, 'Nacimiento hipotético hacia 1480 según la reconstrucción crítica de Gonzalo Anes.'],
  [90, 'Teresa Díaz de Trelles', 'Teresa', 'Díaz de Trelles', 'F', 'ABT 1485', A('Pumarín'), null, null, 1485, null, 'También «Teresa del Río» o «Teresa Trelles del Río y Valledor»; fecha aproximada inferida del matrimonio estimado en 1505–1510.'],
  [91, 'Lope Méndez de Trelles', 'Lope', 'Méndez de Trelles', 'M', null, A('Trelles'), null, null, null, null, '«El de Villar»; hipótesis como padre de Fernando.'],
  [92, 'María García de Trelles', 'María', 'García de Trelles', 'F', null, A('Trelles'), null, null, null, null, 'Madre de Fernando Fernández de Trelles.'],
  [93, 'Fernán López de Trelles', 'Fernán', 'López de Trelles', 'M', null, A('Trelles'), null, null, null, null, '«De Villar/Villarín»; documentado 1542/1554.'],
  [94, 'Suero González de Trelles', 'Suero', 'González de Trelles', 'M', null, A('El Río'), null, null, null, null, '«Del Río», Pumarín.'],
  [95, 'María Méndez Morán de Navia', 'María', 'Méndez Morán de Navia', 'F', null, A('Navia'), null, null, null, null, 'Segunda esposa de Suero González.'],
  [96, 'García Morán de Trelles', 'García', 'Morán de Trelles', 'M', null, A('Pumarín'), '24 APR 1680', null, null, 1680, 'Sepultado en la capilla mayor de Villacondide.'],
  [97, 'María Álvarez de Trelles', 'María', 'Álvarez de Trelles', 'F', null, A('Pumarín'), null, null, null, null, null],
  [98, 'Alonso González de Trelles', 'Alonso', 'González de Trelles', 'M', null, A('Pumarín'), null, null, null, null, 'Bachiller y cura de Trelles.'],
  [99, 'Suero González de Trelles', 'Suero', 'González de Trelles', 'M', null, A('Pumarín'), null, null, null, null, 'Licenciado.'],
  [100, 'Lucas Fernández de Trelles', 'Lucas', 'Fernández de Trelles', 'M', null, A('Pumarín'), null, null, null, null, 'Presbítero.'],
  [101, 'María Alonso de Trelles', 'María', 'Alonso de Trelles', 'F', null, A('Pumarín'), null, null, null, null, 'Casó con Alonso López Infanzón.'],
  [102, 'Alonso López Infanzón', 'Alonso', 'López Infanzón', 'M', '1555', A('Folgueras'), 'AFT 9 MAR 1616', null, 1555, null, 'Vecino de Folgueras.'],
  [103, 'Teresa Díaz de Trelles Infanzón', 'Teresa', 'Díaz de Trelles Infanzón', 'F', null, A('Pumarín'), null, null, null, null, null],
  [104, 'Diego Pérez de Trelles Pumarín y Navia', 'Diego', 'Pérez de Trelles Pumarín y Navia', 'M', null, A('Talarén'), null, null, null, null, 'Señor de la casa de Talarén.'],
  [105, 'Diego Rodríguez de Trelles', 'Diego', 'Rodríguez de Trelles', 'M', null, A('Trelles'), null, null, null, null, 'Hermano de Lope Méndez; padrón de 1524.'],
  [106, 'Lope Méndez de Trelles', 'Lope', 'Méndez de Trelles', 'M', null, A('Pumarín'), null, null, null, null, 'Hijo de Fernando Fernández (padrón 1584).'],
  [107, 'Juan García', 'Juan', 'García', 'M', null, A('Pumarín'), null, null, null, null, 'Hijo de Fernando Fernández (padrón 1584).'],
  [108, 'Domingo Pérez de Trelles', 'Domingo', 'Pérez de Trelles', 'M', null, A('Trelles'), null, null, null, null, null],
  [109, 'Fernando Fernández de Trelles', 'Fernando', 'Fernández de Trelles', 'M', null, A('Trelles'), null, null, null, null, 'Homónimo de su padre.'],
  [110, 'Marcos Fernández de Trelles', 'Marcos', 'Fernández de Trelles', 'M', null, A('Trelles'), null, null, null, null, null],
  [111, 'Lucas Fernández Infanzón', 'Lucas', 'Fernández Infanzón', 'M', null, A('Coaña'), null, null, null, null, 'Esposo de María Álvarez de Trelles (s. XVII).'],
  [112, 'Suero González de Trelles', 'Suero', 'González de Trelles', 'M', null, A('Pumarín'), null, null, null, null, 'Hipótesis: padre alternativo de Fernando Fernández.'],
  [113, 'Marcos González de Trelles', 'Marcos', 'González de Trelles', 'M', null, A('Trelles'), null, null, null, null, 'Clérigo y cura de Serandinas.'],
  [114, 'Diego García de Trelles', 'Diego', 'García de Trelles', 'M', null, A('Trelles'), null, null, null, null, null],
  [115, 'Gonzalo González de Trelles', 'Gonzalo', 'González de Trelles', 'M', null, A('Trelles'), null, null, null, null, 'Clérigo.'],
  [116, 'Dominga López de Trelles', 'Dominga', 'López de Trelles', 'F', null, A('Villacondide'), null, null, null, null, 'Esposa de García Morán de Trelles.'],
  [117, 'Alonso López de Trelles', 'Alonso', 'López de Trelles', 'M', null, A('Trelles'), null, null, null, null, 'Padre de Dominga.'],
  [118, 'Alonso Morán de Trelles', 'Alonso', 'Morán de Trelles', 'M', '25 FEB 1636', A('Villacondide'), '29 NOV 1697', null, 1636, 1697, null],
  [119, 'García Morán de Trelles', 'García', 'Morán de Trelles', 'M', '27 SEP 1637', A('Villacondide'), null, null, 1637, null, 'Homónimo de su padre.'],
  [120, 'María Morán de Trelles', 'María', 'Morán de Trelles', 'F', '28 APR 1639', A('Villacondide'), null, null, 1639, null, null],
  [121, 'Gómez Ares de Trelles', 'Gómez Ares', 'de Trelles', 'M', null, A('Trelles'), null, null, null, null, 'Activo 1524–1554; clérigo.'],
  [123, 'Álvaro González de Trelles', 'Álvaro', 'González de Trelles', 'M', null, A('Trelles'), null, null, null, null, 'Hijo de Suero González (padrón 1524).'],
  [124, 'Suero González de Trelles', 'Suero', 'González de Trelles', 'M', 'ABT 1450', A('Trelles'), null, null, 1450, null, 'TRADICIÓN: sucesor de Lope Díaz y padre atribuido de Fernando Fernández; posible identificación con el Suero del padrón de 1524, no probada.'],
  [127, 'Juan Alonso de Trelles', 'Juan Alonso', 'de Trelles', 'M', null, A('Trelles'), null, null, null, null, 'Hijodalgo de los solares de Luera, Riego y Tineo.'],
  [128, 'Fernando Fernández de Pumarín', 'Fernando', 'Fernández de Pumarín', 'M', null, A('Pumarín'), null, null, null, null, 'Padrón de 1554.'],
  [129, 'Diego García de Trelles', 'Diego', 'García de Trelles', 'M', 'ABT 1355', A('Trelles'), '1385', 'Aljubarrota, Portugal', 1355, 1385, 'TRADICIÓN: nacimiento calculado por Gonzalo Anes al suponer unos treinta años en 1385; muerto en Aljubarrota.'],
  [130, 'Mendo Díaz de Trelles', 'Mendo', 'Díaz de Trelles', 'M', 'ABT 1380', A('Trelles'), null, null, 1380, null, 'TRADICIÓN: nacimiento aproximado propuesto por Gonzalo Anes; padre de Garci Sánchez.'],
  [131, 'Garci Sánchez de Trelles', 'Garci', 'Sánchez de Trelles', 'M', 'BET 1405 AND 1420', A('Pumarín'), null, null, 1412, null, 'TRADICIÓN: nacimiento estimado entre 1405 y 1420; hizo solar y casa en el Castro de Pumarín.'],
  [132, 'Lope Díaz de Trelles', 'Lope', 'Díaz de Trelles', 'M', 'ABT 1445', A('Pumarín'), null, null, 1445, null, 'TRADICIÓN: nacimiento aproximado hacia 1445; padre de un Suero González.'],
  [133, 'Rodrigo Díaz de Trelles', 'Rodrigo', 'Díaz de Trelles', 'M', 'ABT 1455', A('Trelles'), null, null, 1455, null, 'TRADICIÓN: fecha generacional inferida de la cronología de Teresa; confianza muy baja.'],
  [134, 'Ana Valledor', 'Ana', 'Valledor', 'F', 'ABT 1460', A('Asturias'), null, null, 1460, null, 'TRADICIÓN: fecha y lugar amplios inferidos de la cronología de Teresa; confianza muy baja.'],
  [135, 'Teresa García de Luera y Trelles', 'Teresa', 'García de Luera y Trelles', 'F', null, A('Villacondide'), null, null, null, null, 'También Teresa Castrillón Valledor.'],
  [136, 'Francisco López de Trelles Villamil', 'Francisco', 'López de Trelles Villamil', 'M', null, A('Trelles'), null, null, null, null, null],
  [137, 'Ana López de Trelles', 'Ana', 'López de Trelles', 'F', null, A('Trelles'), null, null, null, null, null],
  [138, 'María López de Trelles', 'María', 'López de Trelles', 'F', null, A('Trelles'), '12 APR 1672', null, null, 1672, null],
  [139, 'Lucas Fernández Infanzón', 'Lucas', 'Fernández Infanzón', 'M', null, A('Coaña'), null, null, null, null, 'Hipótesis con María Alonso de la Vega.'],
  [140, 'Lope Alfonso de Pumarín', 'Lope Alfonso', 'de Pumarín', 'M', null, A('Pumarín'), null, null, null, null, 'Hipótesis: padre alternativo de Fernando Fernández.'],
  [141, 'María Méndez Trelles y Morán', 'María', 'Méndez Trelles y Morán', 'F', '4 DEC 1646', A('Villacondide'), null, null, 1646, null, 'También Álvarez Morán.'],
  [142, 'María Álvarez Morán de Trelles y Villamil', 'María Álvarez', 'Morán de Trelles y Villamil', 'F', '12 MAY 1651', A('Villacondide'), '27 JAN 1709', A('Villacondide'), 1651, 1709, null],
  [143, 'Diego Méndez de la Calzada', 'Diego', 'Méndez de la Calzada', 'M', '5 DEC 1640', A('Villacondide'), '10 APR 1711', A('Villacondide'), 1640, 1711, null],
  [144, 'Lope Méndez de la Murola', 'Lope', 'Méndez de la Murola', 'M', null, A('Villacondide'), null, null, null, null, null],
  [145, 'María Méndez', 'María', 'Méndez', 'F', null, A('Villacondide'), null, null, null, null, null],
  [146, 'Diego Méndez de Pumarín', 'Diego', 'Méndez de Pumarín', 'M', null, A('Pumarín'), null, null, null, null, null],
  [147, 'Dominga Pérez de la Calzada', 'Dominga', 'Pérez de la Calzada', 'F', null, A('Villacondide'), null, null, null, null, null],
  [148, 'Antonio Morán de Trelles', 'Antonio', 'Morán de Trelles', 'M', '10 MAR 1641', A('Villacondide'), null, null, 1641, null, null],
  [149, 'Francisco Morán de Trelles', 'Francisco', 'Morán de Trelles', 'M', '9 DEC 1642', A('Villacondide'), null, null, 1642, null, null],
  [150, 'Francisco Morán de Trelles', 'Francisco', 'Morán de Trelles', 'M', '24 MAY 1644', A('Villacondide'), null, null, 1644, null, null],
  [151, 'Antonia Morán de Trelles', 'Antonia', 'Morán de Trelles', 'F', '30 MAY 1646', A('Villacondide'), null, null, 1646, null, null],
  [152, 'Suero Morán de Trelles', 'Suero', 'Morán de Trelles', 'M', '12 APR 1657', A('Villacondide'), null, null, 1657, null, null],
  [153, 'Gonzalo Morán de Trelles', 'Gonzalo', 'Morán de Trelles', 'M', '1 MAY 1663', A('Villacondide'), null, null, 1663, null, null],
  [154, 'Catalina Álvarez Morán Trelles y Villamil', 'Catalina', 'Álvarez Morán Trelles y Villamil', 'F', null, A('Villacondide'), null, null, null, null, null],
  [155, 'Lucía López de Aguiar', 'Lucía', 'López de Aguiar', 'F', null, A('Villacondide'), '24 AUG 1700', A('Villacondide'), null, 1700, null],
  [156, 'Antonio Morán de Trelles', 'Antonio', 'Morán de Trelles', 'M', '9 JUL 1659', A('Villacondide'), null, null, 1659, null, null],
  [157, 'María Morán de Trelles', 'María', 'Morán de Trelles', 'F', '14 MAY 1662', A('Villacondide'), null, null, 1662, null, null],
  [158, 'Teresa Morán de Trelles', 'Teresa', 'Morán de Trelles', 'F', '7 DEC 1666', A('Villacondide'), null, null, 1666, null, 'Melliza de María.'],
  [159, 'María Morán de Trelles', 'María', 'Morán de Trelles', 'F', '7 DEC 1666', A('Villacondide'), null, null, 1666, null, 'Melliza de Teresa.'],
  [160, 'Francisco Morán de Trelles', 'Francisco', 'Morán de Trelles', 'M', '17 APR 1669', A('Villacondide'), null, null, 1669, null, null],
  [161, 'Fernando Antonio Morán de Trelles', 'Fernando Antonio', 'Morán de Trelles', 'M', '10 MAY 1674', A('Villacondide'), null, null, 1674, null, null],
  [162, 'Catalina Morán de Trelles', 'Catalina', 'Morán de Trelles', 'F', '16 FEB 1677', A('Villacondide'), null, null, 1677, null, null],
  [163, 'Lucía-Ana López Morán y Trelles', 'Lucía-Ana', 'López Morán y Trelles', 'F', '15 APR 1680', A('Villacondide'), '26 APR 1758', null, 1680, 1758, null],
  [164, 'Francisco Fernández del Valle', 'Francisco', 'Fernández del Valle', 'M', null, null, null, null, null, null, null],
  [165, 'Francisco del Valle y Trelles', 'Francisco', 'del Valle y Trelles', 'M', null, null, null, null, null, null, 'Cura de Navia.'],
  [166, 'Antonio Alonso San Julián y Aguiar', 'Antonio Alonso', 'San Julián y Aguiar', 'M', null, A('Campos'), null, null, null, null, null],
  [167, 'Alonso González de Coaña', 'Alonso', 'González de Coaña', 'M', null, A('Meiro'), null, null, null, null, 'Señor de la casa de Meiro.'],
  [168, 'Catalina Suárez de Trelles', 'Catalina', 'Suárez de Trelles', 'F', null, null, null, null, null, null, 'Hija de Arias de Trelles.'],
  [169, 'Arias de Trelles', 'Arias', 'de Trelles', 'M', null, null, null, null, null, null, 'También «Gómez Arias de Trelles».'],
  [170, 'Álvaro González de Coaña', 'Álvaro', 'González de Coaña', 'M', null, A('Coaña'), null, null, null, null, null],
  [171, 'Gonzalo Pérez Pico de Coaña', 'Gonzalo Pérez Pico', 'de Coaña', 'M', null, A('Coaña'), null, null, null, null, 'Extremo más antiguo documentado de la rama Coaña.'],
  [172, 'Fernando González de Trelles', 'Fernando', 'González de Trelles', 'M', null, A('Trelles'), null, null, null, null, null],
  [173, 'Juan García', 'Juan', 'García', 'M', null, A('Trelles'), null, null, null, null, 'Hijo de Suero González de Trelles.'],
  [175, 'Alonso Fernández del Valle y Trelles', 'Alonso', 'Fernández del Valle y Trelles', 'M', null, A('La Murola'), '10 JUL 1739', null, null, 1739, null],
  [176, 'María Francisca del Valle y Trelles', 'María Francisca', 'del Valle y Trelles', 'F', null, A('La Murola'), '3 MAY 1760', A('Villacondide'), null, 1760, null],
  [177, 'Juan García Infanzón y Omaña', 'Juan', 'García Infanzón y Omaña', 'M', null, A('Coaña'), 'BEF 3 JUN 1744', null, null, 1744, null],
  [178, 'Francisco-Antonio-Pablo García Infanzón y Omaña', 'Francisco-Antonio-Pablo', 'García Infanzón y Omaña', 'M', '30 JUN 1742', A('Villacondide'), 'JAN 1808', A('La Murola'), 1742, 1808, null],
  [179, 'Bernardo García del Real', 'Bernardo', 'García del Real', 'M', null, A('Trelles'), '1754', null, null, 1754, null],
  [180, 'Juan García del Real', 'Juan', 'García del Real', 'M', null, A('Trelles'), 'BEF 3 JUN 1744', null, null, 1744, null],
  [181, 'Juana Fernández', 'Juana', 'Fernández', 'F', null, A('Trelles'), 'BEF 3 JUN 1744', null, null, 1744, null],
  [182, 'Bárbara Cienfuegos', 'Bárbara', 'Cienfuegos', 'F', null, A('Villacondide'), null, null, null, null, 'Natural de Villacondide.'],
  [183, 'María Antonia Cayetana García Infanzón y Cienfuegos', 'María Antonia Cayetana', 'García Infanzón y Cienfuegos', 'F', '8 JUL 1763', A('La Murola'), null, null, 1763, null, null],
  [184, 'Francisca Bárbara García Infanzón y Cienfuegos', 'Francisca Bárbara', 'García Infanzón y Cienfuegos', 'F', '1 DEC 1765', A('La Murola'), '16 OCT 1853', A('Villacondide'), 1765, 1853, null],
  [185, 'José Francisco García Infanzón y Cienfuegos', 'José Francisco', 'García Infanzón y Cienfuegos', 'M', '22 JUN 1769', A('La Murola'), 'BEF 30 JUN 1817', null, 1769, 1817, null],
  [186, 'Alonso García Infanzón y Cienfuegos', 'Alonso', 'García Infanzón y Cienfuegos', 'M', '30 JUL 1771', A('La Murola'), null, null, 1771, null, null],
  [187, 'Diego Antonio García Infanzón y Cienfuegos', 'Diego Antonio', 'García Infanzón y Cienfuegos', 'M', '29 OCT 1774', A('La Murola'), null, null, 1774, null, null],
  [188, 'Clara García Infanzón y Cienfuegos', 'Clara', 'García Infanzón y Cienfuegos', 'F', '21 OCT 1776', A('La Murola'), '21 FEB 1847', A('Villacondide'), 1776, 1847, null],
  [189, 'Antonia María García Infanzón y Cienfuegos', 'Antonia María', 'García Infanzón y Cienfuegos', 'F', '11 FEB 1779', A('La Murola'), 'BEF JAN 1808', null, 1779, 1808, null],
  [190, 'Josefa García Infanzón y Cienfuegos', 'Josefa', 'García Infanzón y Cienfuegos', 'F', '29 MAR 1782', A('La Murola'), 'AFT JAN 1808', null, 1782, null, null],
  [191, 'María Antonia García Infanzón y Cienfuegos', 'María Antonia', 'García Infanzón y Cienfuegos', 'F', '25 FEB 1784', A('La Murola'), 'BEF JAN 1808', null, 1784, 1808, null],
  [192, 'Tomás Antonio García Infanzón y Cienfuegos', 'Tomás Antonio', 'García Infanzón y Cienfuegos', 'M', '18 OCT 1786', A('La Murola'), '20 MAR 1809', null, 1786, 1809, 'Soldado; murió luchando contra los franceses.'],
  [193, 'Francisco Rodríguez Arango', 'Francisco', 'Rodríguez Arango', 'M', null, A('Santa Eulalia de Oscos'), null, null, null, null, null],
  [194, 'Domingo Méndez Cabodevilla', 'Domingo', 'Méndez Cabodevilla', 'M', null, A('Cabodevilla'), '16 SEP 1846', A('Navia'), null, 1846, 'Falleció en el río Navia.'],
];

const wbToId = new Map();
const newIndividuals = [];
for (const [wbId, name, given, surname, sex, bDate, bPlace, dDate, dPlace, bYear, dYear, note] of raw) {
  const id = nextId();
  wbToId.set(wbId, id);
  const birth = (bDate || bPlace) ? { date: bDate, place: bPlace } : null;
  const death = (dDate || dPlace) ? { date: dDate, place: dPlace } : null;
  newIndividuals.push({
    id, name, given, surname, sex,
    birth, death,
    birthYear: bYear ?? null,
    deathYear: dYear ?? null,
    living: !death,
    occupations: [],
    notes: note ? [note] : [],
    familyChild: null,
    familySpouse: [],
    sourceRefs: [],
    media: [],
    localPhoto: null,
  });
}
tree.individuals.push(...newIndividuals);
byId = new Map(tree.individuals.map((person) => [person.id, person]));

// Familias: [husbandWb, wifeWb, childrenWb[]] (wifeWb o husbandWb pueden ser 'tree:<id>' para referirse a personas ya existentes)
const familyDefs = [
  [74, null, ['tree:@I500160@', 75, 76]],          // Juan García Infanzón + ? → Alonso (árbol), Juan, Miguel
  [77, null, ['tree:@I500154@', 78]],              // Pelayo Antonio padre → Pelayo (árbol) y Pelayo hijo
  [79, 80, [83, 98, 99, 100, 101, 103, 113, 114, 115, 172, 173]], // Suero + María Alfonso → hijos
  [79, 95, [96, 97]],                              // Suero + María Méndez Morán → García Morán, María Álvarez
  [81, 82, [80]],                                  // Lucas Fdez Infanzón + María Alfonso → María Alfonso Infanzón
  [89, 90, [79, 106, 107, 108, 109, 110]],         // Fernando Fdez + Teresa Díaz → Suero + hermanos
  [91, 92, [89]],                                  // Lope Méndez + María García → Fernando (hipótesis)
  [140, 92, [89]],                                 // Lope Alfonso + María García → Fernando (hipótesis alternativa)
  [93, null, [91]],                                // Fernán López → Lope Méndez (hipótesis)
  [94, null, [90]],                                // Suero del Río → Teresa Díaz
  [112, null, [89]],                               // Suero González (posible padre de Fernando)
  [124, null, [123]],                              // Suero González → Álvaro/Alonso (padrón 1524)
  [124, null, [89]],                               // Suero González → Fernando Fernández (tradición; puente no probado)
  [133, 134, [90]],                                // Rodrigo Díaz + Ana Valledor → Teresa del Río (tradición)
  [84, 83, [85, 86]],                              // Gonzalo Méndez + Catalina → Lope, Benito
  [87, 88, [84]],                                  // Lope Suárez de Meiro + Leonor → Gonzalo Méndez
  [167, 168, [87]],                                // Alonso González Coaña + Catalina → Lope Suárez de Meiro
  [170, null, [167]],                              // Álvaro González Coaña → Alonso
  [171, null, [170]],                              // Gonzalo Pérez Pico → Álvaro
  [169, null, [168]],                              // Arias de Trelles → Catalina (hipótesis)
  [96, 116, [118, 119, 120, 141, 142, 148, 149, 150, 151, 152, 153, 154]], // García Morán + Dominga → hijos
  [117, 135, [116, 136, 137, 138]],                // Alonso López de Trelles + Teresa → Dominga, Francisco, Ana, María
  [118, 155, [156, 157, 158, 159, 160, 161, 162, 163]], // Alonso Morán + Lucía → hijos
  [143, 142, []],                                  // Diego Méndez de la Calzada + María Álvarez Morán
  [144, 145, [143]],                               // Lope Méndez de la Murola + María Méndez → Diego
  [146, 147, [144]],                               // Diego Méndez de Pumarín + Dominga Pérez → Lope
  [101, 102, []],                                  // María Alonso de Trelles + Alonso López Infanzón
  [103, 104, []],                                  // Teresa Díaz de Trelles Infanzón + Diego Pérez
  [97, 111, []],                                   // María Álvarez de Trelles + Lucas Fdez Infanzón
  [163, 164, [165]],                               // Lucía-Ana + Francisco Fdez del Valle → Francisco
  [154, 166, []],                                  // Catalina Álvarez Morán + Antonio Alonso
  [141, 175, [176]],                               // María Méndez Trelles y Morán + Alonso Fdez del Valle → María Francisca
  [177, 176, [178]],                               // Juan García Infanzón y Omaña + María Francisca → Francisco-Antonio-Pablo
  [179, 176, []],                                  // Bernardo García del Real + María Francisca
  [180, 181, [179]],                               // Juan García del Real + Juana Fernández → Bernardo
  [178, 182, [183, 184, 185, 186, 187, 188, 189, 190, 191, 192]], // Francisco-Antonio-Pablo + Bárbara → 10 hijos
  [193, 183, []],                                  // Francisco Rodríguez Arango + María Antonia Cayetana
  [194, 184, []],                                  // Domingo Méndez Cabodevilla + Francisca Bárbara
  [129, null, [130]],                              // Diego García → Mendo (tradición)
  [130, null, [131]],                              // Mendo Díaz → Garci Sánchez (tradición)
  [131, null, [132]],                              // Garci Sánchez → Lope Díaz (tradición)
  [132, null, [124]],                              // Lope Díaz → Suero González (tradición)
  [105, null, []],                                 // Diego Rodríguez de Trelles (hermano de Lope Méndez, sin familia)
];

const resolveRef = (ref) => (String(ref).startsWith('tree:') ? ref.slice(5) : wbToId.get(ref));
const newFamilies = [];
for (const [husbandRef, wifeRef, childrenRefs] of familyDefs) {
  const husband = husbandRef == null ? null : resolveRef(husbandRef);
  const wife = wifeRef == null ? null : resolveRef(wifeRef);
  const children = childrenRefs.map(resolveRef);
  const family = { id: nextFamilyId(), husband, wife, children, marriage: null, divorce: null };
  newFamilies.push(family);
  for (const childId of children) {
    const person = byId.get(childId);
    if (person && person.familyChild == null) person.familyChild = family.id;
  }
  if (husband) { const p = byId.get(husband); if (p) p.familySpouse.push(family.id); }
  if (wife) { const p = byId.get(wife); if (p) p.familySpouse.push(family.id); }
}
tree.families.push(...newFamilies);

// Leonor Suárez Trelles y Villamil como esposa de Alonso García-Infanzón (árbol)
const leonor = byId.get(wbToId.get(73));
const alonso = byId.get('@I500160@');
const leonorFamily = { id: nextFamilyId(), husband: '@I500160@', wife: wbToId.get(73), children: [], marriage: null, divorce: null };
tree.families.push(leonorFamily);
leonor.familySpouse.push(leonorFamily.id);
alonso.familySpouse.push(leonorFamily.id);

tree.stats = {
  individuals: tree.individuals.length,
  families: tree.families.length,
  photos: tree.individuals.reduce((sum, item) => sum + item.media.length, 0),
  peopleWithPhotos: tree.individuals.filter((item) => item.media.length).length,
  knownBirthDates: tree.individuals.filter((item) => item.birth?.date).length,
  knownDeathDates: tree.individuals.filter((item) => item.death?.date).length,
  livingEstimate: tree.individuals.filter((item) => item.living).length,
  sourceLinkedPeople: tree.individuals.filter((item) => item.sourceRefs.length).length,
};

fs.writeFileSync(sourcePath, `${JSON.stringify(tree, null, 2)}\n`, 'utf8');
fs.writeFileSync(sitePath, `window.TREE_DATA = ${JSON.stringify(tree, null, 2)};\n`, 'utf8');
console.log(JSON.stringify({ added: newIndividuals.length, families: newFamilies.length + 1, stats: tree.stats }));
