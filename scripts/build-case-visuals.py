#!/usr/bin/env python3
"""Build the compact data behind the two animated case visuals.

  python3 scripts/build-case-visuals.py --zjj-src <path to presentation-zhujiajiao/src>

Outputs (metres, y pointing down):
  assets/cases/wulin-walk.json       roads, buildings, water and parks around the Wulin Intime POI,
                                     with walking distance along the road network from the POI
  assets/cases/zhujiajiao-nodes.json Zhujiajiao old-town streets, canals, attractions, the 10
                                     candidate points and the coverage curve

Wulin: Overture Maps 2026-09-23.1 GeoJSON already in assets/tiles/wulin-intime/ (ODbL).
The road graph follows Overture connectors. Walking distance starts from road nodes within
90 m of the approximate public POI (the straight-line gap is added); it is a layout measure,
not observed footfall, and entrances are not known.

Zhujiajiao: ZJJ.map (OpenStreetMap street network, ODbL) and ZJJ.syntax (KYWOO angular
segment analysis) from the Zhujiajiao research presentation. Coverage = share of street
length within 150 m walk of content, weighted by 800 m through-movement potential.
"""
import argparse, heapq, json, math, os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(ROOT, 'assets', 'cases')


def dump(name, data):
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, name)
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(',', ':'))
    print(name, os.path.getsize(path), 'bytes')


def simplify(points, tol):
    """Douglas-Peucker on a list of (x, y)."""
    if len(points) < 3:
        return points
    (ax, ay), (bx, by) = points[0], points[-1]
    dx, dy = bx - ax, by - ay
    L = math.hypot(dx, dy) or 1e-9
    best, idx = -1, 0
    for i in range(1, len(points) - 1):
        px, py = points[i]
        d = abs(dy * px - dx * py + bx * ay - by * ax) / L
        if d > best:
            best, idx = d, i
    if best <= tol:
        return [points[0], points[-1]]
    return simplify(points[:idx + 1], tol)[:-1] + simplify(points[idx:], tol)


def simplify_ring(points, tol):
    """Douglas-Peucker for a closed ring (first point repeated at the end); returns an open ring."""
    pts = points[:-1] if len(points) > 1 and points[0] == points[-1] else points
    if len(pts) < 4:
        return pts
    mid = len(pts) // 2
    return simplify(pts[:mid + 1], tol)[:-1] + simplify(pts[mid:] + [pts[0]], tol)[:-1]


def flat(points):
    return [v for p in points for v in (round(p[0]), round(p[1]))]


