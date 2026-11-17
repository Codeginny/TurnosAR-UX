# Síntesis y mapa del recorrido

> ⚠️ **DATOS SIMULADOS** — derivado de `respuestas_SIMULADAS.csv`. Se rehace con las respuestas reales.

## Affinity map (agrupación de respuestas)

| Tema | Evidencia | Perfil |
|---|---|---|
| **Visibilidad de horarios** | 40 % no ve horarios libres; «Quisiera ver los horarios libres sin llamar» (6) | Paciente |
| **Canal fragmentado** | 90 % pide por WhatsApp o llamada; «Atiendo teléfono, WhatsApp y mostrador a la vez» | Paciente, Secretaria |
| **Reprogramar es caro** | Facilidad 1,7/5 para secretarias; «tuve que llamar tres veces» | Secretaria, Paciente |
| **Confirmación y ausencias** | 50 % de profesionales pierde 3–5 turnos/semana; 75 % quiere recordatorio por WhatsApp | Profesional, Paciente |
| **Vista del día** | Facilidad 2,7/5; «quiero ver la lista, no el calendario del mes» | Profesional |

## Hallazgos clave
1. **El paciente no puede autogestionar.** Sin horarios visibles, todo pasa por un mensaje y una espera.
2. **Reprogramar es el punto más doloroso del recorrido** para la secretaria (1,7/5) y genera llamadas repetidas.
3. **Las ausencias sin aviso cuestan turnos todas las semanas**, y el recordatorio por WhatsApp es el canal preferido.
4. **El profesional necesita una vista de "hoy"**, no un calendario mensual.

## Mapa del recorrido actual — «Sacar y reprogramar un turno» (paciente + secretaria)

| Etapa | 1. Necesita turno | 2. Pide turno | 3. Espera respuesta | 4. Confirma | 5. Necesita cambiarlo | 6. Día del turno |
|---|---|---|---|---|---|---|
| **Hace** | Busca el contacto del consultorio | Escribe por WhatsApp o llama | Espera; a veces insiste | Recibe un horario y acepta | Vuelve a escribir o llamar | Va (o se olvida) |
| **Piensa** | «¿Tendrán lugar esta semana?» | «Ojalá contesten hoy» | «¿Me habrán leído?» | «¿Quedó anotado?» | «Otra vez a esperar» | «¿Era hoy?» |
| **Secretaria** | — | Recibe por 3 canales | Busca hueco a mano | Anota en agenda | Busca hueco otra vez y borra | Llama a ausentes |
| **Emoción** | 😐 | 🙂 | 😟 | 🙂 | 😣 | 😐 |
| **Fricción** | No ve disponibilidad | Canal fragmentado | Demora | Sin confirmación escrita | **Reprogramar** | Ausencia sin aviso |
| **Oportunidad** | Horarios públicos | Reserva online | Reserva inmediata | Confirmación automática | Reprogramar en 2 toques | Recordatorio por WhatsApp |

## Priorización (impacto × esfuerzo)

| Oportunidad | Impacto | Esfuerzo | Prioridad |
|---|---|---|---|
| Reprogramar en 2 toques (paciente y secretaria) | Alto | Medio | **1** |
| Vista "Hoy" en el tablero con estado de confirmación | Alto | Bajo | **2** |
| Reserva online con horarios visibles | Alto | Medio | **3** |
| Recordatorio por WhatsApp | Alto | Alto (integración) | 4 — siguiente iteración |

## Tareas para el test de usabilidad (Maze)
1. Sacar un turno con la nutricionista para el jueves a la tarde.
2. Reprogramar ese turno al viernes.
3. (Secretaria) Encontrar qué pacientes de hoy no confirmaron.
