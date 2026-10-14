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

win = list(range(M - 13, M))   # 13 points: this month and the same month a year ago
hc = {k: [0] * 13 for k in ("ALL", "US", "CA", "MX")}
payroll = [0.0] * 13
seen = [0] * 13                 # everyone in the HR data up to each month (current and former)
for i in range(n):
    first = next((m for m in range(M) if present(i, m)), M)
    for j, m in enumerate(win):
        if present(i, m):
            hc["ALL"][j] += 1; hc[ctry[i]][j] += 1; payroll[j] += usd[i]
        if first <= m: seen[j] += 1
sites = Counter((loc[i], ctry[i]) for i in range(n) if sta[i] == "Active")
payc = Counter()
for i in range(n):
    if sta[i] == "Active": payc[ctry[i]] += usd[i]
out = {"months": [months[m] for m in win], "hc": hc, "payroll": [round(p) for p in payroll], "seen": seen, "payc": {k: round(v) for k, v in payc.items()},
       "sites": sorted([{"name": s, "c": c, "hc": k} for (s, c), k in sites.items()], key=lambda x: -x["hc"])}
# Briefing figures, computed the same way the tools compute them (How Competitive Should We Be,
# Org Chart, AI Time Savings), so the home screen and the tools always agree.
wf = json.loads((ROOT / "src/data/workforce.json").read_text())
repl = lambda pay: 16 if pay < 30000 else 20 if pay < 50000 else 21 if pay < 100000 else 50 if pay < 200000 else 100
# job by job, then summed: the same in every view of How Competitive Should We Be
fam = defaultdict(lambda: {"hc": 0, "tc": 0.0, "rs": 0.0, "rn": 0})
for j in wf["jobs"]:
    f = fam[j["tw"]]; f["hc"] += j["hc"]; f["tc"] += j["hc"] * j["turnover"] / 100 * j["pay"] * repl(j["pay"]) / 100
    if j["ratio"]: f["rs"] += j["ratio"] * j["hc"]; f["rn"] += j["hc"]
tc = sum(f["tc"] for f in fam.values()); top = max(fam.items(), key=lambda kv: kv[1]["tc"])
below = [k for k, f in fam.items() if f["rn"] and f["rs"] / f["rn"] < 0.97]
grade = {j["k"]: j["g"] for j in wf["jobs"]}
kids = Counter(o[3] for o in wf["org"] if o[3] >= 0)
narrow = sum(1 for i, o in enumerate(wf["org"]) if 1 <= kids.get(i, 0) <= 2 and not grade.get(o[4], "-").startswith("E"))
CAT = {"Executive": (85, 6), "Management": (65, 5), "Professional": (75, 7), "Support": (15, 2)}
ai = sum(j["hc"] * CAT[j["cat"]][0] / 100 * 2080 * CAT[j["cat"]][1] / 100 for j in wf["jobs"])
out["brief"] = {"turnoverCost": round(tc), "topFam": top[0], "topShare": round(100 * top[1]["tc"] / tc), "famsBelow": len(below), "fams": len(fam),
                "belowNames": sorted(below), "narrow": narrow, "aiHours": round(ai), "roles": len(wf["jobs"]),
                "records": n, "priced": sum(j["hc"] for j in wf["jobs"]), "former": sum(1 for x in sta if x == "Terminated")}
(ROOT / "src/data/home.json").write_text(json.dumps(out, separators=(",", ":")))
print(out["months"][0], out["months"][-1], out["hc"]["ALL"], len(out["sites"]), out["brief"])
