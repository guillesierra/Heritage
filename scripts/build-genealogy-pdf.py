import json
import os
from collections import defaultdict
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, PageBreak,
    LongTable, Table, TableStyle, KeepTogether
)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SOURCE = os.path.join(ROOT, 'data', 'tree.json')
OUTPUT_DIR = os.path.join(ROOT, 'output', 'pdf')
OUTPUT = os.path.join(OUTPUT_DIR, 'parentescos_arbol_genealogico.pdf')

with open(SOURCE, encoding='utf-8') as stream:
    tree = json.load(stream)

people = tree['individuals']
families = tree['families']
person_by_id = {person['id']: person for person in people}

font_regular = r'C:\Windows\Fonts\arial.ttf'
font_bold = r'C:\Windows\Fonts\arialbd.ttf'
pdfmetrics.registerFont(TTFont('GenealogySans', font_regular))
pdfmetrics.registerFont(TTFont('GenealogySans-Bold', font_bold))

PAGE = landscape(A4)
NAVY = colors.HexColor('#173A4B')
GOLD = colors.HexColor('#C18B37')
RUST = colors.HexColor('#8B3A36')
PAPER = colors.HexColor('#F7F2E8')
PALE = colors.HexColor('#E9E1D2')
MUTED = colors.HexColor('#5E7078')
WHITE = colors.white

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleGenealogy', fontName='GenealogySans-Bold', fontSize=28, leading=32, textColor=NAVY, alignment=TA_CENTER, spaceAfter=10))
styles.add(ParagraphStyle(name='SubtitleGenealogy', fontName='GenealogySans', fontSize=12, leading=16, textColor=MUTED, alignment=TA_CENTER))
styles.add(ParagraphStyle(name='H1Genealogy', fontName='GenealogySans-Bold', fontSize=18, leading=22, textColor=NAVY, spaceAfter=8))
styles.add(ParagraphStyle(name='H2Genealogy', fontName='GenealogySans-Bold', fontSize=11, leading=14, textColor=NAVY, spaceBefore=6, spaceAfter=4))
styles.add(ParagraphStyle(name='BodyGenealogy', fontName='GenealogySans', fontSize=9, leading=13, textColor=NAVY))
styles.add(ParagraphStyle(name='SmallGenealogy', fontName='GenealogySans', fontSize=7.2, leading=9.2, textColor=NAVY))
styles.add(ParagraphStyle(name='TinyGenealogy', fontName='GenealogySans', fontSize=6.2, leading=7.8, textColor=NAVY))
styles.add(ParagraphStyle(name='WarningGenealogy', fontName='GenealogySans', fontSize=8.5, leading=12, textColor=RUST, backColor=colors.HexColor('#F7E8E2'), borderPadding=7, borderColor=colors.HexColor('#E7C5BC'), borderWidth=0.5, spaceAfter=8))
styles.add(ParagraphStyle(name='WhiteSmall', fontName='GenealogySans-Bold', fontSize=7, leading=8.5, textColor=WHITE))

