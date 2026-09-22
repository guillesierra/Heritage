import json
import os
import re
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
LAYOUT_PATH = os.path.join(ROOT, 'tmp', 'pdfs', 'poster-layout.json')
OUTPUT_DIR = os.path.join(ROOT, 'output', 'pdf')
OUTPUT_PATH = os.path.join(OUTPUT_DIR, 'arbol_genealogico_completo_poster.pdf')

with open(LAYOUT_PATH, encoding='utf-8') as stream:
    data = json.load(stream)

pdfmetrics.registerFont(TTFont('PosterSans', r'C:\Windows\Fonts\arial.ttf'))
pdfmetrics.registerFont(TTFont('PosterSans-Bold', r'C:\Windows\Fonts\arialbd.ttf'))

SCALE = min(0.43, 11200 / data['height'], 11200 / data['width'])
MARGIN = 105
HEADER = 90
PAGE_WIDTH = data['width'] * SCALE + MARGIN * 2
PAGE_HEIGHT = data['height'] * SCALE + MARGIN * 2 + HEADER

NAVY = colors.HexColor('#173A4B')
RUST = colors.HexColor('#7B2636')
GOLD = colors.HexColor('#A8782D')
PAPER = colors.HexColor('#F7F2E8')
MUTED = colors.HexColor('#6A777B')
LINE = colors.HexColor('#9D825C')
WHITE = colors.white

COMMUNITY_COLORS = {
    'Andalucía': '#EDF7E9', 'Aragón': '#F9EEE4', 'Principado de Asturias': '#E8F2FB',
    'Illes Balears': '#E8F6F7', 'Canarias': '#FFF6D8', 'Cantabria': '#E7F3F1',
    'Castilla-La Mancha': '#F6EEE1', 'Castilla y León': '#F7EEDC', 'Cataluña': '#FFF0DF',
    'Comunitat Valenciana': '#FFF0EB', 'Extremadura': '#EDF4E1', 'Galicia': '#E7F4ED',
    'Comunidad de Madrid': '#F0EBF8', 'Región de Murcia': '#FAECE2',
    'Comunidad Foral de Navarra': '#F5E7E5', 'País Vasco': '#E7F2E8', 'La Rioja': '#F8E9EE',
    'Ceuta': '#E9F3F7', 'Melilla': '#EEEEFA',
}

people = {person['id']: person for person in data['people']}
positions = data['positions']

def px(value):
    return MARGIN + value * SCALE

def py(value):
    return PAGE_HEIGHT - MARGIN - HEADER - value * SCALE

def text_width(text, font, size):
    return pdfmetrics.stringWidth(text, font, size)

def truncate(text, max_width, font='PosterSans', size=4.5):
    text = str(text or '')
    if text_width(text, font, size) <= max_width:
        return text
    suffix = '...'
    while text and text_width(text + suffix, font, size) > max_width:
        text = text[:-1]
    return text + suffix

def wrap_name(text, max_width, max_lines=2, size=5.1):
    words = str(text or '').split()
    lines, current = [], ''
    for word in words:
        candidate = f'{current} {word}'.strip()
        if not current or text_width(candidate, 'PosterSans-Bold', size) <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
            if len(lines) == max_lines - 1:
                break
    if current and len(lines) < max_lines:
        remaining = ' '.join(words[sum(len(line.split()) for line in lines):])
        lines.append(truncate(remaining, max_width, 'PosterSans-Bold', size))
    return lines[:max_lines]

def event_year(person, key):
    year = person.get(f'{key}Year')
    if year:
        return str(year)
    date = (person.get(key) or {}).get('date')
    if date:
        match = re.search(r'\b(1[0-9]{3}|20[0-9]{2})\b', str(date))
        return match.group(1) if match else str(date)
    return '?'

def place_label(person):
    birth = person.get('birth') or {}
    place = birth.get('place') or 'Lugar sin registrar'
    return place

