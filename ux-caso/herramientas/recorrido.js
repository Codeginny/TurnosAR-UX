// Recorre las pantallas de TurnosAR (copia local) y guarda capturas crudas.
// Uso: node recorrido.js <carpeta_salida>
const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://localhost:5180';
const SALIDA = process.argv[2];
const PROFESIONAL = { email: 'carlos.mendez@turnosar.com', password: 'password123' };
const PACIENTE = { dni: '30000000', password: 'password123' };

async function captura(page, nombre) {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(SALIDA, `${nombre}.png`), fullPage: true });
  console.log('ok', nombre, page.url());
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  for (const [ruta, nombre] of [['/', '01-inicio'], ['/login', '02-login'], ['/soy-paciente', '03-login-paciente'], ['/ruta-que-no-existe', '99-404']]) {
    await page.goto(BASE + ruta);
    await captura(page, nombre);
  }

  // Profesional
  await page.goto(BASE + '/login');
  await page.fill('input[type=email], input[name=email]', PROFESIONAL.email);
  await page.fill('input[type=password]', PROFESIONAL.password);
  await page.click('button[type=submit]');
  await page.waitForTimeout(2500);
  for (const [ruta, nombre] of [['/dashboard', '10-dashboard'], ['/turnos', '11-turnos'], ['/turnos/create', '12-turno-nuevo'], ['/turnero', '13-turnero'], ['/professional/calendar', '14-calendario']]) {
    await page.goto(BASE + ruta);
    await captura(page, nombre);
  }

  // Paciente
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p2 = await ctx2.newPage();
  await p2.goto(BASE + '/soy-paciente');
  const dni = p2.locator('input[name=dni], input[placeholder*="DNI" i]').first();
  if (await dni.count()) await dni.fill(PACIENTE.dni);
  else await p2.fill('input[type=email]', 'paciente1@example.com');
  await p2.fill('input[type=password]', PACIENTE.password);
  await p2.click('button[type=submit]');
  await p2.waitForTimeout(2500);
  await captura(p2, '20-paciente-panel');
  await p2.goto(BASE + '/mis-turnos');
  await captura(p2, '21-mis-turnos');

  // Mobile
  const m = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await m.goto(BASE + '/');
  await captura(m, '30-mobile-inicio');

  await browser.close();
})();
