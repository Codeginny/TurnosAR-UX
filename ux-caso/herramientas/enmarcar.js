// Enmarca una captura cruda (recorte opcional) con bordes redondeados y sombra.
// Uso: node enmarcar.js <entrada.png> <salida.png> [y] [alto]
const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const [entrada, salida, y = 0, alto = 0] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  const src = 'data:image/png;base64,' + fs.readFileSync(entrada).toString('base64');
  const recorte = Number(alto) ? `height:${alto}px;overflow:hidden;` : '';
  await page.setContent(`<html><body style="margin:0;background:linear-gradient(135deg,#F5F3FF,#E0F2FE);display:inline-block;padding:56px">
    <div style="${recorte}border-radius:24px;box-shadow:0 24px 60px rgba(76,29,149,.25),0 0 0 1px rgba(14,165,233,.25);max-width:1488px">
    <img src="${src}" style="display:block;max-width:1488px;margin-top:-${y}px"></div></body></html>`);
  const body = await page.locator('body').boundingBox();
  await page.setViewportSize({ width: Math.ceil(body.width), height: Math.ceil(body.height) });
  await page.locator('body').screenshot({ path: salida });
  await browser.close();
})();
