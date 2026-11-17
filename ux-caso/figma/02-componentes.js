// Componentes del sistema de diseño de TurnosAR (Plugin API, para Scripter).
// Requiere haber corrido 01-fundamentos.js. Se dibuja en la sección «Sistema de diseño» de la página 02.
// Si se vuelve a correr, borra el tablero anterior «DS · TurnosAR» y lo rehace.

const page = figma.root.children.find(p => p.name.startsWith('02'));
await figma.setCurrentPageAsync(page);
const section = page.children.find(n => n.type === 'SECTION' && n.name === 'Sistema de diseño');
const viejo = section.children.find(n => n.name === 'DS · TurnosAR');
if (viejo) viejo.remove();

for (const s of ['Regular', 'Medium', 'Semi Bold', 'Bold']) await figma.loadFontAsync({ family: 'Inter', style: s });
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const colColor = cols.find(c => c.name === 'Color');
const colNum = cols.find(c => c.name === 'Espaciado y radios');
const V = n => vars.find(v => v.name === n && (v.variableCollectionId === colColor.id || v.variableCollectionId === colNum.id));
const paint = n => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', V('color/' + n));
const TS = await figma.getLocalTextStylesAsync();
const ES = await figma.getLocalEffectStylesAsync();
const radio = (node, n) => { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) node.setBoundVariable(k, V('radius/' + n)); };
const pad = (node, h, v) => {
  node.setBoundVariable('paddingLeft', V('spacing/' + h)); node.setBoundVariable('paddingRight', V('spacing/' + h));
  node.setBoundVariable('paddingTop', V('spacing/' + v)); node.setBoundVariable('paddingBottom', V('spacing/' + v));
};
const gap = (node, n) => node.setBoundVariable('itemSpacing', V('spacing/' + n));

async function txt(chars, estilo, color) {
  const t = figma.createText();
  await t.setTextStyleIdAsync(TS.find(s => s.name === estilo).id);
  t.characters = chars;
  t.fills = [paint(color)];
  return t;
}
function auto(dir, nombre) {
  const f = figma.createAutoLayout(dir, { name: nombre });
  f.fills = [];
  return f;
}
function ap(parent, child, fill) {
  parent.appendChild(child);
  if (fill) child.layoutSizingHorizontal = 'FILL';
  return child;
}
function grilla(set, ancho) {
  set.layoutMode = 'HORIZONTAL';
  set.layoutWrap = 'WRAP';
  set.primaryAxisSizingMode = 'FIXED';
  set.resize(ancho, 100);
  set.counterAxisSizingMode = 'AUTO';
  set.itemSpacing = 16; set.counterAxisSpacing = 16;
  set.paddingLeft = set.paddingRight = set.paddingTop = set.paddingBottom = 24;
  set.fills = [paint('bg/surface')];
  set.strokes = [paint('border/subtle')];
  set.cornerRadius = 16;
}

// ---------- Tablero contenedor ----------
const ds = auto('VERTICAL', 'DS · TurnosAR');
section.appendChild(ds);
ds.x = 40; ds.y = 80;
gap(ds, 8); pad(ds, 8, 8);
ds.fills = [paint('bg/page')];
ds.resize(1400, 100);
ds.primaryAxisSizingMode = 'AUTO';
const ids = { componentes: {} };

async function bloque(titulo, bajada) {
  const b = auto('VERTICAL', titulo);
  ap(ds, b, true);
  gap(b, 4);
  ap(b, await txt(titulo, 'Título', 'text/primary'));
  if (bajada) {
    const t = await txt(bajada, 'Cuerpo', 'text/secondary');
    ap(b, t);
    t.textAutoResize = 'HEIGHT';
    t.layoutSizingHorizontal = 'FILL';
  }
  const cont = auto('HORIZONTAL', 'Contenido');
  ap(b, cont, true);
  cont.layoutWrap = 'WRAP';
  gap(cont, 4);
  cont.counterAxisSpacing = 16;
  return cont;
}

ap(ds, await txt('Sistema de diseño · TurnosAR', 'Display', 'text/primary'));
const intro = await txt('Tokens y componentes sacados del código real (React + Tailwind). Cada color, espaciado y radio está atado a una variable, así un cambio en el token se propaga a todo el producto.', 'Cuerpo', 'text/secondary');
ap(ds, intro); intro.textAutoResize = 'HEIGHT'; intro.layoutSizingHorizontal = 'FILL';

