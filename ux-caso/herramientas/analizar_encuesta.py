"""Resume el CSV de la encuesta (real o simulado) en Markdown.

Uso: python analizar_encuesta.py <respuestas.csv>
"""
import csv
import sys
from collections import Counter
from statistics import mean


def pct(n, total):
    return f"{round(100 * n / total)} %" if total else "—"


def tabla(titulo, contador, total):
    lineas = [f"\n**{titulo}** (n = {total})\n", "| Respuesta | n | % |", "|---|---|---|"]
    for clave, n in contador.most_common():
        lineas.append(f"| {clave} | {n} | {pct(n, total)} |")
    return "\n".join(lineas)


def main(ruta):
    filas = list(csv.DictReader(open(ruta, encoding="utf-8")))
    simulado = "SIMULAD" in ruta.upper()
    por_rol = {r: [f for f in filas if f["rol"] == r] for r in ("Paciente", "Profesional", "Secretaria")}
    out = ["# Resultados de la encuesta"]
    if simulado:
        out.append("\n> ⚠️ **DATOS SIMULADOS** — sólo para probar el análisis. No usar en el portafolio.")
    out.append(f"\nTotal: {len(filas)} respuestas · " +
               " · ".join(f"{r}: {len(v)}" for r, v in por_rol.items()))

    p = por_rol["Paciente"]
    out.append("\n## Pacientes")
    out.append(tabla("Canal del último turno", Counter(f["canal"] for f in p), len(p)))
    out.append(f"\nFacilidad promedio: **{mean(int(f['facilidad']) for f in p):.1f} / 5**")
    molestias = Counter(m for f in p for m in f["molestias"].split(";"))
    out.append(tabla("Lo más molesto (2 por persona)", molestias, len(p)))
    out.append(tabla("Tuvo que reprogramar", Counter(f["reprogramo"] for f in p), len(p)))
    out.append(tabla("Recordatorio preferido", Counter(f["recordatorio"] for f in p), len(p)))

    pr = por_rol["Profesional"]
    out.append("\n## Profesionales")
    out.append(tabla("Turnos perdidos por semana", Counter(f["turnos_perdidos_semana"] for f in pr), len(pr)))
    out.append(f"\nFacilidad para ver el día: **{mean(int(f['facilidad_ver_dia']) for f in pr):.1f} / 5**")

    s = por_rol["Secretaria"]
    out.append("\n## Secretarias")
    out.append(tabla("Tarea más tediosa", Counter(f["tarea_tediosa"] for f in s), len(s)))
    out.append(f"\nFacilidad para reprogramar: **{mean(int(f['facilidad_reprogramar']) for f in s):.1f} / 5**")

    out.append("\n## Citas (respuesta abierta)")
    for rol, v in por_rol.items():
        for c, n in Counter(f["comentario"] for f in v).most_common(3):
            out.append(f"- *«{c}»* — {rol} ({n})")
    print("\n".join(out))


if __name__ == "__main__":
    main(sys.argv[1])
