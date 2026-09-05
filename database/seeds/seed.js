#!/usr/bin/env node
/**
 * Seed de datos de desarrollo/pruebas para Tarelli.
 *
 * Genera usuarios, categorías, etiquetas, tareas, relaciones tarea-etiqueta y
 * activity_logs con distribución realista en el tiempo (últimos ~13 meses)
 * para que las 10 consultas analíticas (database/queries/*.sql) produzcan
 * resultados no triviales. Es determinístico (RNG con semilla fija) para que
 * las corridas sean reproducibles.
 *
 * ADVERTENCIA: trunca las tablas de negocio antes de sembrar. Pensado solo
 * para entornos de desarrollo/pruebas, nunca para producción.
 *
 * Uso: node seeds/seed.js
 * Variables de entorno: DATABASE_URL (obligatoria)
 */
require('dotenv').config();
const crypto = require('crypto');
const { Client } = require('pg');
const argon2 = require('argon2');

// --- RNG determinístico (mulberry32) para reproducibilidad ---------------
function mulberry32(seed) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260905);
const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
const pick = (arr) => arr[randInt(0, arr.length - 1)];
const chance = (p) => rng() < p;
function pickN(arr, n) {
  const copy = [...arr];
  const out = [];
  n = Math.min(n, copy.length);
  for (let i = 0; i < n; i += 1) {
    out.push(copy.splice(randInt(0, copy.length - 1), 1)[0]);
  }
  return out;
}
function daysAgo(days, hour = 12, minute = 0) {
  const d = new Date();
  d.setUTCHours(hour, minute, 0, 0);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}
function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

const CATEGORIA_POOL = [
  'Trabajo',
  'Personal',
  'Hogar',
  'Salud',
  'Finanzas',
  'Estudio',
  'Ocio',
  'Proyectos',
];
const ETIQUETA_POOL = [
  'urgente',
  'importante',
  'rapido',
  'largo-plazo',
  'cliente',
  'interno',
  'revision',
  'bloqueado',
  'reunion',
  'seguimiento',
];
const PRIORIDADES = ['baja', 'media', 'alta'];
const TITULOS = [
  'Revisar propuesta de {cat}',
  'Preparar informe de {cat}',
  'Coordinar reunión de {cat}',
  'Actualizar documentación de {cat}',
  'Responder correos pendientes de {cat}',
  'Planificar próxima etapa de {cat}',
  'Resolver incidencia de {cat}',
  'Investigar opciones para {cat}',
  'Hacer seguimiento a {cat}',
  'Organizar tareas de {cat}',
  'Comprar insumos para {cat}',
  'Llamar sobre {cat}',
  'Revisar presupuesto de {cat}',
  'Diseñar plan de {cat}',
  'Consolidar notas de {cat}',
];

