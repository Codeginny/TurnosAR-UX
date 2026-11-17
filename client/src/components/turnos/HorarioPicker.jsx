import React, { useEffect, useMemo, useRef, useState } from 'react';
import { backendAPI } from '../../api/axiosInstance';

// Horario de atención que ya usaba el turnero: de 8 a 18, turnos de una hora.
export const HORAS = Array.from({ length: 11 }, (_, i) => `${String(8 + i).padStart(2, '0')}:00`);

const toISO = (d) => {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().split('T')[0];
};

// Próximos días hábiles (sin domingos), empezando hoy.
const proximosDias = (cantidad) => {
  const dias = [];
  const d = new Date();
  while (dias.length < cantidad) {
    if (d.getDay() !== 0) dias.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dias;
};

const horaPasada = (fecha, hora) => {
  const [h, m] = hora.split(':').map(Number);
  const [a, mes, dia] = fecha.split('-').map(Number);
  return new Date(a, mes - 1, dia, h, m) <= new Date();
};

/**
 * Muestra los días y los horarios reales de un profesional: libres, ocupados (tachados) y el elegido.
 * Si `sugerir` está activo, preselecciona el primer horario libre para que confirmar sea un solo toque.
 */
const HorarioPicker = ({ profesional, fecha, hora, onChange, sugerir = false, horaActual = null, fechaActual = null }) => {
  const dias = useMemo(() => proximosDias(12), []);
  const [ocupados, setOcupados] = useState([]);
  const [cargando, setCargando] = useState(true);
  // Fecha cuyos ocupados ya llegaron: evita sugerir un horario antes de saber si está libre.
  const [cargadoPara, setCargadoPara] = useState(null);
  const [error, setError] = useState('');
  const fechaElegida = fecha || toISO(dias[0]);
  // Mientras la persona no toque un día, la sugerencia puede saltar al próximo día con lugar.
  const autoAvanzar = useRef(sugerir);

  useEffect(() => {
    if (!profesional) return;
    let vigente = true;
    setCargando(true);
    setError('');
    backendAPI
      .get('/turnos/ocupados', { params: { profesional, fecha: fechaElegida } })
      .then(({ data }) => {
        if (!vigente) return;
        setOcupados(Array.isArray(data) ? data : []);
        setCargadoPara(fechaElegida);
      })
      .catch(() => vigente && setError('No pudimos cargar los horarios. Probá de nuevo.'))
      .finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [profesional, fechaElegida]);

  const estadoDe = (h) => {
    if (fechaElegida === fechaActual && h === horaActual) return 'actual';
    if (ocupados.includes(h) || horaPasada(fechaElegida, h)) return 'ocupado';
    return 'libre';
  };

  // Sugerencia: el primer horario libre del día elegido (Ley de Hick: una opción recomendada).
  useEffect(() => {
    if (!sugerir || cargando || hora || cargadoPara !== fechaElegida) return;
    const libre = HORAS.find(h => estadoDe(h) === 'libre');
    if (libre) {
      onChange({ fecha: fechaElegida, hora: libre });
      autoAvanzar.current = false;
    } else if (autoAvanzar.current) {
      const siguiente = dias.find(d => toISO(d) > fechaElegida);
      if (siguiente) onChange({ fecha: toISO(siguiente), hora: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sugerir, cargando, cargadoPara, ocupados, fechaElegida]);

  if (!profesional) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-4">
        Elegí un profesional para ver sus horarios libres.
      </p>
    );
  }

  const libres = HORAS.filter(h => estadoDe(h) === 'libre').length;

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" role="listbox" aria-label="Día del turno">
        {dias.map(d => {
          const iso = toISO(d);
          const activo = iso === fechaElegida;
          return (
            <button
              key={iso}
              type="button"
              role="option"
              aria-selected={activo}
              onClick={() => { autoAvanzar.current = false; onChange({ fecha: iso, hora: '' }); }}
              className={`flex-shrink-0 w-14 py-2 rounded-xl border text-center transition-colors ${
                activo
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:border-blue-400'
              }`}
            >
              <span className="block text-[11px] uppercase tracking-wide opacity-80">
                {d.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')}
              </span>
              <span className="block text-lg font-semibold leading-tight">{d.getDate()}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-3 mb-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {new Date(`${fechaElegida}T12:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        {!cargando && !error && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {libres === 0 ? 'Sin horarios libres' : `${libres} libre${libres === 1 ? '' : 's'}`}
          </span>
        )}
      </div>

      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" aria-busy={cargando}>
          {HORAS.map(h => {
            if (cargando) {
              return <div key={h} className="h-11 rounded-lg bg-gray-100 dark:bg-slate-700 animate-pulse" />;
            }
            const estado = estadoDe(h);
            const elegido = hora === h && fecha === fechaElegida;
            return (
              <button
                key={h}
                type="button"
                disabled={estado !== 'libre'}
                onClick={() => onChange({ fecha: fechaElegida, hora: h })}
                aria-pressed={elegido}
                title={estado === 'actual' ? 'Tu horario actual' : estado === 'ocupado' ? 'Ocupado' : 'Libre'}
                className={`h-11 rounded-lg border text-sm font-medium transition-colors ${
                  elegido
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                    : estado === 'actual'
                    ? 'border-dashed border-amber-400 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 cursor-not-allowed'
                    : estado === 'ocupado'
                    ? 'border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 line-through bg-gray-50 dark:bg-slate-800 cursor-not-allowed'
                    : 'border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-100 bg-white dark:bg-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                }`}
              >
                {h}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-gray-300 bg-white" />Libre</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-600" />Elegido</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-200" /><s>Ocupado</s></span>
        {horaActual && <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-dashed border-amber-400 bg-amber-50" />Tu turno actual</span>}
      </div>
    </div>
  );
};

export default HorarioPicker;