def safe(value):
    return str(value or '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

def table_paragraphs(rows, body_style, allow_markup=False):
    output = []
    for row_index, row in enumerate(rows):
        style = styles['WhiteSmall'] if row_index == 0 else body_style
        converted = []
        for cell in row:
            text = str(cell or '')
            if not (allow_markup and ('<font' in text or '<br/>' in text)):
                text = safe(text)
            converted.append(Paragraph(text, style))
        output.append(converted)
    return output

def person_name(person_id):
    person = person_by_id.get(person_id)
    return person['name'] if person else 'Sin registrar'

def event_year(person, key):
    year = person.get(f'{key}Year')
    if year:
        return str(year)
    date = (person.get(key) or {}).get('date')
    return str(date or '?')

def lifespan(person):
    return f"{event_year(person, 'birth')} - {event_year(person, 'death')}"

def is_traditional(person):
    return any('tradición' in str(note).lower() or 'tradicion' in str(note).lower() for note in person.get('notes', []))

def family_evidence(family):
    members = [family.get('husband'), family.get('wife'), *family.get('children', [])]
    traditional = sum(bool(pid and is_traditional(person_by_id.get(pid, {}))) for pid in members)
    if not traditional:
        return 'Datos del árbol'
    return 'Tradición' if traditional == len([pid for pid in members if pid]) else 'Mixta'

class GenealogyDoc(BaseDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == 'H1Genealogy':
            text = flowable.getPlainText()
            key = f"section-{abs(hash(text))}"
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(text, key, level=0, closed=False)

def header_footer(canvas, doc):
    canvas.saveState()
    width, height = PAGE
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setStrokeColor(colors.HexColor('#D8CEBD'))
    canvas.line(16 * mm, height - 13 * mm, width - 16 * mm, height - 13 * mm)
    canvas.setFont('GenealogySans', 7)
    canvas.setFillColor(MUTED)
    canvas.drawString(16 * mm, 8 * mm, 'Árbol genealógico familiar - resumen de parentescos')
    canvas.drawRightString(width - 16 * mm, 8 * mm, f'Página {doc.page}')
    canvas.restoreState()

doc = GenealogyDoc(
    OUTPUT,
    pagesize=PAGE,
    leftMargin=16 * mm,
    rightMargin=16 * mm,
    topMargin=18 * mm,
    bottomMargin=14 * mm,
    title='Parentescos del árbol genealógico familiar',
    author='Familia Sierra-Maíllo',
)
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='main')
doc.addPageTemplates(PageTemplate(id='genealogy', frames=[frame], onPage=header_footer))

story = []
story.extend([
    Spacer(1, 30 * mm),
    Paragraph('Árbol genealógico familiar', styles['TitleGenealogy']),
    Paragraph('Resumen condensado de personas, familias y parentescos', styles['SubtitleGenealogy']),
    Spacer(1, 10 * mm),
    Table([
        [Paragraph('<b>321</b><br/>perfiles', styles['BodyGenealogy']), Paragraph('<b>116</b><br/>familias', styles['BodyGenealogy']), Paragraph('<b>1350-2000</b><br/>marco cronológico visual', styles['BodyGenealogy'])],
    ], colWidths=[48 * mm] * 3, rowHeights=[25 * mm], style=TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#EFE7D9')),
        ('BOX', (0, 0), (-1, -1), 0.6, GOLD),
        ('INNERGRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#D8CEBD')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ])),
    Spacer(1, 12 * mm),
    Paragraph('Este documento enumera todos los parentescos registrados. Los perfiles homónimos se mantienen separados mientras no exista evidencia suficiente para fusionarlos.', styles['BodyGenealogy']),
    Spacer(1, 5 * mm),
    Paragraph('<b>Importante:</b> las relaciones medievales marcadas como «Tradición» proceden de genealogías posteriores y no equivalen a una filiación demostrada por documentos medievales primarios.', styles['WarningGenealogy']),
    PageBreak(),
])

story.append(Paragraph('Cómo leer este informe', styles['H1Genealogy']))
guide = [
    ['Sección', 'Contenido'],
    ['Línea de Trelles', 'La secuencia histórica solicitada, con los cortes documentales claramente indicados.'],
    ['Catálogo de familias', 'Una fila por unidad familiar: pareja o progenitor único y todos sus hijos registrados.'],
    ['Índice de personas', 'Localizador alfabético con años y papel en cada familia: P = progenitor/pareja; H = hijo/a.'],
    ['Perfiles aislados', 'Personas investigadas que todavía no tienen una relación familiar enlazada en el árbol.'],
]
story.append(Table(table_paragraphs(guide, styles['SmallGenealogy']), colWidths=[42 * mm, 205 * mm], repeatRows=1, style=TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    ('FONTNAME', (0, 0), (-1, 0), 'GenealogySans-Bold'), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('GRID', (0, 0), (-1, -1), 0.35, colors.HexColor('#D8CEBD')),
    ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FBF8F2')),
    ('LEFTPADDING', (0, 0), (-1, -1), 6), ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
])))
story.append(Spacer(1, 7 * mm))
story.append(Paragraph('Criterios utilizados', styles['H2Genealogy']))
for text in [
    'El total cuenta perfiles con identificador único, no personas históricas definitivamente deduplicadas.',
    'Una misma persona puede tener varias atribuciones parentales cuando las fuentes discrepan.',
    'Los años aproximados sirven para ordenar el árbol y no deben interpretarse como fechas exactas.',
    'Las variantes de apellido se conservan cuando ayudan a distinguir documentos o generaciones.',
]:
    story.append(Paragraph(f'• {safe(text)}', styles['BodyGenealogy']))
