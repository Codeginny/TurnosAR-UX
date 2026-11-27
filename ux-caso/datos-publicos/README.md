# Datos públicos: ausencias en turnos médicos

La encuesta del caso todavía es simulada (`02-sintesis/*_SIMULADOS*`). Para validar la hipótesis de ausencias (H3) con datos reales se usa **Medical Appointment No Shows** (Kaggle, CC BY-NC-SA 4.0): 110.521 turnos de centros de salud públicos de Vitória, Brasil, entre el 29/04 y el 08/06 de 2016.

- `analizar.py` calcula la ausencia general, según la anticipación del turno y con o sin recordatorio por SMS.
- `resultados.txt` es la salida del script.
- El CSV no se sube al repo (10 MB): se descarga del link del script.

Límites: es salud pública de Brasil, no consultorios privados de Argentina; y el SMS no fue un experimento (no se mandaba a turnos con menos de 3 días), así que la diferencia con y sin SMS es un indicio, no una prueba.
