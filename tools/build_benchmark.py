#!/usr/bin/env python3
"""Build src/data/benchmark.json from the demo people file (src/data/shared-people.b64).

One row per active employee with pay, for the Benchmarking tool (plus each job's family
and whether it is paid hourly):
  [name, job key, title, grade, country, site, tenure band, currency, full-time pay,
   FTE, market P25, P50, P75, range min, mid, max]
Pay, market and range are in the employee's own currency; part-time pay is shown on a
full-time basis so it compares fairly with the market. Market percentiles in the people
file are USD and are converted at the same rates the pay ranges use.
Run after the people file changes:  python3 tools/build_benchmark.py
"""
import base64, gzip, json, struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
d = json.loads(gzip.decompress(base64.b64decode((ROOT / "src/data/shared-people.b64").read_text())))
lite = json.loads((ROOT / "src/data/shared-lite.json").read_text())
n = d["n"]


def arr(b64, fmt, size):
    raw = base64.b64decode(b64)
    return list(struct.unpack("<%d%s" % (len(raw) // size, fmt), raw))


def st(key):
    v = d["st"][key]
    size = len(base64.b64decode(v["x"])) // n
    return [v["v"][i] for i in arr(v["x"], {1: "B", 2: "H", 4: "I"}[size], size)]


sta, loc, ten = st("sta"), st("loc"), st("ten")
ann = arr(d["pay"]["annual"], "f", 4)
cur = arr(d["pay"]["cur"], "H", 2)
rmin, rmid, rmax = (arr(d["rng"][k], "f", 4) for k in ("min", "mid", "max"))
p25, p50, p75 = (arr(d["mkt"][k], "f", 4) for k in ("p25", "p50", "p75"))
_fv = arr(d["fte"]["v"], "H", 2); _fe = arr(d["fte"]["e"], "I", 4)
fte = {_fe[k]: _fv[k] / 100 for k in range(len(_fe))}
roles = {r["k"]: r for r in lite["roles"]}
CTRY = {"US": "USA", "CA": "CANADA", "MX": "MEXICO"}
FX = {"USD": 1, "CAD": lite["fx"]["CANADA"]["per"], "MXN": lite["fx"]["MEXICO"]["per"]}


def nice(name):
    last, _, first = name.partition(", ")
    return (first.title() + " " + last.title()).strip()


rows = []
for i in range(n):
    if sta[i] != "Active" or ann[i] <= 0:
        continue
    code = d["jobcode"][i] or "-"
    k, c = code.split("-")[0], CTRY.get(code.split("-")[-1])
    r = roles.get(k)
    ccy = d["ccy"][cur[i]]
    if not r or not c or ccy not in FX or p50[i] <= 0:
        continue
    f = fte.get(i, 1) or 1
    fx = FX[ccy]
    rows.append([nice(d["names"][i]), k, r["t"], r["g"], c, loc[i], ten[i], ccy, round(ann[i] / f), f,
                 round(p25[i] * fx), round(p50[i] * fx), round(p75[i] * fx),
                 round(rmin[i]), round(rmid[i]), round(rmax[i])])
rows.sort(key=lambda x: x[0])
FAM = {"CORPORATE FUNCTIONS": "Corporate functions", "GREENHOUSE OPERATIONS": "Greenhouse operations", "PACKING AND DISTRIBUTION": "Packing and distribution",
       "SALES AND MARKETING": "Sales and marketing", "MAINTENANCE AND ENGINEERING": "Maintenance and engineering", "QUALITY AND FOOD SAFETY": "Quality and food safety",
       "SUPPLY CHAIN AND LOGISTICS": "Supply chain and logistics"}
# per job: family name and whether the job is paid hourly
jobs = {k: [FAM.get(r["tw"], r["tw"].title()), 1 if r["hr"] else 0] for k, r in roles.items()}
# Each job's survey family and the levels that family has, lowest to highest, for the "by level" view.
R = json.loads((ROOT / "src/data/survey-lib.json").read_text())["radford"]
ORDER = ["S1", "S2", "S3", "S4", "P1", "P2", "P3", "M1", "M2", "M3", "M5", "M6", "E1", "E2"]
LVLNAME = {}
for nm in R["lvl"]:
    code = nm[nm.find("(") + 1:nm.find(")")]
    LVLNAME[code] = nm[:nm.find("(")].strip()
ladders = {}
for k, r in roles.items():
    fam, lvl = r["code"].rsplit(".", 1)
    rows_ = [j for j in R["jobs"] if j[0].startswith(fam + ".")]
    if not rows_:
        continue
    lv = sorted({j[0].rsplit(".", 1)[1] for j in rows_}, key=ORDER.index)
    ladders[k] = [fam, R["area"][rows_[0][2]], lvl, lv]
codes = {r["code"]: k for k, r in roles.items()}
out = {"asof": d["asof"], "survey": d["mkt"]["survey"], "jobs": jobs, "ladders": ladders, "codes": codes, "levelNames": LVLNAME, "people": rows}
(ROOT / "src/data/benchmark.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
print(len(rows), "employees")
