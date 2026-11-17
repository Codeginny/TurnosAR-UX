import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { backendAPI } from '../../api/axiosInstance';
import HorarioPicker from './HorarioPicker';

const fechaLarga = (fecha) =>
  new Date(`${String(fecha).slice(0, 10)}T12:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

/**
 * Hoja inferior para reprogramar un turno.
 * Toque 1: «Reprogramar» en la tarjeta abre esta hoja con el primer horario libre ya sugerido.
 * Toque 2: «Confirmar nuevo horario». Sin llamar ni escribir al consultorio.
 */
const ReprogramarSheet = ({ turno, onClose, onDone }) => {
  const profesional = (turno.profesional || '').split(' - ')[0];
  const fechaActual = String(turno.fecha).slice(0, 10);
  const horaActual = String(turno.hora || '').slice(0, 5);
  const [eleccion, setEleccion] = useState({ fecha: '', hora: '' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [listo, setListo] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const confirmar = async () => {
    setEnviando(true);
    setError('');
    try {
      const { data } = await backendAPI.patch(`/turnos/${turno.id}/reprogramar`, eleccion);
      setListo(data.turno);
      onDone(data.turno);
    } catch (err) {
      if (err.response?.status === 409) {
        setError(err.response.data.error);
        setEleccion(prev => ({ ...prev, hora: '' }));
      } else if (err.response?.status !== 401) {
        setError(err.response?.data?.error || 'No pudimos reprogramar el turno. Probá de nuevo.');
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reprogramar-titulo"
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="sm:hidden flex justify-center pt-3"><span className="w-10 h-1.5 rounded-full bg-gray-300 dark:bg-slate-600" /></div>

        {listo ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h3 id="reprogramar-titulo" className="text-xl font-bold text-gray-900 dark:text-white mb-2">Listo, tu turno cambió</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-1">
              {profesional}: <strong>{fechaLarga(listo.fecha)}</strong> a las <strong>{String(listo.hora).slice(0, 5)}</strong>.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">El consultorio ya ve el cambio en su agenda. No hace falta llamar.</p>
            <button onClick={onClose} className="w-full h-12 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700">
              Entendido
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 id="reprogramar-titulo" className="text-xl font-bold text-gray-900 dark:text-white">Reprogramar turno</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {profesional} · Tu turno actual: {fechaLarga(fechaActual)}, {horaActual}
                </p>
              </div>
              <button onClick={onClose} aria-label="Cerrar" className="p-2 -m-2 text-gray-500 hover:text-gray-700 dark:text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <HorarioPicker
              profesional={profesional}
              fecha={eleccion.fecha}
              hora={eleccion.hora}
              onChange={setEleccion}
              sugerir
              fechaActual={fechaActual}
              horaActual={horaActual}
            />

            {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}

            <div className="sticky bottom-0 bg-white dark:bg-slate-800 pt-4 mt-4 border-t border-gray-100 dark:border-slate-700 flex gap-3">
              <button onClick={onClose} className="h-12 px-5 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 font-medium">
                Volver
              </button>
              <button
                onClick={confirmar}
                disabled={!eleccion.hora || enviando}
                className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enviando ? 'Guardando…' : eleccion.hora ? `Confirmar ${eleccion.hora}` : 'Elegí un horario'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReprogramarSheet;
