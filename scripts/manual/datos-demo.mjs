/**
 * Datos de demostración para las capturas del manual (W-034).
 *
 * **Solo contra una base aislada local**: crea usuarios, fincas, labores,
 * pesajes, remitos y lecturas, y ajusta algunas filas por SQL (vigencias de
 * costos con fecha pasada, histórico de telemetría) que la API no permite.
 * Ver README.md. Variables: MANUAL_API_URL, MANUAL_DB_CONTENEDOR, MANUAL_DB,
 * MANUAL_ENV (el .env del backend, de donde sale IOT_API_KEY).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const API = process.env.MANUAL_API_URL ?? 'http://localhost:3000/api';
const PASS = 'Terravid123!';
const IOT_KEY = readFileSync(process.env.MANUAL_ENV ?? new URL('../../../Backend/.env', import.meta.url), 'utf8').match(/^IOT_API_KEY=(.*)$/m)[1].trim();

function sql(q) {
  return execFileSync('docker', ['exec', process.env.MANUAL_DB_CONTENEDOR ?? 'terravid-manual-db', 'psql', '-U', 'postgres', '-d', process.env.MANUAL_DB ?? 'terravid_manual', '-tAc', q], { encoding: 'utf8' }).trim();
}

async function call(token, method, path, body, extraHeaders = {}) {
  const r = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extraHeaders },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 429) { await new Promise((ok) => setTimeout(ok, 61000)); return call(token, method, path, body, extraHeaders); }
  const txt = await r.text();
  let data; try { data = JSON.parse(txt); } catch { data = txt; }
  if (!r.ok) { console.error(`  ! ${method} ${path} -> ${r.status} ${txt.slice(0, 300)}`); return null; }
  return data;
}

async function login(email) {
  const r = await call(null, 'POST', '/auth/login', { email, password: PASS });
  return r?.accessToken;
}

const hoy = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const diasAtras = (n) => { const d = new Date(hoy); d.setDate(d.getDate() - n); return d; };

const P = await login('propietario@terravid.demo');
const cat = [];
for (const t of ['variedad', 'sistema_conduccion']) cat.push(...(await call(P, 'GET', `/catalogos?tipo=${t}`)).map((c) => ({ ...c, tipo: t })));
const porTipo = (t) => cat.filter((c) => c.tipo === t);
console.log('catalogos', cat.map((c) => `${c.tipo}:${c.nombre}`).join(', '));
const roles = await call(P, 'GET', '/roles');
const rolId = (n) => roles.find((r) => r.nombreRol === n).id;

// Usuarios
const usuarios = {};
for (const [nombre, email, rol] of [
  ['Ana Agrónoma', 'agronomo@terravid.demo', 'Agronomo'],
  ['Carlos Capataz', 'capataz@terravid.demo', 'Capataz'],
  ['Laura Auditora', 'auditor@terravid.demo', 'Auditor'],
  ['Diego Capataz', 'capataz2@terravid.demo', 'Capataz'],
]) {
  const u = await call(P, 'POST', '/usuarios', { nombre, email, password: PASS, rolId: rolId(rol) });
  usuarios[email] = u;
}
await call(P, 'PATCH', '/usuarios/me', { nombre: 'Martín Propietario' });
sql(`update usuarios set debe_cambiar_password=false`);

// Fincas
const f1 = await call(P, 'POST', '/fincas', { nombre: 'Los Viñedos', ubicacion: 'Luján de Cuyo, Mendoza', hectareas: 150, latitud: -33.0362, longitud: -68.8833 });
const f2 = await call(P, 'POST', '/fincas', { nombre: 'El Algarrobo', ubicacion: 'Tupungato, Mendoza', hectareas: 80, latitud: -33.3700, longitud: -69.1500 });

const variedad = (n) => porTipo('variedad').find((v) => v.nombre.includes(n)) ?? porTipo('variedad')[0];
const sistema = porTipo('sistema_conduccion')[0];
const cuarteles = {};
for (const [finca, nombre, v, ha, lat, lon, anio] of [
  [f1, 'Malbec Norte', 'Malbec', 25, -33.0340, -68.8850, 2008],
  [f1, 'Malbec Sur', 'Malbec', 30, -33.0385, -68.8840, 2012],
  [f1, 'Cabernet Este', 'Cabernet', 20, -33.0360, -68.8800, 2015],
  [f2, 'Chardonnay Alto', 'Chardonnay', 18, -33.3690, -69.1520, 2018],
]) {
  cuarteles[nombre] = await call(P, 'POST', '/cuarteles', {
    fincaId: finca.id, nombre, variedadId: variedad(v).id, sistemaConduccionId: sistema.id,
    clon: '595', anioImplantacion: anio, hectareas: ha, latitud: lat, longitud: lon,
  });
}

// Asignación de fincas
for (const email of ['agronomo@terravid.demo', 'capataz@terravid.demo', 'auditor@terravid.demo']) {
  await call(P, 'PUT', `/usuarios/${usuarios[email].id}/fincas`, { fincaIds: [f1.id, f2.id] });
}
await call(P, 'PUT', `/usuarios/${usuarios['capataz2@terravid.demo'].id}/fincas`, { fincaIds: [f2.id] });

// Tipos de labor e insumos
const tl = {};
for (const [nombre, unidad, costo] of [['Poda', 'jornal', 15000], ['Pulverización', 'ha', 22000], ['Riego por goteo', 'hora', 3500], ['Desbrote', 'jornal', 14000]]) {
  tl[nombre] = await call(P, 'POST', '/tipos-labor', { nombre, unidadMedida: unidad, costoUnitarioInicial: costo, descripcion: `Labor de ${nombre.toLowerCase()}` });
}
const ins = {};
for (const [nombre, unidad, costo] of [['Fertilizante NPK 18-6-12', 'kg', 150], ['Sulfato de cobre', 'kg', 2200], ['Azufre mojable', 'kg', 1800]]) {
  ins[nombre] = await call(P, 'POST', '/insumos', { nombre, unidadMedida: unidad, costoUnitarioInicial: costo, descripcion: 'Insumo de campo' });
}
// Costos vigentes desde el inicio de la campaña anterior, para poder cargar historia.
sql(`update costo_labor set valid_from='2025-07-01'`);
sql(`update costo_insumo set valid_from='2025-07-01'`);
// Un aumento futuro de la poda para mostrar el historial de costos.
await call(P, 'POST', `/tipos-labor/${tl['Poda'].id}/costos`, { costoUnitario: 16500, validFrom: iso(new Date(hoy.getTime() + 5 * 864e5)) });

// Campaña anterior
const campAnt = await call(P, 'POST', '/campanias', { nombre: '2025/2026', fechaDesde: '2025-07-01', fechaHasta: '2026-06-30' });

// Cuadrillas
const cu = {};
for (const [nombre, n, tarifa] of [['Cuadrilla Los Pérez', 8, 35], ['Cuadrilla Norte', 6, 32], ['Cuadrilla Tupungato', 5, 34]]) {
  cu[nombre] = await call(P, 'POST', '/cuadrillas', { fincaId: nombre.includes('Tupungato') ? f2.id : f1.id, nombre, cantidadIntegrantes: n, tarifaPorKgInicial: tarifa });
}
sql(`update tarifa_cuadrilla set valid_from='2025-07-01'`);

// Labores (como capataz y agrónomo), historia de 2 campañas
const C = await login('capataz@terravid.demo');
const A = await login('agronomo@terravid.demo');
const labores = [];
const plan = [
  ['Malbec Norte', 'Poda', 3, [], 400], ['Malbec Norte', 'Pulverización', 25, [['Sulfato de cobre', 40]], 380],
  ['Malbec Sur', 'Poda', 4, [], 395], ['Cabernet Este', 'Riego por goteo', 12, [['Fertilizante NPK 18-6-12', 120]], 370],
  ['Malbec Norte', 'Desbrote', 2, [], 340], ['Malbec Sur', 'Pulverización', 30, [['Azufre mojable', 60]], 330],
  ['Malbec Norte', 'Poda', 3, [], 35], ['Malbec Norte', 'Pulverización', 25, [['Sulfato de cobre', 45]], 28],
  ['Malbec Sur', 'Poda', 4, [], 21], ['Cabernet Este', 'Riego por goteo', 10, [['Fertilizante NPK 18-6-12', 100]], 14],
  ['Malbec Norte', 'Riego por goteo', 8, [], 7], ['Chardonnay Alto', 'Poda', 2, [], 5],
  ['Malbec Sur', 'Desbrote', 2, [], 2], ['Malbec Norte', 'Poda', 3, [], 0], ['Cabernet Este', 'Pulverización', 20, [['Azufre mojable', 30]], 0],
];
for (const [cuartel, tipo, cant, insumos, dias] of plan) {
  const d = diasAtras(dias); d.setHours(10, 0, 0, 0);
  labores.push({
    localUuid: randomUUID(), cuartelId: cuarteles[cuartel].id, tipoLaborId: tl[tipo].id, fecha: iso(d), cantidad: cant,
    insumos: insumos.map(([n, c]) => ({ insumoId: ins[n].id, cantidadUsada: c })),
    createdAtLocal: d.toISOString(), latitud: cuarteles[cuartel].latitud, longitud: cuarteles[cuartel].longitud,
  });
}
// Riego en Malbec Norte durante el último mes: la correlación necesita al menos 7 días.
for (const [dias, horas] of [[25, 6], [22, 8], [18, 10], [15, 12], [12, 14], [10, 9], [4, 16], [3, 18]]) {
  const d = diasAtras(dias); d.setHours(9, 0, 0, 0);
  labores.push({
    localUuid: randomUUID(), cuartelId: cuarteles['Malbec Norte'].id, tipoLaborId: tl['Riego por goteo'].id,
    fecha: iso(d), cantidad: horas, insumos: [], createdAtLocal: d.toISOString(),
  });
}
for (let i = 0; i < labores.length; i += 10) console.log('sync labores', JSON.stringify(await call(C, 'POST', '/registro-labor/sync', { registros: labores.slice(i, i + 10) }))?.slice(0, 200));

// Pesajes: vendimia de la campaña anterior (marzo 2026) y algunos de hoy
const pesajes = [];
const pes = [
  ['Malbec Norte', 'Cuadrilla Los Pérez', 1250, '2026-03-02'], ['Malbec Norte', 'Cuadrilla Los Pérez', 1340, '2026-03-03'],
  ['Malbec Sur', 'Cuadrilla Norte', 980, '2026-03-05'], ['Malbec Sur', 'Cuadrilla Norte', 1120, '2026-03-06'],
  ['Cabernet Este', 'Cuadrilla Los Pérez', 890, '2026-03-20'], ['Chardonnay Alto', 'Cuadrilla Tupungato', 760, '2026-02-25'],
  ['Malbec Norte', 'Cuadrilla Los Pérez', 1250, iso(hoy)], ['Malbec Norte', 'Cuadrilla Norte', 1100, iso(hoy)],
  ['Malbec Sur', 'Cuadrilla Norte', 940, iso(hoy)],
];
for (const [cuartel, cuadrilla, kg, fecha] of pes) {
  pesajes.push({ localUuid: randomUUID(), cuadrillaId: cu[cuadrilla].id, cuartelId: cuarteles[cuartel].id, fecha, kgTotales: kg,
    createdAtLocal: new Date(fecha + 'T12:00:00-03:00').toISOString(), latitud: cuarteles[cuartel].latitud, longitud: cuarteles[cuartel].longitud });
}
console.log('sync pesajes', JSON.stringify(await call(C, 'POST', '/pesajes-vendimia/sync', { pesajes }))?.slice(0, 200));

// Remitos: uno aprobado y liquidado, uno rechazado, uno en borrador
const r1 = await call(C, 'POST', '/remitos/generar-borrador', { cuartelId: cuarteles['Malbec Norte'].id, fecha: '2026-03-03' });
const r2 = await call(C, 'POST', '/remitos/generar-borrador', { cuartelId: cuarteles['Malbec Sur'].id, fecha: '2026-03-06' });
const r3 = await call(C, 'POST', '/remitos/generar-borrador', { cuartelId: cuarteles['Malbec Norte'].id });
const r4 = await call(C, 'POST', '/remitos/generar-borrador', { cuartelId: cuarteles['Chardonnay Alto'].id, fecha: '2026-02-25' });
if (r1) { await call(P, 'POST', `/remitos/${r1.id}/aprobar`); await call(P, 'PUT', `/remitos/${r1.id}/liquidacion`, { bodega: 'Bodega Catena', kgAceptados: 2550, precioPorKg: 420, descuentos: 15000, fecha: '2026-04-10', numeroComprobante: 'A-0001-00012345' }); }
if (r4) { await call(P, 'POST', `/remitos/${r4.id}/aprobar`); }
if (r2) await call(A, 'POST', `/remitos/${r2.id}/rechazar`, { motivoRechazo: 'Los kilos de la cuadrilla Norte no coinciden con la planilla de la bodega' });
console.log('remitos', !!r1, !!r2, !!r3, !!r4);

// Metas de cosecha
const campAct = await call(P, 'GET', '/campanias/actual');
for (const [c, kg] of [['Malbec Norte', 9000], ['Malbec Sur', 10000], ['Cabernet Este', 6000], ['Chardonnay Alto', 5000]]) {
  if (campAct) await call(P, 'PUT', `/campanias/${campAct.id}/metas/${cuarteles[c].id}`, { metaKg: kg });
  if (campAnt) await call(P, 'PUT', `/campanias/${campAnt.id}/metas/${cuarteles[c].id}`, { metaKg: kg * 0.9 });
}

// Sensores y telemetría (40 días)
const sensores = {};
for (const [codigo, tipo, desc] of [['HUM-1-792', 'humedad_suelo', 'Humedad de suelo, Malbec Norte'], ['TEMP-1-310', 'temperatura', 'Estación meteorológica'], ['HAMB-1-478', 'humedad_ambiente', 'Estación meteorológica']]) {
  sensores[codigo] = await call(P, 'POST', '/sensores', { fincaId: f1.id, codigo, tipo, descripcion: desc });
}
await call(P, 'PUT', `/sensores/${sensores['HUM-1-792'].id}/umbral`, { umbralMinimo: 20, umbralMaximo: 45 });
await call(P, 'PUT', `/sensores/${sensores['TEMP-1-310'].id}/umbral`, { umbralMinimo: -2, umbralMaximo: 36 });
// Histórico directo en la base (el throttler admite 120 pedidos por minuto);
// las últimas lecturas entran por la API para que se evalúen los umbrales.
const filas = [];
for (let dia = 40; dia >= 1; dia--) {
  for (const hora of [6, 12, 18]) {
    const t = diasAtras(dia); t.setHours(hora, 0, 0, 0);
    filas.push([sensores['HUM-1-792'].id, 25 + Math.sin(dia / 4) * 3, '%', t]);
    filas.push([sensores['TEMP-1-310'].id, 14 + (hora === 12 ? 12 : hora === 18 ? 8 : 0) + Math.sin(dia / 6) * 3, '°C', t]);
    filas.push([sensores['HAMB-1-478'].id, 45 + Math.cos(dia / 5) * 10, '%', t]);
  }
}
sql('insert into lecturas_iot (sensor_id, valor, unidad, sensor_timestamp) values ' + filas.map(([id, v, u, t]) => `('${id}', ${v.toFixed(1)}, '${u}', '${t.toISOString()}')`).join(','));
let n = filas.length;
for (const [codigo, unidad, valor] of [['HUM-1-792', '%', 17.5], ['TEMP-1-310', '°C', 38.2], ['HAMB-1-478', '%', 41], ['HUM-1-792', '%', 24.1], ['TEMP-1-310', '°C', 27.4]]) {
  const r = await call(null, 'POST', '/lecturas-iot', { codigoSensor: codigo, valor, unidad, sensorTimestamp: new Date(Date.now() - 3600e3 * (5 - n % 5)).toISOString() }, { 'X-Api-Key': IOT_KEY });
  if (r) n++;
}
console.log('lecturas', n);
// Para que los gráficos y las reglas vean los datos como sincronizados.

// Recomendaciones (se calculan al pedirlas)
await call(P, 'GET', `/inteligencia-agronomica/recomendaciones/${cuarteles['Malbec Norte'].id}`);

// Ticket de soporte
await call(C, 'POST', '/ayuda/tickets', { modulo: 'vendimia', descripcion: 'No encuentro la cuadrilla nueva en el formulario de pesaje de la app.', appVersion: '1.0.0' });

// Empresa extra para el Administrador
const ADM = await login('admin@terravid.demo');
await call(ADM, 'POST', '/empresas', { nombre: 'Bodega Valle de Uco S.A.', cuit: '30-71234567-8', propietario: { nombre: 'Sofía Herrera', email: 'sofia@valledeuco.demo' } });

console.log(JSON.stringify({ fincas: [f1.id, f2.id], cuarteles: Object.fromEntries(Object.entries(cuarteles).map(([k, v]) => [k, v.id])), sensores: Object.fromEntries(Object.entries(sensores).map(([k, v]) => [k, v.id])), remitos: [r1?.id, r2?.id, r3?.id, r4?.id] }));
