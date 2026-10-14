#!/usr/bin/env python3
"""Build src/data/home.json for the home screen: monthly headcount (last 12 months, total and
by country) and every site with its country and active headcount.
Run after the people file changes:  python3 tools/build_home.py
"""
import base64, gzip, json, struct
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
d = json.loads(gzip.decompress(base64.b64decode((ROOT / "src/data/shared-people.b64").read_text())))
n = d["n"]


def arr(b64, fmt, size):
    raw = base64.b64decode(b64)
    return list(struct.unpack("<%d%s" % (len(raw) // size, fmt), raw))


def st(key):
    v = d["st"][key]
    size = len(base64.b64decode(v["x"])) // n
    return [v["v"][i] for i in arr(v["x"], {1: "B", 2: "H", 4: "I"}[size], size)]


sta, loc = st("sta"), st("loc")
usd = arr(d["pay"]["annualUsd"], "f", 4)
p0 = base64.b64decode(d["pres0"]); p1 = base64.b64decode(d["pres1"])
months = d["months"]; M = len(months)


def present(i, m):
    if m < 32:
        return (struct.unpack_from("<I", p0, i * 4)[0] >> m) & 1
    return (struct.unpack_from("<I", p1, i * 4)[0] >> (m - 32)) & 1


CTRY = {"US": "US", "CA": "CA", "MX": "MX"}
ctry = [CTRY.get((d["jobcode"][i] or "-").split("-")[-1]) for i in range(n)]
# people with no job code: take the country most common at their site
site_c = defaultdict(Counter)
for i in range(n):
    if ctry[i]: site_c[loc[i]][ctry[i]] += 1
ctry = [c or (site_c[loc[i]].most_common(1)[0][0] if site_c[loc[i]] else "US") for i, c in enumerate(ctry)]

win = list(range(M - 12, M))
hc = {k: [0] * 12 for k in ("ALL", "US", "CA", "MX")}
payroll = [0.0] * 12
for i in range(n):
    for j, m in enumerate(win):
        if present(i, m):
            hc["ALL"][j] += 1; hc[ctry[i]][j] += 1; payroll[j] += usd[i]
sites = Counter((loc[i], ctry[i]) for i in range(n) if sta[i] == "Active")
payc = Counter()
for i in range(n):
    if sta[i] == "Active": payc[ctry[i]] += usd[i]
out = {"months": [months[m] for m in win], "hc": hc, "payroll": [round(p) for p in payroll], "payc": {k: round(v) for k, v in payc.items()},
       "sites": sorted([{"name": s, "c": c, "hc": k} for (s, c), k in sites.items()], key=lambda x: -x["hc"])}
(ROOT / "src/data/home.json").write_text(json.dumps(out, separators=(",", ":")))
print(out["months"][0], out["months"][-1], out["hc"]["ALL"], len(out["sites"]))
