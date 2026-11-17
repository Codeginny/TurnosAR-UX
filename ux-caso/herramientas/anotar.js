// Capturas anotadas de TurnosAR: contorno y etiqueta celeste numerada sobre cada elemento,
// y después la captura enmarcada con bordes redondeados y sombra.
// Uso: node anotar.js <carpeta_salida> [nombre_captura]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:5180';
const SALIDA = process.argv[2];
const SOLO = process.argv[3];

const CELESTE = '#0EA5E9';

async function loginProfesional(page) {
  await page.goto(BASE + '/login');
  await page.fill('input[type=email]', 'carlos.mendez@turnosar.com');
  await page.fill('input[type=password]', 'password123');
  await page.click('button[type=submit]');
  await page.waitForURL(/dashboard|turnos|professional/, { timeout: 10000 }).catch(() => {});
}

async function loginPaciente(page) {
  await page.goto(BASE + '/soy-paciente');
  const dni = page.locator('input[name=dni], input[placeholder*="DNI" i]').first();
  if (await dni.count()) await dni.fill('30000000');
  await page.fill('input[type=password]', 'password123');
  await page.click('button[type=submit]');
  await page.waitForURL(/patient-dashboard/, { timeout: 10000 }).catch(() => {});
}

// Completa provincia, clínica, especialidad y profesional con la primera opción válida.
async function elegirProfesional(page) {
  for (const name of ['provincia', 'clinica', 'especialidad', 'profesional']) {
    await page.waitForFunction(n => {
      const s = document.querySelector(`select[name=${n}]`);
      return s && !s.disabled && [...s.options].some(o => o.value && !o.disabled);
    }, name, { timeout: 8000 });
    const select = page.locator(`select[name=${name}]`);
    await select.selectOption(await select.evaluate(s => [...s.options].find(o => o.value && !o.disabled).value));
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(1200);
}

// t: texto exacto | s: selector CSS; n: índice si hay varias coincidencias
// accion: pasos previos a la captura (clics, formularios)
// pos: dónde va la etiqueta respecto del elemento; pad: margen del contorno
const CAPTURAS = [
  {
    nombre: 'ux-01-dashboard-resumen', login: loginProfesional, ruta: '/dashboard', clip: [0, 80, 1440, 1000],
    notas: [
      { t: 'Resumen del Día', sube: 'div', niveles: 1, label: '1 · Ley de Miller', pos: 'right', dy: 110 },
      { t: 'Período de Análisis', sube: 'div', niveles: 1, label: '2 · Ley de Jakob + Hick', pos: 'top' },
      { t: 'Ingresos del mes', sube: 'div', niveles: 2, label: '3 · Gestalt: región común', pos: 'top', dx: 125 },
      { t: 'Excel', sube: 'button', niveles: 0, label: '4 · Nielsen 7: eficiencia', pos: 'left' },
      { t: 'Activo', label: '5 · Nielsen 1: estado visible', pos: 'right' },
      { t: 'Calendario', sube: 'div', niveles: 1, label: '6 · Reconocer antes que recordar', pos: 'right' },
    ],
  },
  {
    nombre: 'ux-02-dashboard-estados', login: loginProfesional, ruta: '/dashboard', ancla: 'Cancelados', clipAlto: 1320, clipX: 290, clipW: 1150,
    notas: [
      { t: 'Confirmados', exacto: true, n: 1, sube: 'div', niveles: 2, label: '1 · Gestalt: similitud por color', pos: 'top' },
      { t: 'Confirmar', n: 0, sube: 'button', niveles: 0, label: '2 · Fitts + Von Restorff', pos: 'left' },
      { t: 'Paciente 8', sube: 'div', niveles: 1, label: '3 · Estado con texto, no sólo color', pos: 'right' },
      { t: 'Horarios del Día', sube: 'div', niveles: 1, label: '4 · Nielsen 1: visibilidad del estado', pos: 'top' },
    ],
  },
  {
    nombre: 'ux-03-matriz-capacidad', login: loginProfesional, ruta: '/dashboard', ancla: 'Matriz de Capacidad Operativa', anclaParcial: true, clipAlto: 620, clipX: 380, clipW: 1060,
    notas: [
      { t: 'Matriz de Capacidad Operativa', sube: 'div', niveles: 2, label: '1 · Ley de Tesler: el sistema absorbe la complejidad', pos: 'top' },
      { t: 'Saturado', exacto: true, sube: 'div', niveles: 2, label: '2 · La leyenda nombra cada color', pos: 'top' },
    ],
  },
  {
    nombre: 'ux-04-turnero', login: loginProfesional, ruta: '/turnero', clip: [0, 40, 1440, 760],
    notas: [
      { t: 'Provincia', sube: 'div', niveles: 1, label: '1 · Oportunidad: 4 selectores antes de ver horarios', pos: 'left', alerta: true },
      { t: 'Días disponibles', sube: 'div', niveles: 1, label: '2 · Reconocer antes que recordar', pos: 'right' },
      { t: 'Solicitar turno', exacto: true, n: 0, sube: 'button', niveles: 0, label: '3 · Nielsen 5: prevención de errores', pos: 'right' },
    ],
  },
  {
    nombre: 'ux-05-crear-turno', login: loginProfesional, ruta: '/turnos/create', clip: [0, 40, 1440, 680],
    notas: [
      { t: 'Cancelar', sube: 'button', niveles: 0, label: '1 · Nielsen 3: control y libertad', pos: 'left' },
      { t: 'Crear', exacto: true, sube: 'button', niveles: 0, label: '2 · Von Restorff: una sola acción primaria', pos: 'right' },
      { s: 'input[type=datetime-local]', label: '3 · Ley de Jakob: control nativo', pos: 'right' },
      { t: 'Nombre del paciente', sube: 'div', niveles: 1, label: '4 · Oportunidad: marcar obligatorios y validar en línea', pos: 'left', alerta: true },
    ],
  },
  {
    nombre: 'ux-06-paciente-modal', login: loginPaciente, ruta: null, clip: [0, 0, 1440, 900],
    notas: [
      { t: 'Requisitos de la contraseña:', sube: 'div', niveles: 1, label: '1 · Nielsen 5: reglas a la vista', pos: 'right' },
      { s: 'input[type=password]', n: 0, label: '2 · Mostrar/ocultar: Ley de Postel', pos: 'left' },
      { t: 'Cambiar Contraseña Ahora', sube: 'button', niveles: 0, label: '3 · Gestalt: figura-fondo', pos: 'right' },
      { t: 'No podrás usar la plataforma hasta que cambies tu contraseña', label: '4 · Oportunidad: sin salida (Nielsen 3)', pos: 'left', alerta: true },
    ],
  },
  {
    nombre: 'ux-07-error-404', login: null, ruta: '/ruta-que-no-existe', clip: [0, 60, 1440, 760],
    notas: [
      { t: 'Ir al Inicio', sube: 'button', niveles: 0, label: '1 · Nielsen 9: salida clara del error', pos: 'right' },
      { s: 'h1, h2', n: 0, label: '2 · Oportunidad: el título desborda la tarjeta', pos: 'left', alerta: true },
    ],
  },
  {
    nombre: 'ux-08-modo-oscuro', login: loginProfesional, ruta: '/dashboard', oscuro: true, clip: [0, 0, 1440, 900],
    notas: [
      { s: 'button[aria-label="Cambiar tema"]', n: 0, label: '1 · Modo claro / oscuro', pos: 'bottom', dx: -120 },
      { t: 'Período de Análisis', sube: 'div', niveles: 1, label: '2 · Regla 60-30-10: fondo, tarjetas y acento', pos: 'top', dx: 240 },
    ],
  },
  // Después: el rediseño ya implementado en la copia de TurnosAR
  {
    nombre: 'ux-09-hoy', login: loginProfesional, ruta: '/professional/hoy', clip: [256, 70, 1184, 640],
    accion: page => page.getByRole('button', { name: /^Sin confirmar/ }).click(),
    notas: [
      { s: 'h1', n: 0, label: '1 · Ley de Jakob: abre en el día, como la agenda', pos: 'right' },
      { t: 'Sin confirmar', exacto: true, n: 1, label: '2 · Estado con punto + texto (WCAG 1.4.1)', pos: 'left', dy: -18 },
      { t: 'Enviar recordatorio', n: 1, sube: 'button', niveles: 1, label: '3 · Von Restorff: una acción primaria por fila', pos: 'bottom' },
      { t: 'Huecos libres', exacto: true, sube: 'aside', niveles: 1, label: '4 · Huecos a la vista para ofrecer', pos: 'bottom' },
    ],
  },
  {
    nombre: 'ux-10-horarios-visibles', login: loginPaciente, ruta: null, accion: elegirProfesional,
    ancla: 'Día y horario', clipArriba: 98, clipAlto: 430, clipX: 100, clipW: 1240,
    notas: [
      { s: '[role=listbox]', label: '1 · Los días aparecen apenas elegís profesional', pos: 'top', dx: 160 },
      { s: 'button[title="Ocupado"]', n: 2, label: '2 · Ocupado tachado: no se puede elegir (Nielsen 5)', pos: 'top', dx: -160 },
      { s: 'button[title="Libre"]', n: -1, label: '3 · Botones de 44 px (Ley de Fitts)', pos: 'right' },
    ],
  },
  {
    nombre: 'ux-11-reprogramar', login: loginPaciente, ruta: '/patient-dashboard?tab=mis-turnos', ancla: 'Reprogramar turno', clipArriba: 50, clipAlto: 530, clipX: 80, clipW: 1180,
    accion: async page => { await page.getByRole('button', { name: 'Reprogramar' }).first().click(); await page.waitForTimeout(1500); },
    notas: [
      { t: 'Reprogramar turno', exacto: true, label: '1 · Toque 1: «Reprogramar» abre esta hoja', pos: 'left' },
      { t: 'Tu turno actual:', label: '2 · Contexto: qué turno se mueve', pos: 'right' },
      { s: '[aria-busy]', label: '3 · Horario ya sugerido: el primero libre (Hick)', pos: 'left' },
      { s: 'button:has-text("Confirmar")', n: -1, label: '4 · Toque 2: confirmar (Fitts)', pos: 'right' },
      { t: 'Volver', exacto: true, label: '5 · Salida clara (Nielsen 3)', pos: 'left' },
    ],
  },
  {
    nombre: 'ux-14-formulario', login: loginProfesional, ruta: '/turnos/create', clip: [0, 40, 1440, 760],
    accion: async page => {
      await page.fill('#campo-patientName', 'An');
      await page.fill('#campo-email', 'ana.gomez@mail');
      await page.fill('#campo-phone', '0383 15 412 3456');
      await page.click('#campo-datetime');
      await page.click('h1');
    },
    notas: [
      { t: 'Los campos con', label: '1 · Obligatorios marcados con *', pos: 'right' },
      { s: '#campo-email', label: '2 · Error en línea, al salir del campo (Nielsen 9)', pos: 'left' },
      { s: '#campo-phone', label: '3 · Postel: «0383 15…» → +54 9 383…', pos: 'left' },
      { s: '#campo-patientName', label: '4 · Dice qué falta y cómo arreglarlo', pos: 'right' },
    ],
  },
  {
    nombre: 'ux-15-modal-salida', login: loginPaciente, ruta: null, ancla: 'Ahora no, cerrar sesión', clipArriba: 560, clipAlto: 680, clipX: 260, clipW: 920,
    notas: [
      { t: 'Ahora no, cerrar sesión', label: '1 · Salida explícita (Nielsen 3)', pos: 'right' },
    ],
  },
  {
    nombre: 'ux-16-error-404', login: null, ruta: '/ruta-que-no-existe', ancla: '404', clipArriba: 110, clipAlto: 420, clipX: 220, clipW: 1220,
    notas: [
      { t: 'Página no encontrada', exacto: true, label: '1 · Título dentro de la tarjeta, en dos niveles', pos: 'right' },
      { t: 'Ir al Inicio', label: '2 · Una sola salida (Nielsen 9)', pos: 'right' },
    ],
  },
];

async function caja(page, nota) {
  let loc;
  if (nota.s) loc = page.locator(nota.s);
  else loc = page.getByText(nota.t, { exact: !!nota.exacto });
  loc = loc.nth(nota.n || 0);
  if (nota.sube && nota.niveles) {
    for (let i = 0; i < nota.niveles; i++) loc = loc.locator('xpath=..');
  }
  await loc.scrollIntoViewIfNeeded().catch(() => {});
  const handle = await loc.elementHandle({ timeout: 5000 }).catch(() => null);
  if (!handle) return null;
  return page.evaluate(el => {
    const r = el.getBoundingClientRect();
    return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
  }, handle);
}

async function dibujar(page, cajas) {
  await page.evaluate(({ cajas, CELESTE }) => {
    const capa = document.createElement('div');
    capa.style.cssText = 'position:absolute;left:0;top:0;width:100%;pointer-events:none;z-index:2147483647';
    document.body.appendChild(capa);
    for (const c of cajas) {
      const color = c.alerta ? '#F59E0B' : CELESTE;
      const pad = 6;
      const marco = document.createElement('div');
      marco.style.cssText = `position:absolute;left:${c.x - pad}px;top:${c.y - pad}px;width:${c.w + pad * 2}px;height:${c.h + pad * 2}px;border:3px solid ${color};border-radius:14px;box-shadow:0 0 0 4px ${color}33`;
      capa.appendChild(marco);
      const et = document.createElement('div');
      et.textContent = c.label;
      et.style.cssText = `position:absolute;white-space:nowrap;background:${color};color:#fff;font:600 15px/1 Inter,system-ui,sans-serif;padding:9px 16px;border-radius:999px;box-shadow:0 6px 16px rgba(14,165,233,.35)`;
      capa.appendChild(et);
      const ew = et.offsetWidth, eh = et.offsetHeight;
      let x, y;
      if (c.pos === 'top') { x = c.x; y = c.y - pad - eh - 10; }
      else if (c.pos === 'bottom') { x = c.x; y = c.y + c.h + pad + 10; }
      else if (c.pos === 'left') { x = c.x - pad - ew - 14; y = c.y + c.h / 2 - eh / 2; }
      else { x = c.x + c.w + pad + 14; y = c.y + c.h / 2 - eh / 2; }
      x += c.dx; y += c.dy;
      x = Math.max(8, Math.min(x, document.documentElement.clientWidth - ew - 8));
      et.style.left = x + 'px';
      et.style.top = Math.max(8, y) + 'px';
    }
  }, { cajas, CELESTE });
}

async function enmarcar(browser, crudo, final) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const src = 'data:image/png;base64,' + fs.readFileSync(crudo).toString('base64');
  await page.setContent(`<html><body style="margin:0;background:linear-gradient(135deg,#F5F3FF,#E0F2FE);display:inline-block;padding:56px">
    <img src="${src}" style="display:block;max-width:1488px;border-radius:24px;box-shadow:0 24px 60px rgba(76,29,149,.25),0 0 0 1px rgba(14,165,233,.25)"></body></html>`);
  const body = await page.locator('body').boundingBox();
  await page.setViewportSize({ width: Math.ceil(body.width), height: Math.ceil(body.height) });
  await page.locator('body').screenshot({ path: final });
  await page.close();
}