# ---------------------------------------------------------------- Wulin Intime
def wulin():
    src = os.path.join(ROOT, 'assets', 'tiles', 'wulin-intime', '2026-09-23.1', 'source')
    lon0, lat0 = 120.15947951, 30.27131877          # same approximate POI as place-story.js
    kx, ky = 111320 * math.cos(math.radians(lat0)), 110574
    proj = lambda c: ((c[0] - lon0) * kx, -(c[1] - lat0) * ky)
    W, H = 1250, 1000                                 # half-width / half-height of the frame (5:4)
    inside = lambda pts, m=60: any(abs(x) < W + m and abs(y) < H + m for x, y in pts)
    load = lambda n: json.load(open(os.path.join(src, n + '.geojson'), encoding='utf-8'))['features']

    # road graph from Overture connectors
    nodes, node_xy, edges = {}, [], []
    def nid(cid, xy):
        if cid not in nodes:
            nodes[cid] = len(node_xy)
            node_xy.append(xy)
        return nodes[cid]
    major = {'trunk': 3, 'primary': 3, 'secondary': 2, 'tertiary': 2}
    rail = []
    for f in load('segment'):
        p = f['properties']
        pts = [proj(c) for c in f['geometry']['coordinates']]
        if p['subtype'] == 'rail':
            if p['class'] == 'subway' and inside(pts):
                rail.append(flat(simplify(pts, 2)))
            continue
        if p['subtype'] != 'road' or not inside(pts, 900):
            continue
        cum = [0.0]
        for i in range(1, len(pts)):
            cum.append(cum[-1] + math.dist(pts[i - 1], pts[i]))
        total = cum[-1]
        if total < 0.5:
            continue
        def at(t):
            d = t * total
            for i in range(1, len(pts)):
                if cum[i] >= d:
                    seg = cum[i] - cum[i - 1] or 1e-9
                    u = (d - cum[i - 1]) / seg
                    return (pts[i - 1][0] + u * (pts[i][0] - pts[i - 1][0]), pts[i - 1][1] + u * (pts[i][1] - pts[i - 1][1]))
            return pts[-1]
        def piece(t0, t1):
            d0, d1 = t0 * total, t1 * total
            out = [at(t0)] + [pts[i] for i in range(len(pts)) if d0 < cum[i] < d1] + [at(t1)]
            return out
        conns = sorted(p.get('connectors') or [], key=lambda c: c['at'])
        if not conns or conns[0]['at'] > 0:
            conns = [{'connector_id': f['id'] + ':0', 'at': 0.0}] + conns
        if conns[-1]['at'] < 1:
            conns = conns + [{'connector_id': f['id'] + ':1', 'at': 1.0}]
        tier = major.get(p['class'], 1)
        for a, b in zip(conns, conns[1:]):
            if b['at'] - a['at'] <= 0:
                continue
            geom = piece(a['at'], b['at'])
            u, v = nid(a['connector_id'], geom[0]), nid(b['connector_id'], geom[-1])
            edges.append((u, v, (b['at'] - a['at']) * total, geom, tier))

    adj = [[] for _ in node_xy]
    for k, (u, v, L, g, t) in enumerate(edges):
        adj[u].append((v, L, k)); adj[v].append((u, L, k))
    dist = [math.inf] * len(node_xy)
    parent = [-1] * len(node_xy)
    heap = []
    for i, (x, y) in enumerate(node_xy):
        d = math.hypot(x, y)
        if d <= 90:
            dist[i] = d
            heap.append((d, i))
    heapq.heapify(heap)
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue
        for v, L, k in adj[u]:
            if d + L < dist[v]:
                dist[v], parent[v] = d + L, k
                heapq.heappush(heap, (d + L, v))

    # keep edges in the frame, near end (shorter walk) first; `next` is the edge a walker takes
    # after reaching the near end (-1 at the POI), so the dots can follow the tree to the mall
    framed = [k for k, e in enumerate(edges) if inside(e[3], 30)]
    keep = {k: i for i, k in enumerate(framed)}
    out_edges = []
    for k in framed:
        u, v, L, g, t = edges[k]
        if dist[v] < dist[u]:
            u, v, g = v, u, g[::-1]
        g = simplify(g, 1.2)
        d0 = round(dist[u]) if dist[u] < math.inf else -1
        d1 = round(dist[v]) if dist[v] < math.inf else -1
        nxt = keep.get(parent[u], -1)
        out_edges.append([t, d0, d1, nxt] + flat(g))
    # start points for the dots: nodes 200-1200 m away; the edge they arrive by runs parent -> node
    tree = []
    for i, (x, y) in enumerate(node_xy):
        k = parent[i]
        if 200 <= dist[i] <= 1200 and k in keep and abs(x) < W and abs(y) < H:
            tree.append(keep[k])

    buildings = []
    for f in load('building'):
        g = f['geometry']
        rings = [g['coordinates'][0]] if g['type'] == 'Polygon' else [poly[0] for poly in g['coordinates']]
        for r in rings:
            pts = [proj(c) for c in r]
            if not inside(pts, 0):
                continue
            area = abs(sum(pts[i][0] * pts[i - 1][1] - pts[i - 1][0] * pts[i][1] for i in range(len(pts)))) / 2
            if area < 60:
                continue
            s = simplify_ring(pts, 1.5)
            if len(s) >= 3:
                buildings.append(flat(s))
    def polys(feats, test):
        out = []
        for f in feats:
            p = f['properties']
            if not test(p):
                continue
            g = f['geometry']
            if g['type'] not in ('Polygon', 'MultiPolygon'):
                continue
            parts = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
            for poly in parts:
                pts = [proj(c) for c in poly[0]]
                if inside(pts, 400):
                    s = simplify_ring(pts, 3)
                    if len(s) >= 3:
                        out.append(flat(s))
        return out
    water = polys(load('water'), lambda p: p.get('class') not in ('swimming_pool',))
    parks = polys(load('land_use'), lambda p: p.get('subtype') in ('park', 'managed', 'horticulture', 'recreation', 'protected'))
    dump('wulin-walk.json', {
        'about': 'Roads, buildings, water and parks around the approximate Wulin Intime POI (Overture Maps 2026-09-23.1, '
                 '(c) OpenStreetMap contributors, ODbL). Metres from the POI, y down. edges: [tier, walk metres at start, at end, '
                 'next edge towards the POI, x0, y0, x1, y1, ...]; walking distance follows Overture connectors from road nodes within 90 m of the POI. '
                 'Not observed footfall; entrances unknown.',
        'frame': [W, H], 'speed': 80,
        'edges': out_edges, 'tree': tree, 'rail': rail, 'buildings': buildings, 'water': water, 'parks': parks,
    })


