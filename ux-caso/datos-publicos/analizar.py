"""Ausencias en 110.526 turnos reales (Medical Appointment No Shows, Kaggle, CC BY-NC-SA 4.0).

Descarga: https://www.kaggle.com/datasets/joniarroba/noshowappointments
Guardar el CSV como turnos-no-show-vitoria-2016.csv en esta carpeta y correr: python3 analizar.py
"""
import collections
import csv
import datetime as dt

turnos = [r for r in csv.DictReader(open('turnos-no-show-vitoria-2016.csv')) if int(r['Age']) >= 0]


def dias_de_anticipacion(r):
    return (dt.date.fromisoformat(r['AppointmentDay'][:10]) - dt.date.fromisoformat(r['ScheduledDay'][:10])).days


def ausencia(rs):
    return sum(r['No-show'] == 'Yes' for r in rs) / len(rs) * 100


for r in turnos:
    r['anticipacion'] = dias_de_anticipacion(r)
turnos = [r for r in turnos if r['anticipacion'] >= 0]

print(f'Turnos: {len(turnos)} · ausencia general: {ausencia(turnos):.1f} %')

print('\nAusencia según anticipación')
for desde, hasta, nombre in [(0, 0, 'Mismo día'), (1, 2, '1 a 2 días'), (3, 7, '3 a 7 días'),
                             (8, 14, '8 a 14 días'), (15, 30, '15 a 30 días'), (31, 10_000, 'Más de 30 días')]:
    grupo = [r for r in turnos if desde <= r['anticipacion'] <= hasta]
    print(f'  {nombre:<15} {len(grupo):>6} turnos  {ausencia(grupo):.1f} %')

print('\nRecordatorio por SMS (turnos con 3 días o más; antes no se mandaban)')
lejanos = [r for r in turnos if r['anticipacion'] >= 3]
for valor, nombre in [('1', 'Con SMS'), ('0', 'Sin SMS')]:
    grupo = [r for r in lejanos if r['SMS_received'] == valor]
    print(f'  {nombre:<8} {len(grupo):>6} turnos  {ausencia(grupo):.1f} %')

faltas = collections.Counter(r['PatientId'] for r in turnos if r['No-show'] == 'Yes')
print(f'\nPacientes con 2 faltas o más: {sum(v >= 2 for v in faltas.values())}')