(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const browser = await chromium.launch();
  for (const cap of CAPTURAS) {
    if (process.argv[4] && CAPTURAS.indexOf(cap) < CAPTURAS.findIndex(c => c.nombre === process.argv[4])) continue;
    if (SOLO && cap.nombre !== SOLO) continue;
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    if (cap.login) await cap.login(page);
    if (cap.ruta) await page.goto(BASE + cap.ruta);
    await page.waitForTimeout(2000);
    if (cap.accion) {
      await cap.accion(page);
      await page.waitForTimeout(800);
    }
    if (cap.oscuro) {
      await page.locator('button[aria-label="Cambiar tema"]').first().click();
      await page.waitForTimeout(800);
    }
    let clip;
    if (cap.ancla) {
      const a = await caja(page, { t: cap.ancla, exacto: !cap.anclaParcial });
      clip = { x: cap.clipX || 0, y: Math.max(0, a.y - (cap.clipArriba || 90)), width: cap.clipW || 1440, height: cap.clipAlto };
    } else {
      const [x, y, w, h] = cap.clip;
      clip = { x, y, width: w, height: h };
    }
    await page.evaluate(() => scrollTo(0, 0));
    const cajas = [];
    for (const n of cap.notas) {
      const c = await caja(page, n);
      if (c) cajas.push({ ...c, label: n.label, pos: n.pos, alerta: n.alerta, dx: n.dx || 0, dy: n.dy || 0 });
      else console.warn('  sin elemento:', n.label);
    }
    await page.evaluate(() => scrollTo(0, 0));
    await dibujar(page, cajas);
    const crudo = path.join(SALIDA, `${cap.nombre}.crudo.png`);
    await page.screenshot({ path: crudo, clip, fullPage: true });
    await enmarcar(browser, crudo, path.join(SALIDA, `${cap.nombre}.png`));
    fs.unlinkSync(crudo);
    console.log('ok', cap.nombre, `${cajas.length}/${cap.notas.length} etiquetas`);
    await ctx.close();
  }
  await browser.close();
})();
