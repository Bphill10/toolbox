#!/usr/bin/env python3
"""Give every person in the demo data a newly generated fictional name.

The demo should never show a name from the original source file. This replaces each
name with a made-up one (fixed seed, so it is repeatable), matched to the person's
country and gender, and carries the change everywhere a name appears:
  src/data/shared-people.b64  names ("LAST, FIRST") and work emails
  src/data/shared-lite.json   people (name and supervisor) and the CHRO
  src/modules/comp.html       names written into the Comp Tool
Then rebuild what is derived from the people file:
  python3 tools/build_workforce.py && python3 tools/build_home.py && python3 tools/build_benchmark.py
"""
import base64, gzip, json, random, re, struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PF = ROOT / "src/data/shared-people.b64"
d = json.loads(gzip.decompress(base64.b64decode(PF.read_text())))
n = d["n"]


def arr(b64, fmt, size):
    raw = base64.b64decode(b64)
    return list(struct.unpack("<%d%s" % (len(raw) // size, fmt), raw))


def st(key):
    v = d["st"][key]
    size = len(base64.b64decode(v["x"])) // n
    return [v["v"][i] for i in arr(v["x"], {1: "B", 2: "H", 4: "I"}[size], size)]


gen = st("gen")
FIRST = {
    "EN": {"Male": "Aaron Adrian Alan Blake Brandon Brent Caleb Cameron Carter Colin Connor Dale Dean Derek Dylan Elliot Evan Felix Gavin Graham Grant Harvey Isaac Jared Jasper Jordan Keith Kyle Landon Leon Logan Malcolm Marcus Miles Nolan Oliver Owen Parker Quinn Reid Rhys Ross Seth Simon Spencer Trent Tristan Victor Wade Wesley".split(),
           "Female": "Abby Alana Alison Amber Brooke Caitlin Carly Celeste Chloe Claire Daphne Darcy Eden Elise Erin Faith Fiona Gemma Hailey Harper Holly Ivy Jenna Jolene Kara Keira Lacey Leah Lila Lorna Maeve Mallory Maya Megan Molly Nadia Nora Paige Piper Quinn Raina Reese Sadie Sierra Tara Tessa Vera Willa Zoe".split()},
    "FR": {"Male": "Alexis Benoit Cedric Damien Etienne Fabien Gael Hugo Jerome Julien Laurent Mathis Mathieu Olivier Philippe Remi Sebastien Thierry Yannick Xavier".split(),
           "Female": "Amelie Anaelle Brigitte Camille Chantal Elodie Florence Genevieve Helene Josee Juliette Lea Manon Maude Melanie Nathalie Oceane Solene Sylvie Valerie".split()},
    "ES": {"Male": "Adolfo Alonso Armando Benito Cesar Cristian Diego Efrain Emilio Ernesto Fausto Gerardo Guillermo Hector Ignacio Joaquin Julio Leonel Lorenzo Marcelo Mauricio Nestor Octavio Ramiro Raul Rodrigo Ruben Santiago Saul Tomas Ulises Valentin".split(),
           "Female": "Adela Alicia Amparo Aurora Belen Carmela Celia Dalia Elena Esperanza Fabiola Gloria Graciela Ines Irene Jimena Lorena Lucia Marisol Mireya Noemi Olga Paloma Pilar Regina Rocio Rosalia Selena Soledad Teresa Ximena Yolanda".split()},
}
LAST = {
    "EN": "Abbott Aldridge Ashford Barlow Beckett Bramley Calder Carver Chandler Colby Danvers Dawson Eastman Ellery Fairley Fenwick Garrison Gilmore Hadley Halston Harlow Hollis Ingram Jarvis Keane Kendall Lambert Langley Lockwood Mercer Merritt Norwood Oakley Pembrook Prescott Radcliffe Ramsey Rowan Sinclair Stanton Sterling Thorne Upton Vance Whitlock Winslow Yardley".split(),
    "FR": "Arsenault Beaulieu Bellerose Boisvert Charbonneau Desrosiers Dufresne Fontaine Gauthier Lafleur Lalonde Leclair Marchand Pelletier Robichaud Thibodeau Vaillancourt".split(),
    "ES": "Aguirre Arellano Barrera Cabrera Camacho Cervantes Delgado Escobar Espinoza Fuentes Galindo Ibarra Lozano Maldonado Mejia Montoya Navarro Ochoa Orozco Pacheco Quintero Rosales Salazar Solis Trevino Valdez Valenzuela Villarreal Zamora Zavala".split(),
}
rng = random.Random(20261014)
old = d["names"]
oldset = {x.upper() for x in old}
used = set()


def country(i):
    c = (d["jobcode"][i] or "-").split("-")[-1]
    return c if c in ("US", "CA", "MX") else rng.choice(["US", "CA", "MX"])


new = []
for i in range(n):
    c, g = country(i), gen[i] if gen[i] in ("Male", "Female") else rng.choice(["Male", "Female"])
    for _ in range(200):
        if c == "MX":
            first, last = rng.choice(FIRST["ES"][g]), rng.choice(LAST["ES"]) + " " + rng.choice(LAST["ES"])
        elif c == "CA" and rng.random() < .3:
            first, last = rng.choice(FIRST["FR"][g]), rng.choice(LAST["FR"])
        else:
            first, last = rng.choice(FIRST["EN"][g]), rng.choice(LAST["EN" if rng.random() < .85 else "FR"])
        full = (last + ", " + first).upper()
        if full not in used and full not in oldset:
            break
    used.add(full); new.append(full)

fl = lambda s: (s.partition(", ")[2].title() + " " + s.partition(", ")[0].title()).strip()
MAP = {fl(o).lower(): fl(nw) for o, nw in zip(old, new) if o}   # matched without case: "Mcdonald" / "McDonald"
d["names"] = new
d["email"] = [None if not e else (fl(new[i]).split(" ")[0] + "." + fl(new[i]).split(" ")[-1]).lower() + "@meridian-demo.example" for i, e in enumerate(d["email"])]
PF.write_text(base64.b64encode(gzip.compress(json.dumps(d, ensure_ascii=False, separators=(",", ":")).encode(), 9)).decode())

LF = ROOT / "src/data/shared-lite.json"
lite = json.loads(LF.read_text())
missing = set()
for p in lite["people"]:
    for j in (0, 12):
        if isinstance(p[j], str) and p[j]:
            if p[j].lower() in MAP: p[j] = MAP[p[j].lower()]
            else: missing.add(p[j])
lite["chro"] = MAP.get(lite["chro"].lower(), "Morgan Ellery")
LF.write_text(json.dumps(lite, ensure_ascii=False, separators=(",", ":")))

CF = ROOT / "src/modules/comp.html"
t = CF.read_text(encoding="utf-8")
keys = sorted(MAP, key=len, reverse=True)
pat = re.compile(r"(?<![A-Za-z])(" + "|".join(re.escape(k) for k in keys) + r")(?![a-z])", re.I)
t, k = pat.subn(lambda m: MAP[m.group(1).lower()], t)
CF.write_text(t, encoding="utf-8")
print(len(new), "names replaced;", k, "in the Comp Tool;", len(missing), "lite names not found", list(missing)[:5])
