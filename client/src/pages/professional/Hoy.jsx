import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, MessageCircle, RefreshCw, CalendarClock, Check, UserX } from 'lucide-react';
import { toast } from 'react-toastify';
import { backendAPI } from '../../api/axiosInstance';
import { HORAS } from '../../components/turnos/HorarioPicker';
import ReprogramarSheet from '../../components/turnos/ReprogramarSheet';

const ESTADOS = {
  pendiente: { label: 'Sin confirmar', dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' },
  confirmado: { label: 'Confirmado', dot: 'bg-green-500', pill: 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
  atendido: { label: 'Atendido', dot: 'bg-blue-500', pill: 'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
  ausente: { label: 'No vino', dot: 'bg-gray-500', pill: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-200' },
  cancelado: { label: 'Cancelado', dot: 'bg-red-500', pill: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-200' }
};

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'pendiente', label: 'Sin confirmar' },
  { id: 'confirmado', label: 'Confirmados' },
  { id: 'cancelado', label: 'Cancelados' }
];

const toISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
const hhmm = (hora) => String(hora || '').slice(0, 5);
const mayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

// Teléfono argentino a formato internacional para wa.me (sin espacios ni guiones).
const telefonoWhatsApp = (tel) => {
  const digitos = String(tel || '').replace(/\D/g, '');
  if (digitos.length < 8) return null;
  return digitos.startsWith('54') ? digitos : `54${digitos.replace(/^0/, '')}`;
};

/**
 * Tablero «Hoy» para la secretaria o el profesional.
 * Abre en el día (no en métricas del mes) y prioriza lo que hay que resolver: los turnos sin confirmar.
 */
const Hoy = () => {
  const [dia, setDia] = useState(() => new Date());
  const [turnos, setTurnos] = useState([]);
  const [estado, setEstado] = useState('cargando'); // cargando | listo | error
  const [filtro, setFiltro] = useState('todos');
  const [reprogramando, setReprogramando] = useState(null);
  const fecha = toISO(dia);
  const esHoy = fecha === toISO(new Date());

  const cargar = useCallback(async () => {
    setEstado('cargando');
    try {
      const { data } = await backendAPI.get('/turnos');
      setTurnos(Array.isArray(data) ? data : []);
      setEstado('listo');
    } catch (err) {
      if (err.response?.status !== 401) setEstado('error');
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const delDia = useMemo(
    () => turnos
      .filter(t => String(t.fecha).slice(0, 10) === fecha)
      .sort((a, b) => hhmm(a.hora).localeCompare(hhmm(b.hora))),
    [turnos, fecha]
  );

  const cuenta = (id) => (id === 'todos' ? delDia.length : delDia.filter(t => t.estado === id).length);
  const visibles = filtro === 'todos' ? delDia : delDia.filter(t => t.estado === filtro);

  const ocupadas = new Set(delDia.filter(t => t.estado !== 'cancelado').map(t => hhmm(t.hora)));
  const ahora = new Date();
  const huecos = HORAS.filter(h => {
    if (ocupadas.has(h)) return false;
    if (!esHoy) return true;
    return Number(h.slice(0, 2)) > ahora.getHours();
  });

  const actualizar = (turno) => setTurnos(prev => prev.map(t => (t.id === turno.id ? { ...t, ...turno } : t)));

  const cambiarEstado = async (turno, nuevo) => {
    try {
      const { data } = await backendAPI.patch(`/turnos/${turno.id}/estado`, { estado: nuevo });
      actualizar(data.turno);
      toast.success(`${turno.paciente_nombre || 'Paciente'}: ${ESTADOS[nuevo].label.toLowerCase()}`);
    } catch (err) {
      if (err.response?.status !== 401) toast.error(err.response?.data?.error || 'No se pudo actualizar el turno');
    }
  };

  const recordatorio = (turno) => {
    const tel = telefonoWhatsApp(turno.paciente_telefono);
    if (!tel) {
      toast.info('Este paciente no tiene un teléfono válido cargado');
      return;
    }
    const nombre = (turno.paciente_nombre || '').split(' ')[0];
    const texto = `Hola ${nombre}, te recordamos tu turno con ${(turno.profesional || '').split(' - ')[0]} `
      + `el ${dia.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${hhmm(turno.hora)}. `
      + '¿Nos confirmás si venís?';
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  };

  const moverDia = (delta) => {
    const d = new Date(dia);
    d.setDate(d.getDate() + delta);
    setDia(d);
    setFiltro('todos');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Encabezado: el día primero (Ley de Jakob: como la agenda de papel de la secretaria) */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{esHoy ? 'Hoy' : 'Agenda del día'}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {mayuscula(dia.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }))}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => moverDia(-1)} aria-label="Día anterior" className="h-10 w-10 rounded-lg border border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">
            <ChevronLeft className="w-5 h-5" />
          </button>
          {!esHoy && (
            <button onClick={() => setDia(new Date())} className="h-10 px-4 rounded-lg border border-gray-300 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">
              Volver a hoy
            </button>
          )}
          <button onClick={() => moverDia(1)} aria-label="Día siguiente" className="h-10 w-10 rounded-lg border border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">
            <ChevronRight className="w-5 h-5" />
          </button>
          <button onClick={cargar} aria-label="Actualizar" className="h-10 w-10 rounded-lg border border-gray-300 dark:border-slate-600 flex items-center justify-center text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700">
            <RefreshCw className={`w-4 h-4 ${estado === 'cargando' ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Resumen en 3 números (Ley de Miller: pocos datos, los que se usan) */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
        {[
          { valor: delDia.filter(t => t.estado !== 'cancelado').length, label: 'Turnos', tono: 'text-gray-900 dark:text-white' },
          { valor: cuenta('pendiente'), label: 'Sin confirmar', tono: 'text-amber-600 dark:text-amber-400' },
          { valor: huecos.length, label: esHoy ? 'Huecos libres que quedan' : 'Huecos libres', tono: 'text-blue-600 dark:text-blue-400' }
        ].map(k => (
          <div key={k.label} className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-slate-700">
            <p className={`text-2xl md:text-3xl font-bold ${k.tono}`}>{estado === 'cargando' ? '–' : k.valor}</p>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2" aria-label="Turnos del día">
          {/* Filtros por estado con cantidad */}
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
            {FILTROS.map(f => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                aria-pressed={filtro === f.id}
                className={`flex-shrink-0 h-9 px-4 rounded-full text-sm font-medium border transition-colors ${
                  filtro === f.id
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:border-blue-400'
                }`}
              >
                {f.label} <span className="opacity-75">({cuenta(f.id)})</span>
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
            {estado === 'cargando' && [0, 1, 2, 3].map(i => (
              <div key={i} className="p-4 flex gap-4 items-center animate-pulse">
                <div className="w-12 h-6 rounded bg-gray-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2"><div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-slate-700" /><div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-slate-700" /></div>
              </div>
            ))}

            {estado === 'error' && (
              <div className="p-8 text-center">
                <p className="text-gray-700 dark:text-gray-200 mb-3">No pudimos cargar la agenda.</p>
                <button onClick={cargar} className="h-10 px-5 rounded-lg bg-blue-600 text-white font-medium">Reintentar</button>
              </div>
            )}

            {estado === 'listo' && visibles.length === 0 && (
              <div className="p-8 text-center text-gray-600 dark:text-gray-300">
                {filtro === 'pendiente'
                  ? 'Todos los turnos del día están confirmados. 🎉'
                  : delDia.length === 0 ? 'No hay turnos para este día.' : 'No hay turnos con este filtro.'}
              </div>
            )}

            {estado === 'listo' && visibles.map(t => {
              const e = ESTADOS[t.estado] || ESTADOS.pendiente;
              const activo = t.estado === 'pendiente' || t.estado === 'confirmado';
              return (
                <div key={t.id} className={`p-4 flex flex-col 2xl:flex-row 2xl:items-center gap-3 ${t.estado === 'cancelado' ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="w-14 text-lg font-bold text-gray-900 dark:text-white tabular-nums">{hhmm(t.hora)}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{t.paciente_nombre || 'Paciente sin nombre'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{t.especialidad}{t.paciente_telefono ? ` · ${t.paciente_telefono}` : ''}</p>
                    </div>
                    {/* Estado con punto + texto: no depende sólo del color (WCAG 1.4.1) */}
                    <span className={`ml-auto flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${e.pill}`}>
                      <span className={`w-2 h-2 rounded-full ${e.dot}`} />{e.label}
                    </span>
                  </div>

                  {activo && (
                    <div className="flex flex-wrap gap-2 sm:pl-[4.5rem] 2xl:pl-0 2xl:justify-end">
                      {t.estado === 'pendiente' ? (
                        <>
                          <button onClick={() => recordatorio(t)} className="h-9 px-3 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 inline-flex items-center gap-1.5">
                            <MessageCircle className="w-4 h-4" />Enviar recordatorio
                          </button>
                          <button onClick={() => cambiarEstado(t, 'confirmado')} className="h-9 px-3 rounded-lg border border-gray-300 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 inline-flex items-center gap-1.5">
                            <Check className="w-4 h-4" />Confirmar
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => cambiarEstado(t, 'atendido')} className="h-9 px-3 rounded-lg border border-gray-300 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 inline-flex items-center gap-1.5">
                            <Check className="w-4 h-4" />Atendido
                          </button>
                          <button onClick={() => cambiarEstado(t, 'ausente')} className="h-9 px-3 rounded-lg border border-gray-300 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 inline-flex items-center gap-1.5">
                            <UserX className="w-4 h-4" />No vino
                          </button>
                        </>
                      )}
                      <button onClick={() => setReprogramando(t)} className="h-9 px-3 rounded-lg border border-gray-300 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 inline-flex items-center gap-1.5">
                        <CalendarClock className="w-4 h-4" />Reprogramar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Huecos libres: para ofrecer a quien llama o para mover un turno */}
        <aside className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 h-fit">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Huecos libres</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Para ofrecer a quien llama o para reubicar un turno.</p>
          {estado === 'cargando' ? (
            <div className="grid grid-cols-3 gap-2">{[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 rounded-lg bg-gray-100 dark:bg-slate-700 animate-pulse" />)}</div>
          ) : huecos.length === 0 ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">No quedan horarios libres{esHoy ? ' hoy' : ' este día'}.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {huecos.map(h => (
                <span key={h} className="h-10 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-sm font-medium flex items-center justify-center">
                  {h}
                </span>
              ))}
            </div>
          )}
        </aside>
      </div>

      {reprogramando && (
        <ReprogramarSheet
          turno={reprogramando}
          onClose={() => setReprogramando(null)}
          onDone={actualizar}
        />
      )}
    </div>
  );
};

export default Hoy;
