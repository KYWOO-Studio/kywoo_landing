"""Regenerate the method scene's geographic preview from retained Overture GeoJSON."""
from pathlib import Path
import json

repo = Path(__file__).resolve().parents[1]
source = repo / 'assets/tiles/wulin-intime/2026-09-23.1/source'
bounds = (120.139, 30.251, 120.180, 30.292)

def point(coordinate):
    x = (coordinate[0] - bounds[0]) / (bounds[2] - bounds[0]) * 1400
    y = (bounds[3] - coordinate[1]) / (bounds[3] - bounds[1]) * 1100
    return f'{x:.1f},{y:.1f}'

svg = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 1100"><rect width="1400" height="1100" fill="#c4cfc0"/>']
for name, color in [('water', '#82adba'), ('building', '#819383'), ('segment', '#edf1e8')]:
    data = json.loads((source / f'{name}.geojson').read_text())
    svg.append(f'<g fill="{color}" stroke="{color}" stroke-width="2">')
    for feature in data['features']:
        geometry = feature['geometry']
        kind, coordinates = geometry['type'], geometry['coordinates']
        polygons = [coordinates] if kind == 'Polygon' else coordinates if kind == 'MultiPolygon' else []
        for polygon in polygons:
            path = ' '.join('M' + ' L'.join(point(p) for p in ring) + 'Z' for ring in polygon)
            svg.append(f'<path d="{path}" stroke="none"/>')
        lines = [coordinates] if kind == 'LineString' else coordinates if kind == 'MultiLineString' else []
        for line in lines:
            path = 'M' + ' L'.join(point(p) for p in line)
            svg.append(f'<path d="{path}" fill="none"/>')
    svg.append('</g>')
svg.append('</svg>')
(repo / 'assets/method/wulin-data.svg').write_text(''.join(svg))