def community_color(person):
    place = place_label(person)
    for community, color in COMMUNITY_COLORS.items():
        if community.lower() in place.lower():
            return colors.HexColor(color)
    if 'Alemania' in place:
        return colors.HexColor('#F1EEE8')
    return colors.HexColor('#FFFDF8')

def traditional(person):
    return any('tradición' in str(note).lower() or 'tradicion' in str(note).lower() for note in person.get('notes', []))

os.makedirs(OUTPUT_DIR, exist_ok=True)
c = canvas.Canvas(OUTPUT_PATH, pagesize=(PAGE_WIDTH, PAGE_HEIGHT), pageCompression=1)
c.setTitle('Árbol genealógico completo')
c.setAuthor('Familia Sierra-Maíllo')
c.setSubject('Árbol completo con 321 perfiles y 116 familias')
c.setFillColor(PAPER)
c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)

# Cabecera y leyenda.
c.setFillColor(NAVY)
c.setFont('PosterSans-Bold', 26)
c.drawString(MARGIN, PAGE_HEIGHT - 48, 'Árbol genealógico completo')
c.setFont('PosterSans', 9)
c.setFillColor(MUTED)
c.drawString(MARGIN, PAGE_HEIGHT - 66, '321 perfiles · 116 familias · ordenado por décadas · una sola página vectorial')

legend_x = PAGE_WIDTH - MARGIN - 420
legend_y = PAGE_HEIGHT - 54
c.setFont('PosterSans', 7)
for label, border, offset in [('Hombre', NAVY, 0), ('Mujer', RUST, 105), ('Sexo sin registrar', MUTED, 200)]:
    c.setFillColor(WHITE); c.setStrokeColor(border); c.setLineWidth(1.5)
    c.roundRect(legend_x + offset, legend_y - 5, 18, 12, 2, fill=1, stroke=1)
    c.setFillColor(NAVY); c.drawString(legend_x + offset + 24, legend_y - 2, label)
c.setStrokeColor(RUST); c.setDash(4, 3); c.roundRect(legend_x + 320, legend_y - 5, 18, 12, 2, fill=0, stroke=1)
c.setDash(); c.setFillColor(NAVY); c.drawString(legend_x + 344, legend_y - 2, 'Tradición')

# Franjas de décadas.
for index, band in enumerate(data['bands']):
    x = MARGIN
    y_top = py(band['y'])
    height = band['height'] * SCALE
    c.setFillColor(colors.HexColor('#FFFFFF') if index % 2 == 0 else colors.HexColor('#EEF0EC'))
    c.setFillAlpha(0.32)
    c.rect(x, y_top - height, data['width'] * SCALE, height, fill=1, stroke=0)
    c.setFillAlpha(1)
    c.setStrokeColor(colors.HexColor('#D7D1C5'))
    c.setLineWidth(0.35)
    c.line(x, y_top, x + data['width'] * SCALE, y_top)
    c.setFillColor(MUTED)
    c.setFont('PosterSans-Bold', 6)
    c.drawString(x + 6, y_top - 10, f"{band['decade']}-{band['decade'] + 9}")

