#!/usr/bin/env python3
"""Build src/data/messy-titles.json: the company's job table the way an HR system really holds it.

About 1,000 raw job titles for the company's 58 clean jobs: abbreviations, upper and lower case,
level written five different ways, shift and site suffixes, Spanish titles in Mexico, typos and
old job codes. Each row keeps the clean job it really belongs to, so the JD Matcher can show how
the clean-up went and how often it picked the right job. Headcounts add up to the employees
priced in src/data/benchmark.json. Fixed seed, so it is repeatable.
Row: [job code, raw title, department, country, level as written, employees, true clean job code]
"""
import json, random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
lite = json.loads((ROOT / "src/data/shared-lite.json").read_text())
bm = json.loads((ROOT / "src/data/benchmark.json").read_text())
rng = random.Random(1000)
roles = {r["k"]: r for r in lite["roles"]}

ABBR = [("Senior", ["Sr.", "Sr", "Snr", "SENIOR", "Senior"]), ("Supervisor", ["Supv", "Sup.", "Supervisor", "SUPERVISOR"]),
        ("Manager", ["Mgr", "Mgr.", "Manager", "MGR"]), ("Technician", ["Tech", "Tech.", "Technician", "Techn"]),
        ("Maintenance", ["Maint", "Maint.", "Maintenance"]), ("Director", ["Dir.", "Director", "Dir"]),
        ("Representative", ["Rep", "Rep.", "Representative"]), ("Assistant", ["Asst", "Asst.", "Assistant"]),
        ("Coordinator", ["Coord", "Coordinator", "Co-ordinator"]), ("Analyst", ["Analyst", "Anlst", "Analyst"]),
        ("Worker", ["Worker", "Wkr", "WORKER"]), ("Operations", ["Ops", "Operations", "Oper."]),
        ("Vice President", ["VP", "V.P.", "Vice President"]), ("Quality", ["QA", "Quality", "Qlty"])]
ES = {"Crop Care Worker": "Trabajador de Cultivo", "Packer": "Empacador", "Production Grader": "Seleccionador",
      "Production Associate": "Ayudante General", "Hi-Lo Driver": "Montacarguista", "Delivery Driver": "Chofer",
      "Crop Care Supervisor": "Supervisor de Cultivo", "Warehouse Supervisor": "Supervisor de Almacen",
      "Warehouse Manager": "Gerente de Almacen", "Greenhouse Manager": "Gerente de Invernadero", "Grower": "Agronomo",
      "Assistant Grower": "Agronomo Asistente", "Quality Technician": "Tecnico de Calidad", "Sanitation Technician": "Tecnico de Sanidad",
      "Maintenance Technician": "Tecnico de Mantenimiento", "HR Generalist": "Generalista de RH", "Food Safety Coordinator": "Coordinador de Inocuidad"}
SHIFT = ["", "", "", " - Night", " - Days", " (Nights)", " - Seasonal", " - PT", " (Temp)", " - Weekend"]
DEPT = {"GREENHOUSE OPERATIONS": ["Growing", "GROWING", "Greenhouse Ops", "Crop Care", "Grow"], "PACKING AND DISTRIBUTION": ["Packing", "PKG", "Distribution", "Warehouse", "Shipping"],
        "CORPORATE FUNCTIONS": ["Corporate", "Admin", "G&A", "Head Office", "Corp"], "SALES AND MARKETING": ["Sales", "Marketing", "Commercial", "Sales & Mktg"],
        "MAINTENANCE AND ENGINEERING": ["Maintenance", "Maint", "Engineering", "Facilities"], "QUALITY AND FOOD SAFETY": ["Quality", "QA", "Food Safety", "QC"],
        "SUPPLY CHAIN AND LOGISTICS": ["Logistics", "Supply Chain", "Transport", "Purchasing"]}
SITES = {"USA": ["Coldwater", "Oneida", "Morehead", "Richmond", "Laredo DC", "Utah"], "CANADA": ["Kingsville", "Leamington", "Surrey", "Wheatley"], "MEXICO": ["Sinaloa", "Jalisco", "Culiacan"]}


def typo(t):
    if len(t) < 6 or rng.random() > .12: return t
    i = rng.randrange(1, len(t) - 2)
    return t[:i] + t[i + 1] + t[i] + t[i + 2:] if t[i].isalpha() and t[i + 1].isalpha() else t


def level_written(code, k):
    lv = code.split(".")[-1]
    n = lv[1:]
    return rng.choice([lv, "Grade " + n, "L" + n, "Lvl " + n, roles[k]["g"], "", "", "Band " + n])


def variant(title, ctry, k):
    t = title
    if ctry == "MEXICO":
        base = next((v for e, v in ES.items() if title.startswith(e)), None)
        if base and rng.random() < .55:
            t = base + title[len(next(e for e in ES if title.startswith(e))):]
    for word, alts in ABBR:
        if word in t and rng.random() < .7: t = t.replace(word, rng.choice(alts))
    t = t.replace(" I", rng.choice([" I", " 1", " Lvl 1", " (I)", "-1"])) if t.endswith(" I") else t
    t = t.replace(" II", rng.choice([" II", " 2", " Lvl 2", " (II)", "-2"])) if t.endswith(" II") else t
    if rng.random() < .25: t = t + " - " + rng.choice(SITES[ctry])
    t = t + rng.choice(SHIFT)
    r = rng.random()
    if r < .18: t = t.upper()
    elif r < .24: t = t.lower()
    if rng.random() < .1: t = k + "-" + str(rng.randrange(10, 99)) + " " + t
    return typo(t).strip()


rows, seen = [], set()
groups = [r for r in bm["rows"]]
# share of variants per job and country, by headcount; about 1,000 titles in all
total = sum(g[5] for g in groups)
for g in groups:
    k, title, ctry, n = g[0], g[1], g[3], g[5]
    nv = max(1, min(n, round(1240 * (0.35 * n / total + 0.65 / len(groups)))))
    names = []
    for _ in range(nv * 4):
        v = variant(title, ctry, k)
        if v.lower() not in seen:
            seen.add(v.lower()); names.append(v)
        if len(names) >= nv: break
    # spread the job's people across its titles, most in the first
    w = [1 / (i + 1) for i in range(len(names))]; s = sum(w)
    counts = [max(1, round(n * x / s)) for x in w]
    counts[0] += n - sum(counts)
    if counts[0] < 1:
        counts = [1] * len(names); counts[0] = n - (len(names) - 1)
    for nm, c in zip(names, counts):
        if c <= 0: continue
        code = rng.choice(["", k + "-" + ctry[:2], k.lower() + str(rng.randrange(1, 9)), str(rng.randrange(10000, 99999))])
        rows.append([code, nm, rng.choice(DEPT.get(roles[k]["tw"], ["Other"])), {"USA": "US", "CANADA": "CA", "MEXICO": "MX"}[ctry], level_written(roles[k]["code"], k), c, roles[k]["code"]])
rng.shuffle(rows)
(ROOT / "src/data/messy-titles.json").write_text(json.dumps({"note": "Illustrative HR system export, fictional company", "rows": rows}, ensure_ascii=False, separators=(",", ":")))
print(len(rows), "raw titles,", sum(r[5] for r in rows), "employees,", len({r[6] for r in rows}), "clean jobs")
