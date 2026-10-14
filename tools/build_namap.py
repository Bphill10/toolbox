"""Build src/data/namap.json: simplified outlines of Canada, the US and Mexico (Natural Earth 1:50m,
via world-atlas@2.0.2 countries-50m.json) and approximate site positions, in one projection."""
import json, math, sys
t = json.load(open(sys.argv[1]))
sc, tr = t['transform']['scale'], t['transform']['translate']
arcs = []
for a in t['arcs']:
    x = y = 0; pts = []
    for dx, dy in a: x += dx; y += dy; pts.append((x*sc[0]+tr[0], y*sc[1]+tr[1]))
    arcs.append(pts)
def ring(idx):
    out = []
    for i in idx:
        p = arcs[i] if i >= 0 else arcs[~i][::-1]
        out += p if not out else p[1:]
    return out
K = math.cos(math.radians(40)); LON0, LON1, LAT0, LAT1 = -170, -50, 13, 75; S = 6
def proj(lon, lat): return ((lon-LON0)*K*S, (LAT1-lat)*S)
def simplify(pts, tol):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; dmax, idx = 0, 0
    for i in range(1, len(pts)-1):
        px, py = pts[i]; ax, ay = a; bx, by = b
        L = math.hypot(bx-ax, by-ay) or 1e-9
        d = abs((bx-ax)*(ay-py)-(ax-px)*(by-ay))/L
        if d > dmax: dmax, idx = d, i
    if dmax > tol: return simplify(pts[:idx+1], tol)[:-1] + simplify(pts[idx:], tol)
    return [a, b]
paths = {}
for g in t['objects']['countries']['geometries']:
    if g.get('id') not in ('124', '840', '484'): continue
    polys = [g['arcs']] if g['type'] == 'Polygon' else g['arcs']
    d = ''
    for poly in polys:
        r = ring(poly[0])
        r = [(lon, lat) for lon, lat in r]
        if any(lon > 0 for lon, _ in r): continue          # Aleutians across the date line
        lons = [p[0] for p in r]; lats = [p[1] for p in r]
        if (max(lons)-min(lons))*(max(lats)-min(lats)) < 2.5: continue
        if max(lats) < LAT0 or min(lats) > LAT1 + 8: continue
        q = [proj(lon, lat) for lon, lat in r]; m = len(q) // 2
        pp = simplify(q[:m+1], 0.9)[:-1] + simplify(q[m:], 0.9)  # a closed ring has no chord, so do it in two halves
        if len(pp) < 4: continue
        d += 'M' + 'L'.join('%.1f,%.1f' % p for p in pp) + 'Z'
    paths[{'124': 'CA', '840': 'US', '484': 'MX'}[g['id']]] = d
SITES = {'Kingsville Greenhouse':(42.04,-82.74),'Leamington Greenhouse':(42.05,-82.6),'Coldwater Greenhouse':(41.94,-85.0),'Sinaloa Greenhouse One':(24.8,-107.4),'Sinaloa Greenhouse Two':(25.79,-108.99),'Oneida Greenhouse':(43.09,-75.65),'Richmond Greenhouse':(37.75,-84.29),'Leamington Strawberry Greenhouse':(42.1,-82.5),'Morehead Greenhouse':(38.18,-83.43),'Jalisco Greenhouse':(20.4,-103.0),'Surrey Greenhouse':(49.19,-122.85),'Jonestown Packing Centre':(40.41,-76.48),'Laredo Distribution Center':(27.53,-99.48),'Kingsville Distribution Centre':(42.0,-82.8),'Coldwater Pepper Greenhouse':(41.9,-85.1),'Culiacan Packing Centre':(24.75,-107.3),'Coldwater Distribution Center':(42.0,-84.9),'Kingsville Head Office':(42.06,-82.72),'Berea Greenhouse':(37.57,-84.3),'Utah Greenhouse':(39.3,-111.7),'Exeter Greenhouse':(36.3,-119.14),'Surrey Distribution Centre':(49.1,-122.7),'Wapakoneta Greenhouse':(40.57,-84.19),'US Sales and Support Office':(42.37,-83.35),'Guadalajara Office':(20.67,-103.35)}
W, H = proj(LON1, LAT0)
out = {'w': round(W), 'h': round(H), 'paths': paths, 'sites': {k: [round(v, 1) for v in proj(lo, la)] for k, (la, lo) in SITES.items()}}
json.dump(out, open(sys.argv[2], 'w'), separators=(',', ':'))
print({k: len(v) for k, v in paths.items()}, round(W), round(H))