# Conectores familiares, dibujados antes que las tarjetas.
c.setStrokeColor(LINE)
c.setLineWidth(0.65)
c.setLineCap(1)
for family_index, family in enumerate(data['families']):
    parents = [positions[pid] for pid in [family.get('husband'), family.get('wife')] if pid in positions]
    children = [positions[cid] for cid in family.get('children', []) if cid in positions]
    if not parents:
        continue
    if not children:
        if len(parents) == 2:
            ordered = sorted(parents, key=lambda item: item['x'])
            left, right = ordered
            y_mid = left['y'] + left['height'] / 2
            c.line(px(left['x'] + left['width']), py(y_mid), px(right['x']), py(y_mid))
        continue
    parent_centers = [{'x': p['x'] + p['width'] / 2, 'y': p['y'] + p['height']} for p in parents]
    child_centers = [{'x': p['x'] + p['width'] / 2, 'y': p['y']} for p in children]
    parent_y = max(point['y'] for point in parent_centers)
    child_y = min(point['y'] for point in child_centers)
    available_gap = max(0, child_y - parent_y - 100)
    lane_count = max(1, min(8, int(available_gap // 16)))
    lane = family_index % lane_count
    marriage_y = parent_y + 24 + lane * 8
    sibling_y = max(marriage_y + 30, child_y - 34 - lane * 8)
    parent_min_x = min(point['x'] for point in parent_centers)
    parent_max_x = max(point['x'] for point in parent_centers)
    junction_x = (parent_min_x + parent_max_x) / 2
    for point in parent_centers:
        c.line(px(point['x']), py(point['y']), px(point['x']), py(marriage_y))
    if len(parents) > 1:
        c.line(px(parent_min_x), py(marriage_y), px(parent_max_x), py(marriage_y))
    c.line(px(junction_x), py(marriage_y), px(junction_x), py(sibling_y))
    child_min_x = min(point['x'] for point in child_centers)
    child_max_x = max(point['x'] for point in child_centers)
    c.line(px(min(junction_x, child_min_x)), py(sibling_y), px(max(junction_x, child_max_x)), py(sibling_y))
    for point in child_centers:
        c.line(px(point['x']), py(sibling_y), px(point['x']), py(point['y']))

# Tarjetas de personas.
card_w = data['nodeWidth'] * SCALE
card_h = data['nodeHeight'] * SCALE
for person_id, pos in positions.items():
    person = people[person_id]
    x = px(pos['x'])
    y = py(pos['y'] + pos['height'])
    border = NAVY if person.get('sex') == 'M' else RUST if person.get('sex') == 'F' else MUTED
    c.setFillColor(community_color(person))
    c.setStrokeColor(border)
    c.setLineWidth(1.2 if not traditional(person) else 1.5)
    if traditional(person):
        c.setDash(3, 2)
    c.roundRect(x, y, card_w, card_h, 4, fill=1, stroke=1)
    c.setDash()

    inner_x = x + 5
    max_text = card_w - 10
    cursor_y = y + card_h - 8
    c.setFillColor(NAVY)
    c.setFont('PosterSans-Bold', 5.1)
    for line in wrap_name(person.get('name', ''), max_text, 2, 5.1):
        c.drawString(inner_x, cursor_y, line)
        cursor_y -= 6.1
    c.setFont('PosterSans', 4.15)
    c.setFillColor(colors.HexColor('#435B66'))
    life = f"{event_year(person, 'birth')} - {event_year(person, 'death')}"
    c.drawString(inner_x, cursor_y - 1, truncate(life, max_text, 'PosterSans', 4.15))
    cursor_y -= 6
    c.drawString(inner_x, cursor_y - 1, truncate(place_label(person), max_text, 'PosterSans', 4.15))
    c.setFont('PosterSans', 3.5)
    c.setFillColor(MUTED)
    marker = ' · tradición' if traditional(person) else ''
    c.drawRightString(x + card_w - 4, y + 4, f"{person_id.strip('@')}{marker}")

# Pie del póster.
c.setFillColor(MUTED)
c.setFont('PosterSans', 6)
c.drawString(MARGIN, 30, 'Las líneas discontinuas identifican perfiles procedentes de tradición genealógica. Los años aproximados sirven para ordenar, no para afirmar una fecha exacta.')
c.drawRightString(PAGE_WIDTH - MARGIN, 30, f'Formato: {PAGE_WIDTH / 72:.1f} × {PAGE_HEIGHT / 72:.1f} pulgadas')
c.showPage()
c.save()

print(json.dumps({
    'output': OUTPUT_PATH,
    'pageWidthPt': round(PAGE_WIDTH, 2),
    'pageHeightPt': round(PAGE_HEIGHT, 2),
    'scale': round(SCALE, 4),
    'people': len(people),
    'families': len(data['families']),
}, ensure_ascii=False))
