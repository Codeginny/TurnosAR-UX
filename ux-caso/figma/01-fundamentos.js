// Fundamentos del sistema de diseño de TurnosAR para Figma (Plugin API).
// Se puede correr con el conector de Figma o pegando el código en el plugin Scripter.
const pages = figma.root.children.map(p => ({ id: p.id, name: p.name }));
const hex = h => { const n = parseInt(h.slice(1), 16); return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 }; };
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const allVars = await figma.variables.getLocalVariablesAsync();
const getCol = (name, modes) => {
  let c = cols.find(c => c.name === name);
  if (!c) {
    c = figma.variables.createVariableCollection(name);
    c.renameMode(c.modes[0].modeId, modes[0]);
    for (const m of modes.slice(1)) c.addMode(m);
  }
  return c;
};
const getVar = (name, col, type) => allVars.find(v => v.name === name && v.variableCollectionId === col.id) || figma.variables.createVariable(name, col, type);
const out = { collections: {}, variables: {} };

// Primitivos (paleta Tailwind que usa el código)
const P = getCol('Primitivos', ['Valor']);
const prim = {
  'white': '#FFFFFF', 'blue/50': '#EFF6FF', 'blue/100': '#DBEAFE', 'blue/400': '#60A5FA', 'blue/600': '#2563EB', 'blue/700': '#1D4ED8', 'blue/900': '#1E3A8A',
  'gray/50': '#F9FAFB', 'gray/100': '#F3F4F6', 'gray/200': '#E5E7EB', 'gray/300': '#D1D5DB', 'gray/400': '#9CA3AF', 'gray/500': '#6B7280', 'gray/700': '#374151', 'gray/900': '#111827',
  'slate/600': '#475569', 'slate/700': '#334155', 'slate/800': '#1E293B', 'slate/900': '#0F172A',
  'green/50': '#F0FDF4', 'green/500': '#22C55E', 'green/800': '#166534', 'green/900': '#14532D',
  'amber/50': '#FFFBEB', 'amber/400': '#FBBF24', 'amber/500': '#F59E0B', 'amber/800': '#92400E', 'amber/900': '#78350F',
  'red/50': '#FEF2F2', 'red/500': '#EF4444', 'red/700': '#B91C1C', 'red/900': '#7F1D1D',
  'sky/500': '#0EA5E9'
};
const pv = {};
for (const [k, h] of Object.entries(prim)) {
  const v = getVar(k, P, 'COLOR'); v.setValueForMode(P.modes[0].modeId, hex(h)); v.scopes = [];
  v.setVariableCodeSyntax('WEB', `var(--${k.replace('/', '-')})`); pv[k] = v;
}
out.collections.Primitivos = P.id;