const NUM_USUARIOS = 12;
const HISTORY_DAYS = 400; // un poco más de 13 meses de historia

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('[seed] Falta la variable de entorno DATABASE_URL');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    console.log('[seed] Limpiando tablas de negocio...');
    await client.query(
      'TRUNCATE TABLE activity_logs, tarea_etiquetas, tareas, etiquetas, categorias, refresh_tokens, usuarios RESTART IDENTITY CASCADE;',
    );

    const passwordHash = await argon2.hash('Password123!', { type: argon2.argon2id });

    console.log(`[seed] Creando ${NUM_USUARIOS} usuarios...`);
    const usuarios = [];
    for (let i = 1; i <= NUM_USUARIOS; i += 1) {
      const id = crypto.randomUUID();
      const creado = daysAgo(HISTORY_DAYS - randInt(0, 20));
      const ultimoLogin = chance(0.85) ? daysAgo(randInt(0, 10)) : null;
      const { rows } = await client.query(
        `INSERT INTO usuarios (id, nombre, email, password_hash, ultimo_login_en, timezone, creado_en, actualizado_en)
         VALUES ($1, $2, $3, $4, $5, 'America/Bogota', $6, $6)
         RETURNING id`,
        [id, `Usuario Demo ${i}`, `usuario${i}@tarelli.dev`, passwordHash, ultimoLogin, creado],
      );
      usuarios.push({ id: rows[0].id, creado });
    }

    let totalCategorias = 0;
    let totalEtiquetas = 0;
    let totalTareas = 0;
    let totalRelaciones = 0;
    let totalLogs = 0;

    for (const usuario of usuarios) {
      // --- Categorías ---
      const categoriaNombres = pickN(CATEGORIA_POOL, randInt(3, 6));
      const categorias = [];
      for (const nombre of categoriaNombres) {
        const id = crypto.randomUUID();
        await client.query(
          `INSERT INTO categorias (id, usuario_id, nombre, creado_en, actualizado_en)
           VALUES ($1, $2, $3, $4, $4)`,
          [id, usuario.id, nombre, usuario.creado],
        );
        categorias.push({ id, nombre });
      }
      totalCategorias += categorias.length;

      // --- Etiquetas ---
      const etiquetaNombres = pickN(ETIQUETA_POOL, randInt(5, 8));
      const etiquetas = [];
      for (const nombre of etiquetaNombres) {
        const id = crypto.randomUUID();
        await client.query(
          `INSERT INTO etiquetas (id, usuario_id, nombre, creado_en) VALUES ($1, $2, $3, $4)`,
          [id, usuario.id, nombre, usuario.creado],
        );
        etiquetas.push({ id, nombre });
      }
      totalEtiquetas += etiquetas.length;

      // --- Tareas ---
      const numTareas = randInt(35, 90);
      for (let t = 0; t < numTareas; t += 1) {
        const id = crypto.randomUUID();
        const antiguedad = randInt(0, HISTORY_DAYS - 5);
        const creadoEn = daysAgo(antiguedad, randInt(7, 20), randInt(0, 59));
        const categoria = chance(0.85) ? pick(categorias) : null;
        const prioridad = pick(PRIORIDADES);
        const titulo = pick(TITULOS).replace('{cat}', categoria ? categoria.nombre : 'general');
        const descripcion = `Detalle generado para pruebas: ${titulo.toLowerCase()}.`;

        // Las tareas más antiguas tienen mayor probabilidad de estar completadas,
        // para que la ventana de "últimos 30 días" muestre trabajo en progreso real.
        const probCompletada = Math.min(0.9, 0.25 + antiguedad / HISTORY_DAYS);
        const completada = chance(probCompletada);
        let completadoEn = null;
        if (completada) {
          const diasHastaCompletar = randInt(0, Math.min(21, Math.max(1, antiguedad)));
          completadoEn = addDays(creadoEn, diasHastaCompletar);
          if (completadoEn > new Date()) completadoEn = new Date();
        }

        let fechaVencimiento = null;
        if (chance(0.7)) {
          const offset = randInt(-30, 45); // puede quedar vencida o futura
          const venc = addDays(creadoEn, offset);
          fechaVencimiento = venc.toISOString().slice(0, 10);
        }

        await client.query(
          `INSERT INTO tareas
             (id, usuario_id, categoria_id, titulo, descripcion, prioridad, completada,
              fecha_vencimiento, completado_en, creado_en, actualizado_en)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)`,
          [
            id,
            usuario.id,
            categoria ? categoria.id : null,
            titulo,
            descripcion,
            prioridad,
            completada,
            fechaVencimiento,
            completadoEn,
            creadoEn,
          ],
        );
        totalTareas += 1;

        await client.query(
          `INSERT INTO activity_logs (id, tarea_id, usuario_id, tipo_actividad, details, creado_en)
           VALUES ($1, $2, $3, 'TASK_CREATED', $4::jsonb, $5)`,
          [crypto.randomUUID(), id, usuario.id, JSON.stringify({ titulo, prioridad }), creadoEn],
        );
        totalLogs += 1;

        if (chance(0.3)) {
          const updateEn = addDays(creadoEn, randInt(1, 5));
          await client.query(
            `INSERT INTO activity_logs (id, tarea_id, usuario_id, tipo_actividad, details, creado_en)
             VALUES ($1, $2, $3, 'TASK_UPDATED', $4::jsonb, $5)`,
            [
              crypto.randomUUID(),
              id,
              usuario.id,
              JSON.stringify({ campos: ['descripcion'] }),
              updateEn < new Date() ? updateEn : creadoEn,
            ],
          );
          totalLogs += 1;
        }

        if (completada) {
          await client.query(
            `INSERT INTO activity_logs (id, tarea_id, usuario_id, tipo_actividad, details, creado_en)
             VALUES ($1, $2, $3, 'TASK_COMPLETED', $4::jsonb, $5)`,
            [crypto.randomUUID(), id, usuario.id, JSON.stringify({ completada: true }), completadoEn],
          );
          totalLogs += 1;
        }

        // Etiquetas: 0 a 3 por tarea.
        const numEtiquetas = chance(0.2) ? 0 : randInt(1, 3);
        if (numEtiquetas > 0 && etiquetas.length > 0) {
          const seleccionadas = pickN(etiquetas, numEtiquetas);
          for (const etq of seleccionadas) {
            await client.query(
              `INSERT INTO tarea_etiquetas (tarea_id, etiqueta_id) VALUES ($1, $2)
               ON CONFLICT DO NOTHING`,
              [id, etq.id],
            );
            totalRelaciones += 1;
          }
        }
      }
    }

    console.log('[seed] Completado:');
    console.log(`  usuarios:            ${usuarios.length}`);
    console.log(`  categorias:          ${totalCategorias}`);
    console.log(`  etiquetas:           ${totalEtiquetas}`);
    console.log(`  tareas:              ${totalTareas}`);
    console.log(`  tarea_etiquetas:     ${totalRelaciones}`);
    console.log(`  activity_logs:       ${totalLogs}`);
    console.log('[seed] Credenciales de prueba: usuarioN@tarelli.dev / Password123!  (N = 1..' + NUM_USUARIOS + ')');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('[seed] Falló el seed:', err);
  process.exit(1);
});