story.append(PageBreak())

story.append(Paragraph('Línea de Trelles: hechos y tradición', styles['H1Genealogy']))
trelles_rows = [
    ('Tradición muy baja', 'Diego García de Trelles (†1385)', 'Padre tradicional de Mendo Díaz.'),
    ('Tradición muy baja', 'Mendo Díaz de Trelles', 'Padre tradicional de Garci Sánchez.'),
    ('Tradición muy baja', 'Garci Sánchez de Trelles', 'Padre tradicional de Lope Díaz.'),
    ('Tradición muy baja', 'Lope Díaz de Trelles', 'Padre tradicional de un Suero González.'),
    ('Puente pendiente', 'Varias generaciones de la casa de Trelles', 'No se ha probado una continuidad hasta Rodrigo Díaz.'),
    ('Tradición baja-media', 'Rodrigo Díaz de Trelles + Ana Valledor', 'Padres tradicionales de Teresa Díaz / Teresa del Río.'),
    ('Tradición y fuentes posteriores', 'Teresa Díaz de Trelles («Teresa del Río»)', 'Esposa de Fernando Fernández; madre de Suero González.'),
    ('Documentación moderna más sólida', 'Suero González de Trelles + María Alfonso Infanzón', 'Padres de Catalina y de otros hijos registrados.'),
    ('Documentada', 'Catalina Suárez de Trelles Infanzón', 'Casó en 1605 con Gonzalo Méndez de Coaña.'),
]
data = [['Evidencia', 'Persona o pareja', 'Relación']] + trelles_rows
story.append(LongTable(table_paragraphs(data, styles['SmallGenealogy']), colWidths=[46 * mm, 82 * mm, 119 * mm], repeatRows=1, style=TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    ('FONTNAME', (0, 0), (-1, 0), 'GenealogySans-Bold'), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('GRID', (0, 0), (-1, -1), 0.35, colors.HexColor('#D8CEBD')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FBF8F2'), colors.HexColor('#F3EBDD')]),
    ('TEXTCOLOR', (0, 1), (0, 6), RUST),
    ('LEFTPADDING', (0, 0), (-1, -1), 5), ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
])))
story.append(Spacer(1, 6 * mm))
story.append(Paragraph('La línea medieval se muestra porque forma parte de la tradición familiar, pero el informe no dibuja como probado el puente que falta entre Lope Díaz y Rodrigo Díaz.', styles['WarningGenealogy']))
story.append(PageBreak())

story.append(Paragraph('Catálogo completo de familias', styles['H1Genealogy']))
story.append(Paragraph('Cada fila contiene todas las relaciones progenitor-hijo y las parejas registradas en una familia.', styles['BodyGenealogy']))
story.append(Spacer(1, 3 * mm))
family_rows = [['ID', 'Progenitor o pareja 1', 'Progenitor o pareja 2', 'Hijos registrados', 'Evidencia']]
for family in families:
    children = family.get('children', [])
    child_text = '<br/>'.join(f"{safe(person_name(child))} <font color='#66777E'>[{safe(child)}]</font>" for child in children) or 'Sin hijos registrados'
    family_rows.append([
        family['id'].strip('@'),
        person_name(family.get('husband')) if family.get('husband') else 'No registrado',
        person_name(family.get('wife')) if family.get('wife') else 'No registrada',
        child_text,
        family_evidence(family),
    ])