// ---------- Color ----------
const cColor = await bloque('Color', 'Paleta semántica (modo claro). El tema oscuro usa los mismos nombres en la colección «Color oscuro». Regla 60-30-10: fondo neutro, superficies y un solo azul de acento para lo accionable.');
const semanticos = vars.filter(v => v.variableCollectionId === colColor.id && !v.name.includes('annotation'));
for (const v of semanticos) {
  const sw = auto('VERTICAL', v.name);
  ap(cColor, sw);
  gap(sw, 2);
  const r = figma.createRectangle();
  r.resize(150, 64);
  r.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v)];
  r.strokes = [paint('border/subtle')];
  r.cornerRadius = 12;
  sw.appendChild(r);
  ap(sw, await txt(v.name.replace('color/', ''), 'Leyenda', 'text/secondary'));
}

// ---------- Tipografía ----------
const cTipo = await bloque('Tipografía', 'Inter, 7 estilos. Escala corta para que la jerarquía se lea de un vistazo (Ley de Miller).');
const colTipo = auto('VERTICAL', 'Escala');
ap(cTipo, colTipo, true);
gap(colTipo, 3);
for (const s of TS) {
  const t = await txt(`${s.name} · ${s.fontSize}/${s.lineHeight.value} · Turnos sin llamar al consultorio`, s.name, 'text/primary');
  ap(colTipo, t);
}

// ---------- Espaciado y radios ----------
const cEsp = await bloque('Espaciado y radios', 'Grilla de 8 pt (con 4 y 12 para ajustes finos). Zona táctil mínima de 44 px (Ley de Fitts).');
for (const n of ['1', '2', '3', '4', '6', '8']) {
  const it = auto('VERTICAL', 'spacing/' + n);
  ap(cEsp, it); gap(it, 2);
  const r = figma.createRectangle();
  r.resize(4, 32);
  r.setBoundVariable('width', V('spacing/' + n));
  r.fills = [paint('bg/accent')];
  r.cornerRadius = 2;
  it.appendChild(r);
  ap(it, await txt(`spacing/${n} · ${n * 4}px`, 'Leyenda', 'text/secondary'));
}
for (const n of ['md', 'lg', 'xl', 'sheet', 'full']) {
  const it = auto('VERTICAL', 'radius/' + n);
  ap(cEsp, it); gap(it, 2);
  const r = figma.createRectangle();
  r.resize(64, 48);
  radio(r, n);
  r.fills = [paint('bg/accent-subtle')];
  r.strokes = [paint('border/accent')];
  it.appendChild(r);
  ap(it, await txt('radius/' + n, 'Leyenda', 'text/secondary'));
}

// ---------- Componentes ----------
const cComp = await bloque('Componentes', 'Cada componente cubre sus estados. Los que dependen del estado del turno muestran punto + texto, nunca sólo color (WCAG 1.4.1).');
cComp.layoutWrap = 'NO_WRAP';
cComp.layoutMode = 'VERTICAL';
gap(cComp, 6);

async function etiqueta(cont, titulo) {
  ap(cont, await txt(titulo, 'Etiqueta', 'text/secondary'));
}

// Botón
await etiqueta(cComp, 'Botón · Estilo × Estado');
const botones = [];
const estilosBoton = {
  Primario: ['bg/accent', 'text/on-accent', null],
  Secundario: ['bg/surface', 'text/primary', 'border/default'],
  Peligro: ['bg/danger', 'text/danger', null],
};
for (const [estilo, [bg, fg, borde]] of Object.entries(estilosBoton)) {
  for (const estado of ['Normal', 'Deshabilitado']) {
    const c = figma.createComponent();
    c.name = `Estilo=${estilo}, Estado=${estado}`;
    c.layoutMode = 'HORIZONTAL';
    c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
    c.resize(140, 44);
    c.primaryAxisSizingMode = 'AUTO';
    c.counterAxisSizingMode = 'FIXED';
    c.setBoundVariable('height', V('size/touch'));
    pad(c, 4, 3); gap(c, 2); radio(c, 'lg');
    c.fills = [paint(bg)];
    if (borde) { c.strokes = [paint(borde)]; c.strokeWeight = 1; }
    if (estado === 'Deshabilitado') c.opacity = 0.5;
    c.appendChild(await txt('Botón', 'Cuerpo destacado', fg));
    botones.push(c);
  }
}
const setBoton = figma.combineAsVariants(botones, cComp);
setBoton.name = 'Botón';
grilla(setBoton, 1300);
const kBoton = setBoton.addComponentProperty('Texto', 'TEXT', 'Botón');
for (const v of setBoton.children) v.findOne(n => n.type === 'TEXT').componentPropertyReferences = { characters: kBoton };
setBoton.description = 'Una sola acción primaria por pantalla o fila (Von Restorff). Alto mínimo 44 px. Deshabilitado = 50 % de opacidad.';
ids.componentes.Boton = setBoton.id;

