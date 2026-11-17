// Validaciones para formularios profesionales

/**
 * Lleva un teléfono argentino escrito en cualquier formato a sus 10 dígitos nacionales
 * (característica + número, sin 0 ni 15). Acepta, por ejemplo:
 * "+54 9 383 412-3456", "0383 15 412 3456", "(383) 4123456" o "543834123456".
 * Ley de Postel: ser tolerante con lo que la persona escribe y estricto con lo que se guarda.
 * @param {string} phone - Teléfono tal como lo escribió la persona
 * @returns {string|null} - 10 dígitos o null si no se puede interpretar
 */
export const normalizeArgentinePhone = (phone) => {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('54')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('9')) digits = digits.slice(1);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 12) {
    // El «15» va después de la característica, que tiene entre 2 y 4 dígitos
    for (const area of [2, 3, 4]) {
      if (digits.slice(area, area + 2) === '15') {
        digits = digits.slice(0, area) + digits.slice(area + 2);
        break;
      }
    }
  }
  return /^\d{10}$/.test(digits) ? digits : null;
};

/**
 * Valida un celular argentino en cualquier formato habitual.
 * @param {string} phone - Número de teléfono a validar
 * @returns {object} - Objeto con isValid y message
 */
export const validateArgentinePhone = (phone) => {
  if (!String(phone || '').trim()) {
    return { isValid: false, message: 'Ingresá un teléfono' };
  }
  if (!normalizeArgentinePhone(phone)) {
    return {
      isValid: false,
      message: 'Revisá el número: característica + número, por ejemplo 383 412-3456'
    };
  }
  return { isValid: true, message: 'Formato válido' };
};

/**
 * Formatea el número de teléfono para mostrar: +54 9 383 412-3456
 * @param {string} phone - Número de teléfono
 * @returns {string} - Número formateado
 */
export const formatPhoneForDisplay = (phone) => {
  const n = normalizeArgentinePhone(phone);
  if (!n) return phone;
  // Sólo para mostrar: AMBA usa característica de 2 dígitos; para el resto se agrupa de a 3.
  const area = n.startsWith('11') ? 2 : 3;
  return `+54 9 ${n.slice(0, area)} ${n.slice(area, -4)}-${n.slice(-4)}`;
};

/**
 * Limpia el número de teléfono para guardar en base de datos: 54 + 10 dígitos
 * @param {string} phone - Número de teléfono
 * @returns {string} - Número limpio
 */
export const cleanPhoneForStorage = (phone) => {
  const n = normalizeArgentinePhone(phone);
  return n ? `54${n}` : String(phone || '').replace(/\D/g, '');
};
