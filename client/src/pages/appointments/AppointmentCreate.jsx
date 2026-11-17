import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppointmentContext } from '../../context/AppointmentContext.jsx';
import Swal from 'sweetalert2';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { validateArgentinePhone, formatPhoneForDisplay, cleanPhoneForStorage } from '../../utils/validations';

const initialState = {
  patientName: '',
  email: '',
  phone: '',
  professional: 'Dr. General',
  datetime: '',
  status: 'Pendiente',
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Una regla por campo obligatorio: devuelve el mensaje de error o '' si está bien.
const REGLAS = {
  patientName: (v) => (v.trim().length < 3 ? 'Escribí nombre y apellido del paciente' : ''),
  email: (v) => (!v.trim() ? 'Ingresá un email' : !emailRegex.test(v.trim()) ? 'Revisá el email: falta la @ o el dominio (ej. nombre@mail.com)' : ''),
  phone: (v) => validateArgentinePhone(v).isValid ? '' : validateArgentinePhone(v).message,
  datetime: (v) => (!v ? 'Elegí fecha y hora' : new Date(v) <= new Date() ? 'Elegí una fecha y hora que todavía no haya pasado' : ''),
};

const AppointmentCreate = () => {
  const { createAppointment } = useContext(AppointmentContext);
  const [form, setForm] = useState(initialState);
  // Se valida al salir de cada campo (no mientras se escribe) y todo junto al enviar.
  const [tocados, setTocados] = useState({});
  const navigate = useNavigate();

  const errores = Object.fromEntries(Object.entries(REGLAS).map(([campo, regla]) => [campo, regla(form[campo])]));
  const visible = (campo) => (tocados[campo] ? errores[campo] : '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTocados((t) => ({ ...t, [name]: true }));
    // El teléfono se reescribe en un formato prolijo apenas es válido
    if (name === 'phone' && !REGLAS.phone(form.phone)) {
      setForm((p) => ({ ...p, phone: formatPhoneForDisplay(p.phone) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTocados({ patientName: true, email: true, phone: true, datetime: true });
    const primero = Object.keys(REGLAS).find((campo) => errores[campo]);
    if (primero) {
      document.getElementById(`campo-${primero}`)?.focus();
      return;
    }
    const pay = await Swal.fire({
      title: 'Pago online',
      text: 'Elegí modalidad de pago',
      icon: 'question',
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: 'Pago completo',
      denyButtonText: 'Seña',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563eb',
    });
    if (!pay.isConfirmed && !pay.isDenied) return;
    const selectedPayment = pay.isConfirmed ? 'Pago completo' : 'Seña';
    await createAppointment({ ...form, phone: cleanPhoneForStorage(form.phone), payment: selectedPayment });
    navigate('/turnos');
  };

  const claseInput = (campo) => {
    const base = 'w-full border rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 transition-colors';
    if (visible(campo)) return `${base} border-red-400 focus:ring-red-200 bg-red-50/40`;
    if (tocados[campo] && !errores[campo]) return `${base} border-green-500 focus:ring-green-200`;
    return `${base} border-gray-300 focus:ring-blue-300`;
  };

  // Etiqueta, campo, ícono de estado, ayuda y error, conectados para lectores de pantalla.
  // Se llama como función (no como componente) para que el input no se vuelva a montar y pierda el foco.
  const campo = ({ nombre, label, ayuda, obligatorio = true, input }) => (
    <div>
      <label htmlFor={`campo-${nombre}`} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {obligatorio && <span className="text-red-600 ml-0.5" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        {input}
        {visible(nombre) && <AlertCircle className="w-5 h-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />}
        {obligatorio && tocados[nombre] && !errores[nombre] && <CheckCircle className="w-5 h-5 text-green-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />}
      </div>
      {visible(nombre) ? (
        <p id={`error-${nombre}`} className="mt-1 text-sm text-red-600" role="alert">{visible(nombre)}</p>
      ) : ayuda ? (
        <p id={`ayuda-${nombre}`} className="mt-1 text-xs text-gray-500">{ayuda}</p>
      ) : null}
    </div>
  );

  const props = (nombre) => ({
    id: `campo-${nombre}`,
    name: nombre,
    value: form[nombre],
    onChange: handleChange,
    onBlur: handleBlur,
    className: claseInput(nombre),
    'aria-required': true,
    'aria-invalid': !!visible(nombre),
    'aria-describedby': visible(nombre) ? `error-${nombre}` : `ayuda-${nombre}`,
  });

  return (
    <div className="py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold text-blue-700 mb-1">Crear turno</h1>
        <p className="text-sm text-gray-500 mb-5">Los campos con <span className="text-red-600">*</span> son obligatorios.</p>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {campo({
            nombre: 'patientName', label: 'Nombre del paciente',
            input: <input autoComplete="name" {...props('patientName')} />,
          })}
          {campo({
            nombre: 'email', label: 'Email', ayuda: 'Le enviamos la confirmación del turno.',
            input: <input type="email" autoComplete="email" inputMode="email" {...props('email')} />,
          })}
          <div className="grid md:grid-cols-2 gap-4">
            {campo({
              nombre: 'phone', label: 'Teléfono', ayuda: 'Como lo tengas: con o sin 0, 15 o +54.',
              input: <input type="tel" autoComplete="tel" inputMode="tel" placeholder="383 412-3456" {...props('phone')} />,
            })}
            {campo({
              nombre: 'professional', label: 'Profesional', obligatorio: false,
              input: <input id="campo-professional" name="professional" value={form.professional} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300" />,
            })}
          </div>
          {campo({
            nombre: 'datetime', label: 'Fecha y hora',
            input: <input type="datetime-local" {...props('datetime')} />,
          })}
          <div>
            <label htmlFor="campo-status" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select id="campo-status" name="status" value={form.status} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option>Pendiente</option>
              <option>Confirmado</option>
              <option>Cancelado</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => navigate('/turnos')} className="px-4 py-2 rounded-lg border">Cancelar</button>
            <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700">Crear</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentCreate;