// Píldora de estado
await etiqueta(cComp, 'Píldora de estado del turno');
const pildoras = [];
const estadosTurno = {
  'Sin confirmar': ['bg/warning', 'status/warning', 'text/warning'],
  Confirmado: ['bg/success', 'status/success', 'text/success'],
  Cancelado: ['bg/danger', 'status/danger', 'text/danger'],
  Atendido: ['bg/accent-subtle', 'status/info', 'text/accent'],
  'No vino': ['bg/subtle', 'status/neutral', 'text/secondary'],
};
for (const [estado, [bg, punto, fg]] of Object.entries(estadosTurno)) {
  const c = figma.createComponent();
  c.name = `Estado=${estado}`;
  c.layoutMode = 'HORIZONTAL';
  c.counterAxisAlignItems = 'CENTER';
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
  pad(c, 3, 1); gap(c, 2); radio(c, 'full');
  c.fills = [paint(bg)];
  const dot = figma.createEllipse();
  dot.resize(8, 8);
  dot.fills = [paint(punto)];
  c.appendChild(dot);
  c.appendChild(await txt(estado, 'Leyenda', fg));
  pildoras.push(c);
}
const setPildora = figma.combineAsVariants(pildoras, cComp);
setPildora.name = 'Píldora de estado';
grilla(setPildora, 1300);
setPildora.description = 'Estado con punto + texto: el color ayuda, pero nunca es la única señal (WCAG 1.4.1).';
ids.componentes.Pildora = setPildora.id;

// Chip de horario
await etiqueta(cComp, 'Chip de horario');
const chips = [];
const estadosChip = {
  Libre: ['bg/surface', 'border/default', 'text/primary', false],
  Elegido: ['bg/accent', 'border/accent', 'text/on-accent', false],
  Ocupado: ['bg/subtle', 'border/subtle', 'text/disabled', true],
  'Turno actual': ['bg/warning', 'border/current', 'text/warning', false],
};
for (const [estado, [bg, borde, fg, tachado]] of Object.entries(estadosChip)) {
  const c = figma.createComponent();
  c.name = `Estado=${estado}`;
  c.layoutMode = 'HORIZONTAL';
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
  c.resize(104, 44);
  c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'FIXED';
  radio(c, 'md');
  c.fills = [paint(bg)];
  c.strokes = [paint(borde)];
  if (estado === 'Turno actual') c.dashPattern = [4, 3];
  const t = await txt('17:00', 'Cuerpo destacado', fg);
  if (tachado) t.textDecoration = 'STRIKETHROUGH';
  c.appendChild(t);
  chips.push(c);
}
const setChip = figma.combineAsVariants(chips, cComp);
setChip.name = 'Chip de horario';
grilla(setChip, 1300);
const kHora = setChip.addComponentProperty('Hora', 'TEXT', '17:00');
for (const v of setChip.children) v.findOne(n => n.type === 'TEXT').componentPropertyReferences = { characters: kHora };
setChip.description = 'Ocupado y ya pasado: tachado y sin interacción (Nielsen 5, prevención de errores). Turno actual: borde punteado ámbar.';
ids.componentes.Chip = setChip.id;

// Chip de día
await etiqueta(cComp, 'Chip de día');
const dias = [];
for (const estado of ['Normal', 'Elegido']) {
  const c = figma.createComponent();
  c.name = `Estado=${estado}`;
  c.layoutMode = 'VERTICAL';
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER';
  c.resize(56, 56);
  c.primaryAxisSizingMode = 'FIXED'; c.counterAxisSizingMode = 'FIXED';
  radio(c, 'lg');
  const el = estado === 'Elegido';
  c.fills = [paint(el ? 'bg/accent' : 'bg/surface')];
  c.strokes = [paint(el ? 'border/accent' : 'border/subtle')];
  c.appendChild(await txt('LUN', 'Etiqueta', el ? 'text/on-accent' : 'text/secondary'));
  c.appendChild(await txt('16', 'Subtítulo', el ? 'text/on-accent' : 'text/primary'));
  dias.push(c);
}
const setDia = figma.combineAsVariants(dias, cComp);
setDia.name = 'Chip de día';
grilla(setDia, 1300);
const kDiaS = setDia.addComponentProperty('Día', 'TEXT', 'LUN');
const kDiaN = setDia.addComponentProperty('Número', 'TEXT', '16');
for (const v of setDia.children) {
  const ts = v.findAll(n => n.type === 'TEXT');
  ts[0].componentPropertyReferences = { characters: kDiaS };
  ts[1].componentPropertyReferences = { characters: kDiaN };
}
ids.componentes.Dia = setDia.id;