family_table = LongTable(table_paragraphs(family_rows, styles['TinyGenealogy'], allow_markup=True), colWidths=[21 * mm, 54 * mm, 54 * mm, 91 * mm, 27 * mm], repeatRows=1, splitByRow=1, style=TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    ('FONTNAME', (0, 0), (-1, 0), 'GenealogySans-Bold'), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#D8CEBD')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F0E7')]),
    ('LEFTPADDING', (0, 0), (-1, -1), 3.5), ('RIGHTPADDING', (0, 0), (-1, -1), 3.5),
    ('TOPPADDING', (0, 0), (-1, -1), 3.5), ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
]))
story.append(family_table)
story.append(PageBreak())

roles = defaultdict(list)
for family in families:
    fid = family['id'].strip('@')
    for parent_id in [family.get('husband'), family.get('wife')]:
        if parent_id:
            roles[parent_id].append(f'P:{fid}')
    for child_id in family.get('children', []):
        roles[child_id].append(f'H:{fid}')

story.append(Paragraph('Índice alfabético de personas', styles['H1Genealogy']))
story.append(Paragraph('P = progenitor o miembro de pareja. H = hijo o hija. Un perfil puede aparecer en varias familias.', styles['BodyGenealogy']))
story.append(Spacer(1, 3 * mm))
person_rows = [['ID', 'Persona', 'Vida', 'Lugar de nacimiento', 'Familias y papel']]
for person in sorted(people, key=lambda item: item['name'].casefold()):
    birthplace = (person.get('birth') or {}).get('place') or 'Sin registrar'
    person_rows.append([
        person['id'].strip('@'), person['name'], lifespan(person), birthplace,
        ', '.join(roles.get(person['id'], [])) or 'Perfil aislado',
    ])
story.append(LongTable(table_paragraphs(person_rows, styles['TinyGenealogy']), colWidths=[23 * mm, 70 * mm, 31 * mm, 78 * mm, 45 * mm], repeatRows=1, splitByRow=1, style=TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    ('FONTNAME', (0, 0), (-1, 0), 'GenealogySans-Bold'), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('GRID', (0, 0), (-1, -1), 0.3, colors.HexColor('#D8CEBD')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F0E7')]),
    ('LEFTPADDING', (0, 0), (-1, -1), 3.5), ('RIGHTPADDING', (0, 0), (-1, -1), 3.5),
    ('TOPPADDING', (0, 0), (-1, -1), 3), ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
])))
story.append(PageBreak())

isolated = [person for person in people if not roles.get(person['id'])]
story.append(Paragraph('Perfiles todavía aislados', styles['H1Genealogy']))
story.append(Paragraph('Estos perfiles forman parte de la investigación, pero aún no tienen una familia enlazada en el árbol.', styles['BodyGenealogy']))
story.append(Spacer(1, 4 * mm))
isolated_rows = [['ID', 'Persona', 'Notas']]
for person in isolated:
    isolated_rows.append([person['id'].strip('@'), person['name'], '; '.join(person.get('notes', [])) or 'Sin notas'])
story.append(Table(table_paragraphs(isolated_rows, styles['SmallGenealogy']), colWidths=[30 * mm, 75 * mm, 142 * mm], repeatRows=1, style=TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), NAVY), ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
    ('FONTNAME', (0, 0), (-1, 0), 'GenealogySans-Bold'), ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('GRID', (0, 0), (-1, -1), 0.35, colors.HexColor('#D8CEBD')),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F0E7')]),
    ('LEFTPADDING', (0, 0), (-1, -1), 5), ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
])))
story.append(Spacer(1, 8 * mm))
story.append(Paragraph('El documento refleja el estado actual del archivo local. Las correcciones realizadas posteriormente desde la web deben regenerar este PDF para quedar incorporadas.', styles['WarningGenealogy']))

os.makedirs(OUTPUT_DIR, exist_ok=True)
doc.build(story)
print(OUTPUT)
