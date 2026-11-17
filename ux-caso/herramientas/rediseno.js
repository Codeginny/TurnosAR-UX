// Recorre las pantallas del rediseño ya implementado (vista «Hoy», horarios visibles y reprogramar)
// y guarda capturas crudas. Uso: node rediseno.js <carpeta_salida> [--confirmar]
// Con --confirmar también aprieta «Confirmar» en la hoja de reprogramar (modifica la base local).
const { chromium } = require('playwright');
const path = require('path');

const BASE = 'http://localhost:5180';
const SALIDA = process.argv[2];
const CONFIRMAR = process.argv.includes('--confirmar');
const PROFESIONAL = { email: 'carlos.mendez@turnosar.com', password: 'password123' };
const PACIENTE = { dni: '30000000', password: 'password123' };

async function captura(page, nombre, fullPage = true) {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(SALIDA, `${nombre}.png`), fullPage });
  console.log('ok', nombre, page.url());
}

function vigilar(page, etiqueta) {
  page.on('console', m => m.type() === 'error' && console.log(`[${etiqueta}] console.error:`, m.text().slice(0, 200)));
  page.on('pageerror', e => console.log(`[${etiqueta}] pageerror:`, e.message.slice(0, 200)));
}

async function loginPaciente(page) {
  await page.goto(BASE + '/soy-paciente');
  await page.locator('input[name=dni], input[placeholder*="DNI" i]').first().fill(PACIENTE.dni);
  await page.fill('input[type=password]', PACIENTE.password);
  await page.click('button[type=submit]');
  await page.waitForTimeout(2500);
}

// Elige la primera opción válida de un select y espera a que se carguen las dependientes.
async function elegir(page, name) {
  const select = page.locator(`select[name=${name}]`);
  await select.waitFor();
  await page.waitForFunction(n => {
    const s = document.querySelector(`select[name=${n}]`);
    return s && !s.disabled && [...s.options].some(o => o.value && !o.disabled);
  }, name, { timeout: 8000 });
  const valor = await select.evaluate(s => [...s.options].find(o => o.value && !o.disabled).value);
  await select.selectOption(valor);
  await page.waitForTimeout(400);
}

(async () => {
  const browser = await chromium.launch();

  // Profesional / secretaria: entra directo al día
  const prof = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  vigilar(prof, 'prof');
  await prof.goto(BASE + '/login');
  await prof.fill('input[type=email], input[name=email]', PROFESIONAL.email);
  await prof.fill('input[type=password]', PROFESIONAL.password);
  await prof.click('button[type=submit]');
  await prof.waitForURL('**/professional/hoy', { timeout: 8000 });
  await captura(prof, '40-hoy');
  await prof.getByRole('button', { name: /^Sin confirmar/ }).click();
  await captura(prof, '41-hoy-sin-confirmar');

  // Paciente: horarios visibles al sacar turno
  const pac = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  vigilar(pac, 'pac');
  await loginPaciente(pac);
  for (const n of ['provincia', 'clinica', 'especialidad', 'profesional']) await elegir(pac, n);
  await pac.waitForTimeout(1200);
  await captura(pac, '42-sacar-turno-horarios');

  // Mis turnos + hoja de reprogramar (desktop)
  await pac.goto(BASE + '/patient-dashboard?tab=mis-turnos');
  await pac.waitForTimeout(1500);
  await captura(pac, '43-mis-turnos');
  await pac.getByRole('button', { name: 'Reprogramar' }).first().click();
  await captura(pac, '44-reprogramar', false);

  // Mobile: la misma hoja desde abajo, con el botón en la zona del pulgar
  const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mov = await ctxM.newPage();
  vigilar(mov, 'mobile');
  await loginPaciente(mov);
  await mov.goto(BASE + '/patient-dashboard?tab=mis-turnos');
  await mov.waitForTimeout(1500);
  await captura(mov, '45-mis-turnos-mobile', false);
  await mov.getByRole('button', { name: 'Reprogramar' }).first().click();
  await captura(mov, '46-reprogramar-mobile', false);
  if (CONFIRMAR) {
    await mov.getByRole('button', { name: /^Confirmar \d/ }).click();
    await captura(mov, '47-reprogramado-mobile', false);
  }

  await browser.close();
})();