# ---------------------------------------------------------------- Zhujiajiao
def zhujiajiao(src):
    def js(name, key):
        raw = open(os.path.join(src, name), encoding='utf-8').read()
        return json.loads(raw[raw.index(key) + len(key):].strip().rstrip(';'))
    M = js('map-data.js', 'ZJJ.map = ')
    X = js('syntax-data.js', 'ZJJ.syntax = ')
    segs = []
    for s, sx in zip(M['streets'], X['streets']):
        codes, j, p = sx['v'], 0, s['p']
        for t in range(len(p) - 1):
            if math.dist(p[t], p[t + 1]) < 0.5:
                continue
            v = codes[j] if j < len(codes) else '0000-'
            j += 1
            k = -1 if v[4] == '-' else int(v[4], 16)
            segs.append([int(v[0]), k] + [round(c) for c in p[t] + p[t + 1]])
    xs = [c for s in segs for c in (s[2], s[4])]
    ys = [c for s in segs for c in (s[3], s[5])]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    H = (max(ys) - min(ys)) / 2 + 60
    W = H * 1.25
    def clip_line(pts):
        return any(abs(x - cx) < W + 300 and abs(y - cy) < H + 300 for x, y in pts)
    water = []
    for w in M['water']:
        if not clip_line(w['p']):
            continue
        water.append({'t': w['t'], 'w': w.get('w', 4), 'p': flat(w['p'])})
    dump('zhujiajiao-nodes.json', {
        'about': 'Zhujiajiao old town. Streets and canals (c) OpenStreetMap contributors (ODbL), fetched ' + M['meta']['osm'] +
                 '; through-movement potential and coverage by KYWOO (angular segment analysis, after Space Syntax). '
                 'segs: [decile 0-9 of 800 m through-movement potential, k, x0, y0, x1, y1]; k = number of new points after which '
                 'the segment is within 150 m walk of content (0 = existing attractions, -1 = not within 10). '
                 'curve = coverage % (weighted by potential) with 0..10 new points. Layout model, not footfall.',
        'frame': [round(cx), round(cy), round(W), round(H)], 'R': M['meta']['R'],
        'curve': X['curve'], 'cands': [[c['x'], c['y']] for c in X['cands']],
        'pois': [[p['x'], p['y']] for p in M['pois']],
        'segs': segs, 'water': water,
    })


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--zjj-src', help='presentation-zhujiajiao/src folder with map-data.js and syntax-data.js')
    a = ap.parse_args()
    wulin()
    if a.zjj_src:
        zhujiajiao(a.zjj_src)