// Campo de formulario
await etiqueta(cComp, 'Campo de formulario · validación en línea');
const campos = [];
const estadosCampo = {
  Normal: ['border/default', 'Le enviamos la confirmación del turno.', 'text/secondary', 'nombre@mail.com'],
  Error: ['border/danger', 'Revisá el email: falta la @ o el dominio (ej. nombre@mail.com)', 'text/danger', 'ana.gomez@mail'],
  Válido: ['border/accent', 'Le enviamos la confirmación del turno.', 'text/secondary', 'ana.gomez@mail.com'],
};
for (const [estado, [borde, ayuda, colorAyuda, valor]] of Object.entries(estadosCampo)) {
  const c = figma.createComponent();
  c.name = `Estado=${estado}`;
  c.layoutMode = 'VERTICAL';
  c.resize(360, 100);
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED';
  gap(c, 1);
  c.fills = [];
  c.appendChild(await txt('Email *', 'Cuerpo destacado', 'text/primary'));
  const caja = figma.createAutoLayout('HORIZONTAL', { name: 'Caja' });
  caja.counterAxisAlignItems = 'CENTER';
  caja.resize(360, 44);
  caja.counterAxisSizingMode = 'FIXED';
  c.appendChild(caja);
  caja.layoutSizingHorizontal = 'FILL';
  pad(caja, 3, 2); radio(caja, 'md');
  caja.fills = [paint(estado === 'Error' ? 'bg/danger' : 'bg/surface')];
  caja.strokes = [paint(borde)];
  caja.strokeWeight = estado === 'Normal' ? 1 : 2;
  const val = await txt(valor, 'Cuerpo', 'text/primary');
  caja.appendChild(val);
  val.layoutSizingHorizontal = 'FILL';
  if (estado !== 'Normal') {
    const ic = await txt(estado === 'Error' ? '!' : '✓', 'Cuerpo destacado', estado === 'Error' ? 'text/danger' : 'text/success');
    caja.appendChild(ic);
  }
  const msg = await txt(ayuda, 'Leyenda', colorAyuda);
  c.appendChild(msg);
  msg.textAutoResize = 'HEIGHT';
  msg.layoutSizingHorizontal = 'FILL';
  campos.push(c);
}
const setCampo = figma.combineAsVariants(campos, cComp);
setCampo.name = 'Campo';
grilla(setCampo, 1300);
setCampo.description = 'Error debajo del campo al salir de él (Nielsen 9), con ícono + color + texto que dice cómo arreglarlo.';
ids.componentes.Campo = setCampo.id;

// Tarjeta de turno (usa Píldora y Botón)
await etiqueta(cComp, 'Tarjeta de turno · compuesta');
const variante = (set, nombre) => set.children.find(c => c.name === nombre);
const tarjeta = figma.createComponent();
tarjeta.name = 'Tarjeta de turno';
tarjeta.layoutMode = 'VERTICAL';
tarjeta.resize(358, 100);
tarjeta.primaryAxisSizingMode = 'AUTO'; tarjeta.counterAxisSizingMode = 'FIXED';
pad(tarjeta, 4, 4); gap(tarjeta, 3); radio(tarjeta, 'xl');
tarjeta.fills = [paint('bg/surface')];
tarjeta.strokes = [paint('border/subtle')];
await tarjeta.setEffectStyleIdAsync(ES.find(e => e.name === 'Sombra/tarjeta').id);
const cab = auto('HORIZONTAL', 'Encabezado');
ap(tarjeta, cab, true);
cab.primaryAxisAlignItems = 'SPACE_BETWEEN';
const tit = auto('VERTICAL', 'Títulos');
cab.appendChild(tit);
tit.appendChild(await txt('Cardiología', 'Subtítulo', 'text/primary'));
tit.appendChild(await txt('Dr. Carlos Méndez', 'Cuerpo', 'text/secondary'));
cab.appendChild(variante(setPildora, 'Estado=Confirmado').createInstance());
const meta = await txt('Vie 20 de noviembre · 10:00 · Sanatorio Pasteur', 'Cuerpo', 'text/primary');
ap(tarjeta, meta, true);
meta.textAutoResize = 'HEIGHT';
const acciones = auto('HORIZONTAL', 'Acciones');
ap(tarjeta, acciones, true);
gap(acciones, 2);
const bRep = variante(setBoton, 'Estilo=Primario, Estado=Normal').createInstance();
acciones.appendChild(bRep);
bRep.layoutSizingHorizontal = 'FILL';
bRep.setProperties({ [kBoton]: 'Reprogramar' });
const bCan = variante(setBoton, 'Estilo=Secundario, Estado=Normal').createInstance();
acciones.appendChild(bCan);
bCan.setProperties({ [kBoton]: 'Cancelar' });
cComp.appendChild(tarjeta);
tarjeta.description = 'Toque 1 del flujo de reprogramar: la acción principal vive en la misma tarjeta.';
ids.componentes.Tarjeta = tarjeta.id;

// Ajustar la sección al contenido
section.resizeWithoutConstraints(Math.max(section.width, ds.width + 80), ds.height + 160);
ids.tablero = ds.id;
ids.medidas = { ancho: Math.round(ds.width), alto: Math.round(ds.height) };
print('LISTO componentes', JSON.stringify(ids));
