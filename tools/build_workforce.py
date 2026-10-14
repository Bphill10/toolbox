#!/usr/bin/env python3
"""Build src/data/workforce.json from the demo people file (src/data/shared-people.b64).

Per job: active headcount, average pay (USD), market midpoint, 12-month turnover.
Org: every active person with title, location and supervisor, for the org chart.
Run after the people file changes:  python3 tools/build_workforce.py
"""
import base64, gzip, json, struct
from collections import Counter, defaultdict
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


sta, loc = st("sta"), st("loc")
supix = arr(d["supix"], "I", 4)
usd = arr(d["pay"]["annualUsd"], "f", 4)
p0 = base64.b64decode(d["pres0"]); p1 = base64.b64decode(d["pres1"])
months = d["months"]; M = len(months)


def present(i, m):
    if m < 32:
        return (struct.unpack_from("<I", p0, i * 4)[0] >> m) & 1
    return (struct.unpack_from("<I", p1, i * 4)[0] >> (m - 32)) & 1


roles = {r["k"]: r for r in lite["roles"]}
job = [(d["jobcode"][i] or "").split("-")[0] for i in range(n)]
win = range(M - 12, M)          # last 12 months
stats = defaultdict(lambda: {"hc": 0, "pay": 0.0, "terms": 0, "hcm": 0, "ratio": 0.0, "rn": 0})
CTRY = {"US": "USA", "CA": "CANADA", "MX": "MEXICO"}
for i in range(n):
    k = job[i]
    s = stats[k]
    s["hcm"] += sum(present(i, m) for m in win)
    if sta[i] == "Active":
        s["hc"] += 1; s["pay"] += usd[i]
        r = roles.get(k); c = CTRY.get((d["jobcode"][i] or "-").split("-")[-1])
        if r and c and r["mc"].get(c):
            s["ratio"] += usd[i] / r["mc"][c]; s["rn"] += 1
    elif sta[i] == "Terminated":
        last = max((m for m in range(M) if present(i, m)), default=-1)
        if M - 13 <= last < M - 1:
            s["terms"] += 1
jobs = []
for k, s in stats.items():
    r = roles.get(k)
    if not r or not s["hc"]:
        continue
    avg_hc = s["hcm"] / 12
    jobs.append({"k": k, "t": r["t"], "tw": r["tw"], "g": r["g"], "cat": r["cat"], "hourly": bool(r["hr"]),
                 "hc": s["hc"], "pay": round(s["pay"] / s["hc"]), "mid": r["mid"],
                 "turnover": round(100 * s["terms"] / avg_hc, 1) if avg_hc else 0, "ratio": round(s["ratio"] / s["rn"], 3) if s["rn"] else None, "next": r["next"], "lead": bool(r.get("lead"))})

act = [i for i in range(n) if sta[i] == "Active"]
idx = {p: j for j, p in enumerate(act)}
org = [[d["names"][i], roles.get(job[i], {}).get("t", job[i]), loc[i], idx.get(supix[i], -1), job[i]] for i in act]
out = {"asof": d["asof"], "window": months[M - 12] + " to " + months[M - 1], "jobs": sorted(jobs, key=lambda j: (j["tw"], -j["hc"])), "org": org}
(ROOT / "src/data/workforce.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")))
print(len(jobs), "jobs,", len(org), "people")