// Color semántico. El plan gratis de Figma admite un solo modo por colección,
// así que el tema oscuro va en una colección aparte con los mismos nombres.
const C = getCol('Color', ['Claro']);
const CD = getCol('Color oscuro', ['Oscuro']);
const [L, D] = [C.modes[0].modeId, CD.modes[0].modeId];
const getVarD = (name) => allVars.find(v => v.name === name && v.variableCollectionId === CD.id) || figma.variables.createVariable(name, CD, 'COLOR');
const sem = {
  'bg/page': ['gray/50', 'slate/900', ['FRAME_FILL']],
  'bg/surface': ['white', 'slate/800', ['FRAME_FILL', 'SHAPE_FILL']],
  'bg/subtle': ['gray/100', 'slate/700', ['FRAME_FILL', 'SHAPE_FILL']],
  'bg/accent': ['blue/600', 'blue/600', ['FRAME_FILL', 'SHAPE_FILL']],
  'bg/accent-hover': ['blue/700', 'blue/700', ['FRAME_FILL', 'SHAPE_FILL']],
  'bg/accent-subtle': ['blue/50', 'blue/900', ['FRAME_FILL', 'SHAPE_FILL']],
  'bg/success': ['green/50', 'green/900', ['FRAME_FILL', 'SHAPE_FILL']],
  'bg/warning': ['amber/50', 'amber/900', ['FRAME_FILL', 'SHAPE_FILL']],
  'bg/danger': ['red/50', 'red/900', ['FRAME_FILL', 'SHAPE_FILL']],
  'text/primary': ['gray/900', 'white', ['TEXT_FILL']],
  'text/secondary': ['gray/500', 'gray/400', ['TEXT_FILL']],
  'text/disabled': ['gray/400', 'slate/600', ['TEXT_FILL']],
  'text/on-accent': ['white', 'white', ['TEXT_FILL']],
  'text/accent': ['blue/600', 'blue/400', ['TEXT_FILL']],
  'text/success': ['green/800', 'green/50', ['TEXT_FILL']],
  'text/warning': ['amber/800', 'amber/50', ['TEXT_FILL']],
  'text/danger': ['red/700', 'red/50', ['TEXT_FILL']],
  'border/default': ['gray/300', 'slate/600', ['STROKE_COLOR']],
  'border/subtle': ['gray/200', 'slate/700', ['STROKE_COLOR']],
  'border/accent': ['blue/600', 'blue/400', ['STROKE_COLOR']],
  'border/danger': ['red/500', 'red/500', ['STROKE_COLOR']],
  'border/current': ['amber/400', 'amber/400', ['STROKE_COLOR']],
  'status/success': ['green/500', 'green/500', ['SHAPE_FILL']],
  'status/warning': ['amber/500', 'amber/500', ['SHAPE_FILL']],
  'status/danger': ['red/500', 'red/500', ['SHAPE_FILL']],
  'status/info': ['blue/600', 'blue/400', ['SHAPE_FILL']],
  'status/neutral': ['gray/500', 'gray/400', ['SHAPE_FILL']],
  'annotation': ['sky/500', 'sky/500', ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR']]
};
for (const [k, [l, d, scopes]] of Object.entries(sem)) {
  const v = getVar('color/' + k, C, 'COLOR');
  v.setValueForMode(L, { type: 'VARIABLE_ALIAS', id: pv[l].id });
  v.scopes = scopes;
  const vd = getVarD('color/' + k);
  vd.setValueForMode(D, { type: 'VARIABLE_ALIAS', id: pv[d].id });
  vd.scopes = scopes;
  vd.setVariableCodeSyntax('WEB', `var(--color-${k.replace('/', '-')})`);
  v.setVariableCodeSyntax('WEB', `var(--color-${k.replace('/', '-')})`);
  out.variables['color/' + k] = v.id;
}
out.collections.Color = C.id; out.collections['Color oscuro'] = CD.id;

// Espaciado (grilla de 4/8 pt) y radios
const S = getCol('Espaciado y radios', ['Valor']);
const nums = {
  'spacing/1': [4, ['GAP', 'WIDTH_HEIGHT']], 'spacing/2': [8, ['GAP']], 'spacing/3': [12, ['GAP']], 'spacing/4': [16, ['GAP']],
  'spacing/6': [24, ['GAP']], 'spacing/8': [32, ['GAP']],
  'radius/md': [8, ['CORNER_RADIUS']], 'radius/lg': [12, ['CORNER_RADIUS']], 'radius/xl': [16, ['CORNER_RADIUS']],
  'radius/sheet': [24, ['CORNER_RADIUS']], 'radius/full': [999, ['CORNER_RADIUS']],
  'size/touch': [44, ['WIDTH_HEIGHT']]
};
for (const [k, [n, scopes]] of Object.entries(nums)) {
  const v = getVar(k, S, 'FLOAT'); v.setValueForMode(S.modes[0].modeId, n); v.scopes = scopes;
  v.setVariableCodeSyntax('WEB', `var(--${k.replace('/', '-')})`);
  out.variables[k] = v.id;
}
out.collections['Espaciado y radios'] = S.id;

// Estilos de texto (Inter)
const fonts = (await figma.listAvailableFontsAsync()).filter(f => f.fontName.family === 'Inter').map(f => f.fontName.style);
const ts = await figma.getLocalTextStylesAsync();
const textDefs = [
  ['Display', 30, 36, 'Bold'], ['Título', 20, 28, 'Bold'], ['Subtítulo', 16, 24, 'Semi Bold'],
  ['Cuerpo', 14, 20, 'Regular'], ['Cuerpo destacado', 14, 20, 'Semi Bold'], ['Leyenda', 12, 16, 'Regular'], ['Etiqueta', 11, 14, 'Medium']
];
out.textStyles = {};
for (const [name, size, lh, style] of textDefs) {
  await figma.loadFontAsync({ family: 'Inter', style });
  const s = ts.find(t => t.name === name) || figma.createTextStyle();
  s.name = name; s.fontName = { family: 'Inter', style }; s.fontSize = size; s.lineHeight = { unit: 'PIXELS', value: lh };
  if (name === 'Etiqueta') { s.textCase = 'UPPER'; s.letterSpacing = { unit: 'PERCENT', value: 4 }; }
  out.textStyles[name] = s.id;
}
const es = await figma.getLocalEffectStylesAsync();
const sh = es.find(e => e.name === 'Sombra/tarjeta') || figma.createEffectStyle();
sh.name = 'Sombra/tarjeta';
sh.effects = [{ type: 'DROP_SHADOW', color: { r: 0.06, g: 0.09, b: 0.16, a: 0.08 }, offset: { x: 0, y: 2 }, radius: 8, spread: 0, visible: true, blendMode: 'NORMAL' }];
const sh2 = es.find(e => e.name === 'Sombra/hoja') || figma.createEffectStyle();
sh2.name = 'Sombra/hoja';
sh2.effects = [{ type: 'DROP_SHADOW', color: { r: 0.06, g: 0.09, b: 0.16, a: 0.25 }, offset: { x: 0, y: -8 }, radius: 32, spread: 0, visible: true, blendMode: 'NORMAL' }];
out.effectStyles = { tarjeta: sh.id, hoja: sh2.id };
out.pages = pages; out.interStyles = fonts;
print('LISTO fundamentos', JSON.stringify({vars: Object.keys(out.variables).length, textos: Object.keys(out.textStyles).length, fuentes: fonts.join(',')}));