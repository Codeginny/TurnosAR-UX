"""Genera respuestas SIMULADAS de la encuesta para probar el análisis.

Se reemplazan por el CSV real exportado de Google Forms (mismas columnas).
"""
import csv
import random
from pathlib import Path

random.seed(17)
SALIDA = Path(__file__).resolve().parent.parent / "02-sintesis" / "respuestas_SIMULADAS.csv"

COLUMNAS = ["rol", "edad", "frecuencia", "canal", "facilidad", "molestias",
            "reprogramo", "recordatorio", "turnos_perdidos_semana",
            "facilidad_ver_dia", "tarea_tediosa", "facilidad_reprogramar", "comentario"]

COMENTARIOS = {
    "Paciente": [
        "Escribo por WhatsApp y me contestan al otro día",
        "Quisiera ver los horarios libres sin llamar",
        "Para cambiar el turno tuve que llamar tres veces",
        "No me llegó confirmación y no sabía si tenía turno",
        "Me gustaría un recordatorio el día anterior",
    ],
    "Profesional": [
        "Pierdo turnos porque la gente no avisa",
        "Necesito ver quién confirmó antes de empezar el día",
        "Uso Google Calendar y la secretaria otra agenda",
        "Al empezar el día quiero ver la lista, no el calendario del mes",
    ],
    "Secretaria": [
        "Reprogramar me lleva mucho, tengo que buscar huecos a mano",
        "Atiendo teléfono, WhatsApp y mostrador a la vez",
        "Se me mezclan las agendas de los profesionales",
        "Confirmar uno por uno por WhatsApp me lleva la mañana",
    ],
}


def elegir(opciones, pesos):
    return random.choices(opciones, weights=pesos)[0]


def fila(rol):
    f = dict.fromkeys(COLUMNAS, "")
    f["rol"] = rol
    f["edad"] = elegir(["18-29", "30-44", "45-59", "60+"], [3, 4, 3, 2])
    f["comentario"] = random.choice(COMENTARIOS[rol])
    if rol == "Paciente":
        f["frecuencia"] = elegir(["Una vez por mes", "Pocas veces por año"], [2, 5])
        f["canal"] = elegir(["WhatsApp", "Llamada", "Web o app", "Presencial"], [9, 5, 3, 2])
        f["facilidad"] = elegir([1, 2, 3, 4, 5], [1, 3, 5, 3, 1])
        f["molestias"] = ";".join(random.sample(
            ["Esperar respuesta", "No ver horarios libres", "Llamar en horario de atención",
             "No recibir confirmación", "Formularios largos"], k=2))
        f["reprogramo"] = elegir(["Sí", "No"], [6, 4])
        f["recordatorio"] = elegir(["Sí, por WhatsApp", "Sí, por mail", "No"], [8, 2, 1])
    elif rol == "Profesional":
        f["frecuencia"] = "Varias veces por día"
        f["turnos_perdidos_semana"] = elegir(["0", "1-2", "3-5", "Más de 5"], [1, 4, 4, 1])
        f["facilidad_ver_dia"] = elegir([1, 2, 3, 4, 5], [1, 3, 4, 2, 1])
    else:
        f["frecuencia"] = "Varias veces por día"
        f["tarea_tediosa"] = elegir(["Reprogramar", "Buscar huecos libres", "Confirmar asistencia",
                                     "Coordinar varias agendas"], [5, 3, 3, 2])
        f["facilidad_reprogramar"] = elegir([1, 2, 3, 4, 5], [3, 4, 2, 1, 0])
    return f


def main():
    roles = ["Paciente"] * 20 + ["Profesional"] * 6 + ["Secretaria"] * 6
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    with SALIDA.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=COLUMNAS)
        w.writeheader()
        for rol in roles:
            w.writerow(fila(rol))
    print(f"{len(roles)} respuestas simuladas -> {SALIDA}")


if __name__ == "__main__":
    main()
