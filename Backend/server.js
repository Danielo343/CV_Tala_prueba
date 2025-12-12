// 1. Importaciones (Sin cambios)
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); 
const { diff } = require('deep-diff');
require('dotenv').config();

// 2. Configuración del Servidor (Sin cambios)
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

// 3. Conexión a la Base de Datos PostgreSQL (Sin cambios)
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: 'CV_Tala',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('❌ Error conectando a la base de datos PostgreSQL', err);
  else console.log('🚀 Conectado a la base de datos PostgreSQL en:', res.rows[0].now);
});


// --- 👇 ¡NUEVO! CACHÉ DE CATÁLOGOS 👇 ---

let catalogCache = null;

/**
 * Carga todos los catálogos de la BD a una caché en memoria
 * para traducir IDs a Nombres en el historial de actividad.
 */
async function getCatalogos() {
  if (catalogCache) {
    return catalogCache;
  }

  console.log('Cargando catálogos en caché...');
  try {
const [
      tipos_activacion, causa_clinica, agentes_causantes,
      causas_traumaticas, unidades, estados_traslado,
      estados_pupilas, estados_piel, tipos_lesion, ubicaciones_lesion,
      tipos_evento, categorias_evento, personal, hospitales
    ] = await Promise.all([
      // Tablas con columna 'activo' (Agregamos el filtro)
      pool.query('SELECT * FROM tipo_activacion WHERE activo = true ORDER BY id'),
      pool.query('SELECT * FROM causa_clinica WHERE activo = true ORDER BY id'),
      pool.query('SELECT * FROM agente_causante_general WHERE activo = true ORDER BY id'),
      pool.query('SELECT * FROM causa_traumatica_especifica WHERE activo = true ORDER BY id'),
      pool.query('SELECT * FROM unidad_asignada WHERE activo = true ORDER BY id'),
      pool.query('SELECT * FROM estado_traslado WHERE activo = true ORDER BY id'),
      
      // Tablas sin columna 'activo' (Se quedan igual)
      pool.query('SELECT * FROM estado_pupilas ORDER BY id'),
      pool.query('SELECT * FROM estado_piel ORDER BY id'),
      
      // Tablas con columna 'activo'
      pool.query('SELECT * FROM tipo_lesion WHERE activo = true ORDER BY id'),
      pool.query('SELECT * FROM ubicacion_lesion WHERE activo = true ORDER BY id'),
      pool.query('SELECT * FROM tipo_evento WHERE activo = true ORDER BY id'),
      
      // Categorias no tiene 'activo' aún, se queda igual
      pool.query('SELECT * FROM categoria_evento ORDER BY id'),
      pool.query('SELECT id, nombre_completo AS nombre FROM usuarios ORDER BY nombre_completo'),
      
      // Hospitales con filtro
      pool.query('SELECT * FROM catalogo_hospitales WHERE activo = true ORDER BY nombre'),
    ]);

    // Función helper para crear un Map (ej: '1' -> 'Accidente')
    const createMap = (rows) => new Map(rows.map(row => [String(row.id), row.nombre]));

    catalogCache = {
      // Guardamos las listas completas por si las necesitamos
      listas: {
        tipos_activacion: tipos_activacion.rows,
        causa_clinica: causa_clinica.rows,
        agentes_causantes: agentes_causantes.rows,
        causas_traumaticas: causas_traumaticas.rows,
        unidades: unidades.rows, // para id_unidad_asignada
        estados_traslado: estados_traslado.rows,
        estados_pupilas: estados_pupilas.rows,
        estados_piel: estados_piel.rows,
        tipos_lesion: tipos_lesion.rows,
        ubicaciones_lesion: ubicaciones_lesion.rows,
        tipos_evento: tipos_evento.rows,
        categorias: categorias_evento.rows,
        personal: personal.rows,
        hospitales: hospitales.rows,
      },
      // Creamos Mapas para búsqueda rápida de IDs
      maps: {
        id_tipo_activacion: createMap(tipos_activacion.rows),
        id_causa_clinica: createMap(causa_clinica.rows),
        id_unidad_asignada: createMap(unidades.rows),
        id_agente_causante_general: createMap(agentes_causantes.rows),
        id_estado_traslado: createMap(estados_traslado.rows),
        id_estado_pupilas: createMap(estados_pupilas.rows),
        id_estado_piel: createMap(estados_piel.rows),
        id_tipo_lesion: createMap(tipos_lesion.rows),
        id_ubicacion_lesion: createMap(ubicaciones_lesion.rows),
        id_tipo_evento: createMap(tipos_evento.rows),
        id_categoria: createMap(categorias_evento.rows),
        id_responsable: createMap(personal.rows),
      }
    };

    console.log('Catálogos cargados exitosamente en caché.');
    return catalogCache;
  } catch (err) {
    console.error('Error fatal al cargar catálogos en caché:', err);
    return null; // Retorna null si falla
  }
}

// --- 👆 FIN CACHÉ DE CATÁLOGOS 👆 ---


// 4. Autenticación (Sin cambios)
app.post('/api/auth/login', async (req, res) => {
    // ... (tu código de login no cambia)
    const { username, password } = req.body;
    console.log(`\n--- Intento de Login ---`);
    console.log(`Usuario recibido: ${username}`);
    if (!username || !password) {
        return res.status(400).json({ message: 'Usuario y contraseña son requeridos' });
    }
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE nombre_usuario = $1', [username]);
        const user = result.rows[0];
        if (!user) {
            console.log('Resultado: Usuario no encontrado en la base de datos.');
            return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }
        console.log('Resultado: Usuario encontrado:', user.nombre_usuario);
        const passwordValida = await bcrypt.compare(password, user.contrasena_hash);
        console.log('¿La contraseña es válida?:', passwordValida);
        console.log('------------------------\n');
        if (passwordValida) {
            const tokenPayload = {
              id: user.id,
              username: user.nombre_usuario,
              rol: user.rol 
            };
            const token = jwt.sign(
              tokenPayload,
              process.env.JWT_SECRET,
              { expiresIn: '8h' } 
            );
            res.json({
                id: user.id,
                username: user.nombre_usuario,
                name: user.nombre_completo,
                rol: user.rol,
                accessToken: token 
            });
        } else {
            res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
        }
    } catch (err) {
        console.error('❌ Error fatal en el login:', err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// 5. Middlewares de Seguridad (Sin cambios)
const verificarToken = (req, res, next) => {
    // ... (tu código de verificarToken no cambia)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 
    if (token == null) {
        return res.status(401).json({ message: 'Acceso denegado: No hay token' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token no válido o expirado' });
        }
        req.user = user; 
        next(); 
    });
};

const adminOnly = (req, res, next) => {
    // ... (tu código de adminOnly no cambia)
    if (req.user && req.user.rol === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Acceso denegado: Se requiere rol de Administrador' });
    }
};

app.get('/api/auth/verify', verificarToken, (req, res) => {
  // Si el middleware 'verificarToken' pasa, el token es válido.
  // Solo necesitamos enviar una respuesta exitosa.
  res.json({ message: 'Token válido' });
});

// --- FUNCIÓN HELPER PARA LA BITÁCORA (Sin cambios) ---
const registrarHistorial = async (id_usuario, nombre_usuario, accion, tipo_entidad, id_entidad, detalles) => {
  try {
    const query = `
      INSERT INTO historial_actividad 
        (id_usuario, nombre_usuario, accion, tipo_entidad, id_entidad, detalles)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const userId = id_usuario || null;
    const userName = nombre_usuario || 'Sistema';

    await pool.query(query, [userId, userName, accion, tipo_entidad, id_entidad, detalles]);
    console.log(`HISTORIAL: Usuario ${userName} [${accion}] ${tipo_entidad} ID ${id_entidad}`);
  } catch (err) {
    console.error("Error al registrar en historial_actividad:", err);
  }
};


// --- 👇 ¡FUNCIÓN HELPER DE COMPARACIÓN ACTUALIZADA! 👇 ---
/**
 * Compara dos objetos y genera un string con los cambios, traduciendo IDs.
 * @param {object} antiguo - El objeto ANTES de la actualización (de la BD).
 * @param {object} nuevo - El objeto (req.body) con los datos NUEVOS.
 * @param {object} catalogMaps - El objeto de Mapas de la caché de catálogos.
 * @returns {string} - Un string describiendo los cambios (ej: "Cambió Rol: 'usuario' -> 'admin'")
 */
const generarDetalleDeCambios = (antiguo, nuevo, catalogMaps) => {
  const nuevoFiltrado = {};
  
  // Mapeo de campos de BD a nombres legibles
  const nombresCampos = {
    nombre_completo: 'Nombre Completo',
    nombre_usuario: 'Usuario',
    rol: 'Rol',
    email: 'Email',
    // --- Campos de Activación ---
    fecha_activacion: 'Fecha Activación',
    hora_activacion: 'Hora Activación',
    paciente_nombre: 'Paciente',
    paciente_edad: 'Edad',
    paciente_sexo: 'Sexo',
    hospital_destino: 'Hospital',
    id_tipo_activacion: 'Tipo Activación',
    id_unidad_asignada: 'Unidad Asignada',
    id_causa_clinica: 'Causa Clínica',
    id_agente_causante_general: 'Agente Causal',
    id_estado_traslado: 'Estado Traslado',
    // --- Campos de Evento ---
    nombre_evento: 'Nombre Evento',
    fecha: 'Fecha Evento',
    estado: 'Estado',
    lugar: 'Lugar',
    id_tipo_evento: 'Tipo Evento',
    id_categoria: 'Categoría',
    id_responsable: 'Responsable'
  };

  Object.keys(antiguo).forEach(key => {
    if (nuevo.hasOwnProperty(key)) { 
      let valorAntiguo = antiguo[key];
      let valorNuevo = nuevo[key];

      // --- Normalización de Fechas ---
      if (valorAntiguo instanceof Date) {
        // Convertimos la fecha de la BD a 'YYYY-MM-DD'
        valorAntiguo = valorAntiguo.toISOString().split('T')[0];
      }
      if (key === 'fecha_activacion' || key === 'fecha') {
          if (typeof valorNuevo === 'string' && valorNuevo.includes('T')) {
               valorNuevo = valorNuevo.split('T')[0];
          }
      }
      
      // --- Normalización de Nulos/Strings/Números ---
      if (valorAntiguo === null || valorAntiguo === undefined) valorAntiguo = "";
      if (valorNuevo === null || valorNuevo === undefined) valorNuevo = "";
      
      valorAntiguo = String(valorAntiguo).trim();
      valorNuevo = String(valorNuevo).trim();

      if (valorAntiguo !== valorNuevo) {
        nuevoFiltrado[key] = nuevo[key]; 
      } else {
        nuevoFiltrado[key] = antiguo[key];
      }
    }
  });

  const diferencias = diff(antiguo, nuevoFiltrado);
  const cambios = [];

  if (!diferencias) {
    return "(Sin cambios detectados)";
  }

  diferencias.forEach(d => {
    // Solo nos interesan las ediciones (kind: 'E')
    if (d.kind === 'E') {
      const campo = d.path.join('.');
      const nombreAmigable = nombresCampos[campo] || campo; 
      
      let valorAntiguoStr = d.lhs;
      let valorNuevoStr = d.rhs;

      // --- ¡AQUÍ ESTÁ LA MAGIA! ---
      // Si el campo es un ID y tenemos su mapa, lo traducimos
      if (catalogMaps && catalogMaps[campo]) {
        const map = catalogMaps[campo];
        valorAntiguoStr = map.get(String(d.lhs)) || `(ID: ${d.lhs})`; // Fallback al ID
        valorNuevoStr = map.get(String(d.rhs)) || `(ID: ${d.rhs})`; // Fallback al ID
      } 
      // --- Formateo especial para fechas ---
      else if (campo === 'fecha_activacion' || campo === 'fecha') {
          try {
            // Intenta formatear las fechas a un formato legible
            valorAntiguoStr = new Date(d.lhs).toLocaleDateString('es-MX', { timeZone: 'UTC' });
            valorNuevoStr = new Date(d.rhs).toLocaleDateString('es-MX', { timeZone: 'UTC' });
          } catch (e) { /* se queda como string si falla */ }
      }
      // --- FIN DE LA MAGIA ---

      // Función interna para formatear valores vacíos
      const formatValor = (val) => {
         if (val === null || val === undefined || val === '' || String(val).startsWith('(ID: undefined)') || String(val).startsWith('(ID: null)')) return '(vacío)';
         return `'${val}'`;
      };
      
      const valorAntiguoFmt = formatValor(valorAntiguoStr);
      const valorNuevoFmt = formatValor(valorNuevoStr);

      // Evitar registrar campos sensibles o irrelevantes
      const camposIgnorados = ['id', 'contrasena_hash', 'fecha_captura', 'hora_captura', 'num_reporte_local'];
      if (!camposIgnorados.includes(campo)) {
         if (valorAntiguoFmt !== valorNuevoFmt) {
            cambios.push(`${nombreAmigable}: ${valorAntiguoFmt} -> ${valorNuevoFmt}`);
         }
      }
    }
  });

  if (cambios.length === 0) {
    return "(Sin cambios detectados)";
  }
  
  return cambios.join(', ');
};
// --- 👆 FIN FUNCIÓN HELPER DE COMPARACIÓN 👆 ---


// 6. Endpoint de Catálogos
app.get('/api/catalogos', verificarToken, async (req, res) => {
  try {
    // --- MODIFICADO: Ahora usa la caché ---
    const catalogs = await getCatalogos(); 
    if (!catalogs) {
      return res.status(500).json({ error: 'Error interno al cargar catálogos' });
    }
    
    // Devolvemos las listas que el frontend espera
    res.json({
      tipos_activacion: catalogs.listas.tipos_activacion,
      causa_clinica: catalogs.listas.causa_clinica,
      agentes_causantes: catalogs.listas.agentes_causantes,
      causas_traumaticas: catalogs.listas.causas_traumaticas,
      unidades: catalogs.listas.unidades,
      estados_traslado: catalogs.listas.estados_traslado,
      estados_pupilas: catalogs.listas.estados_pupilas,
      estados_piel: catalogs.listas.estados_piel,
      tipos_lesion: catalogs.listas.tipos_lesion,
      ubicaciones_lesion: catalogs.listas.ubicaciones_lesion,
      tipos_evento: catalogs.listas.tipos_evento,
      categorias: catalogs.listas.categorias,
      personal: catalogs.listas.personal,
      hospitales: catalogs.listas.hospitales,
      // Hacemos un mapeo para las unidades de transporte (usado en eventos)
      unidades_transporte: catalogs.listas.unidades.map(u => ({ id: u.id, codigo: u.nombre, descripcion: u.nombre }))
    });
  } catch (err) {
    console.error('❌ Error al obtener catálogos:', err);
    res.status(500).json({ error: 'Error interno al cargar catálogos' });
  }
});

// --- RUTAS PARA ACTIVACIONES ---

// Crear una activación (Sin cambios)
app.post('/api/activaciones', verificarToken, async (req, res) => {
  // ... (tu código de POST /api/activaciones no cambia)
  const { paciente_nombre } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const activacionQuery = `
      INSERT INTO activaciones (
        fecha_activacion, hora_activacion, origen_reporte, num_reporte_externo, 
        requirio_traslado, hospital_destino, paciente_nombre, paciente_edad, 
        paciente_sexo, causa_clinica_especifica, ct_especifico, id_tipo_activacion, 
        id_unidad_asignada, id_causa_clinica, id_agente_causante_general, id_estado_traslado,
        tipo_activacion_otro
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id, num_reporte_local;
    `;
    const activacionValues = [
      req.body.fecha_activacion, req.body.hora_activacion,
      req.body.origen_reporte || 'Local', req.body.num_reporte_externo,
      req.body.requirio_traslado, req.body.requirio_traslado ? req.body.hospital_destino : null, 
      req.body.paciente_nombre, req.body.paciente_edad,
      req.body.paciente_sexo, req.body.causa_clinica_especifica, req.body.ct_especifico,
      req.body.id_tipo_activacion, req.body.id_unidad_asignada, req.body.id_causa_clinica,
      req.body.id_agente_causante_general, !req.body.requirio_traslado ? req.body.id_estado_traslado : null,
      req.body.tipo_activacion_otro
    ];
    const nuevaActivacionResult = await client.query(activacionQuery, activacionValues);
    const nuevaActivacion = nuevaActivacionResult.rows[0];
    const nuevaActivacionId = nuevaActivacion.id;

    if (req.body.id_causas_traumaticas && req.body.id_causas_traumaticas.length > 0) {
      const causaTraumaticaQuery = 'INSERT INTO activacion_causas_traumaticas (id_activacion, id_causa_traumatica_especifica) VALUES ($1, $2)';
      for (const id_causa of req.body.id_causas_traumaticas) {
        await client.query(causaTraumaticaQuery, [nuevaActivacionId, id_causa]);
      }
    }
    if (req.body.evaluacion && (req.body.evaluacion.id_estado_pupilas || req.body.evaluacion.id_estado_piel)) {
      const evaluacionQuery = `
        INSERT INTO evaluacion_clinica (id_activacion, anisocoria_lado, id_estado_pupilas, id_estado_piel)
        VALUES ($1, $2, $3, $4);
      `;
      await client.query(evaluacionQuery, [
        nuevaActivacionId,
        req.body.evaluacion.anisocoria_lado || null,
        req.body.evaluacion.id_estado_pupilas || null,
        req.body.evaluacion.id_estado_piel || null
      ]);
    }
    if (req.body.lesiones && req.body.lesiones.length > 0) {
      const lesionQuery = `
        INSERT INTO lesiones_activacion (id_activacion, descripcion_lesion, id_tipo_lesion, id_ubicacion_lesion)
        VALUES ($1, $2, $3, $4);
      `;
      for (const lesion of req.body.lesiones) {
        if (lesion.id_tipo_lesion || lesion.id_ubicacion_lesion || (lesion.descripcion_lesion && lesion.descripcion_lesion.trim() !== '')) {
            await client.query(lesionQuery, [
              nuevaActivacionId,
              lesion.descripcion_lesion,
              lesion.id_tipo_lesion,
              lesion.id_ubicacion_lesion
            ]);
        }
      }
    }
    await client.query('COMMIT');
    
    await registrarHistorial(
      req.user.id, 
      req.user.username, 
      'CREAR', 
      'ACTIVACION', 
      nuevaActivacion.id, 
      `Creó la activación '${nuevaActivacion.num_reporte_local}' para: ${paciente_nombre}`
    );

    res.status(201).json({ 
      message: 'Activación registrada exitosamente',
      data: nuevaActivacion 
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error detallado en la transacción:', err);
    res.status(500).json({ error: 'Error al guardar el registro. Revise la consola del servidor para más detalles.' });
  } finally {
    client.release();
  }
});

// Ver activaciones (Sin cambios)
app.get('/api/activaciones', verificarToken, async (req, res) => {
  // Leemos todos los filtros posibles desde req.query
  const { 
    fecha_inicio, fecha_fin, 
    id_tipo_activacion, id_causa_clinica, id_unidad_asignada,
    id_tipo_lesion, // <-- ¡Nuevo filtro por lesión!
    edad_min, edad_max,
    busqueda_texto, // <-- Nuevo filtro de texto
    scope // Mantenemos el scope para 'Registros del Día'
  } = req.query;

  try {
    let values = []; // Array para guardar los valores de forma segura
    let whereClauses = []; // Array para construir la cláusula WHERE
    
    // Joins base
    let joins = `
      LEFT JOIN tipo_activacion AS ta ON a.id_tipo_activacion = ta.id
      LEFT JOIN causa_clinica AS cc ON a.id_causa_clinica = cc.id
      LEFT JOIN unidad_asignada AS ua ON a.id_unidad_asignada = ua.id
    `;

    // --- Construcción dinámica de la consulta ---

    if (scope === 'today') {
      // Para la vista de 'RegistroPrehospitalario'
      // Usa fecha_captura para ver lo que se registró HOY
      whereClauses.push(`a.fecha_captura = CURRENT_DATE`);
    
    } else if (fecha_inicio && fecha_fin) {
      // Para 'Consultas' si se especifica un rango
      values.push(fecha_inicio, fecha_fin);
      whereClauses.push(`a.fecha_activacion BETWEEN $${values.length - 1} AND $${values.length}`);
    }
    // Si no hay scope ni fechas, simplemente no añade filtro de fecha (trae todo)

    // Filtro de Búsqueda de Texto
    if (busqueda_texto) {
      // ILIKE es como LIKE, pero ignora mayúsculas/minúsculas
      values.push(`%${busqueda_texto}%`);
      const textIndex = values.length;
      whereClauses.push(
        `(
          a.paciente_nombre ILIKE $${textIndex} OR
          a.num_reporte_local ILIKE $${textIndex} OR
          a.num_reporte_externo ILIKE $${textIndex} 
        )`
      );
    }
    
    // Filtros Avanzados (IDs de catálogos)
    if (id_tipo_activacion) {
      values.push(id_tipo_activacion);
      whereClauses.push(`a.id_tipo_activacion = $${values.length}`);
    }
    if (id_causa_clinica) {
      values.push(id_causa_clinica);
      whereClauses.push(`a.id_causa_clinica = $${values.length}`);
    }
    if (id_unidad_asignada) {
      values.push(id_unidad_asignada);
      whereClauses.push(`a.id_unidad_asignada = $${values.length}`);
    }

    // Filtro de Rango de Edad
    if (edad_min) {
      values.push(edad_min);
      whereClauses.push(`a.paciente_edad >= $${values.length}`);
    }
    if (edad_max) {
      values.push(edad_max);
      whereClauses.push(`a.paciente_edad <= $${values.length}`);
    }

    // ¡NUEVO! Filtro por Tipo de Lesión
    if (id_tipo_lesion) {
      // 1. Añadimos el JOIN a la tabla de lesiones (SOLO SI SE USA EL FILTRO)
      // Usamos INNER JOIN porque solo queremos registros QUE TENGAN esa lesión
      joins += ` INNER JOIN lesiones_activacion AS la ON a.id = la.id_activacion`;
      
      // 2. Añadimos la condición al WHERE
      values.push(id_tipo_lesion);
      whereClauses.push(`la.id_tipo_lesion = $${values.length}`);
    }

    // --- Armado de la consulta final ---
    
    // Usamos DISTINCT ON (a.id) para evitar registros duplicados
    // (por si un paciente tiene 2 lesiones que coinciden con el filtro)
    let query = `
      SELECT DISTINCT ON (a.num_reporte_local)
        a.id,
        a.num_reporte_local,
        a.num_reporte_externo,
        a.fecha_activacion,
        a.hora_activacion,
        a.paciente_nombre,
        a.paciente_edad,
        a.paciente_sexo,
        a.hospital_destino,
        a.requirio_traslado,  -- Nos aseguramos de traer este campo booleano
        
        ta.nombre AS tipo_activacion,
        cc.nombre AS causa_clinica,
        ua.nombre AS unidad_asignada_nombre,
        et.nombre AS estado_traslado, -- <--- ¡NUEVO! Traemos la razón de no traslado
        agc.nombre AS agente_causante_general_nombre, -- <--- ¡IMPORTANTE PARA EL REPORTE!
        a.tipo_activacion_otro, -- <--- ¡IMPORTANTE PARA EL REPORTE!
        
        a.id_tipo_activacion,
        a.id_causa_clinica,
        a.id_unidad_asignada
      FROM 
        activaciones AS a
      ${joins}
      LEFT JOIN estado_traslado AS et ON a.id_estado_traslado = et.id -- <--- ¡NUEVO! Unimos la tabla
      LEFT JOIN agente_causante_general AS agc ON a.id_agente_causante_general = agc.id
    `;

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // Ordenamos por Folio (YYMMNNN) descendente (el más nuevo primero)
    query += ' ORDER BY a.num_reporte_local DESC;';

    const result = await pool.query(query, values);
    res.json(result.rows);
    
  } catch (err) {
    console.error('Error al obtener las activaciones:', err);
    res.status(500).json({ error: 'Error interno al consultar los registros.' });
  }
});

// Ver una activación (Sin cambios)
app.get('/api/activaciones/:id', verificarToken, async (req, res) => {
  // ... (tu código de GET /api/activaciones/:id no cambia)
  const { id } = req.params;
  try {
    const activacionQuery = `
      SELECT 
        a.*,
        ta.nombre AS tipo_activacion_nombre,
        ua.nombre AS unidad_asignada_nombre,
        cc.nombre AS causa_clinica_nombre,
        agc.nombre AS agente_causante_general_nombre,
        et.nombre AS estado_traslado_nombre,
        (SELECT u.nombre_completo FROM usuarios u WHERE u.id = 1) AS usuario_captura
      FROM activaciones a
      LEFT JOIN tipo_activacion ta ON a.id_tipo_activacion = ta.id
      LEFT JOIN unidad_asignada ua ON a.id_unidad_asignada = ua.id
      LEFT JOIN causa_clinica cc ON a.id_causa_clinica = cc.id
      LEFT JOIN agente_causante_general agc ON a.id_agente_causante_general = agc.id
      LEFT JOIN estado_traslado et ON a.id_estado_traslado = et.id
      WHERE a.id = $1;
    `;
    const evaluacionQuery = `
      SELECT 
        ec.*,
        ep.nombre AS estado_pupilas_nombre,
        esk.nombre AS estado_piel_nombre
      FROM evaluacion_clinica ec
      LEFT JOIN estado_pupilas ep ON ec.id_estado_pupilas = ep.id
      LEFT JOIN estado_piel esk ON ec.id_estado_piel = esk.id
      WHERE ec.id_activacion = $1;
    `;
    const causasTraumaticasQuery = `
      SELECT 
        ct.nombre,
        ct.id
      FROM activacion_causas_traumaticas act
      JOIN causa_traumatica_especifica ct ON act.id_causa_traumatica_especifica = ct.id
      WHERE act.id_activacion = $1;
    `;
    const lesionesQuery = `
      SELECT 
        la.*,
        tl.nombre AS tipo_lesion_nombre,
        ul.nombre AS ubicacion_lesion_nombre
      FROM lesiones_activacion la
      LEFT JOIN tipo_lesion tl ON la.id_tipo_lesion = tl.id
      LEFT JOIN ubicacion_lesion ul ON la.id_ubicacion_lesion = ul.id
      WHERE la.id_activacion = $1;
    `;
    const [
      activacionResult,
      evaluacionResult,
      causasTraumaticasResult,
      lesionesResult
    ] = await Promise.all([
      pool.query(activacionQuery, [id]),
      pool.query(evaluacionQuery, [id]),
      pool.query(causasTraumaticasQuery, [id]),
      pool.query(lesionesQuery, [id])
    ]);
    if (activacionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    const activacionCompleta = activacionResult.rows[0];
    activacionCompleta.evaluacion = evaluacionResult.rows[0] || null;
    activacionCompleta.causas_traumaticas = causasTraumaticasResult.rows; 
    activacionCompleta.lesiones = lesionesResult.rows;
    activacionCompleta.causas_traumaticas_nombres = causasTraumaticasResult.rows.map(r => r.nombre);
    res.json(activacionCompleta);
  } catch (err) {
    console.error(`Error al obtener detalle de activación ${id}:`, err);
    res.status(500).json({ error: 'Error interno al consultar el registro.' });
  }
});

// Editar una activación: [Admin, REGISTRO DETALLADO]
app.put('/api/activaciones/:id', [verificarToken, adminOnly], async (req, res) => {
  const { id } = req.params;
  const datosNuevos = req.body; 
  
  const client = await pool.connect();
  try {
    // --- PASO 1: Obtener datos antiguos (Sin JOINS, solo IDs) ---
    const infoAntigua = await pool.query('SELECT * FROM activaciones WHERE id = $1', [id]);
    if (infoAntigua.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Activación no encontrada' });
    }
    const datosAntiguos = infoAntigua.rows[0];

    // --- PASO 2: Realizar la transacción de actualización (Sin cambios) ---
    await client.query('BEGIN');
    const final_hospital_destino = datosNuevos.requirio_traslado ? datosNuevos.hospital_destino : null;
    const final_id_estado_traslado = !datosNuevos.requirio_traslado ? datosNuevos.id_estado_traslado : null;
    const activacionQuery = `
      UPDATE activaciones SET
        fecha_activacion = $1, hora_activacion = $2, origen_reporte = $3, num_reporte_externo = $4, 
        requirio_traslado = $5, hospital_destino = $6, paciente_nombre = $7, paciente_edad = $8, 
        paciente_sexo = $9, causa_clinica_especifica = $10, ct_especifico = $11, id_tipo_activacion = $12, 
        id_unidad_asignada = $13, id_causa_clinica = $14, id_agente_causante_general = $15, 
        id_estado_traslado = $16, tipo_activacion_otro = $17
      WHERE id = $18
      RETURNING num_reporte_local;
    `;
    const activacionValues = [
      datosNuevos.fecha_activacion, datosNuevos.hora_activacion,
      datosNuevos.origen_reporte || 'Local', datosNuevos.num_reporte_externo,
      datosNuevos.requirio_traslado, final_hospital_destino,
      datosNuevos.paciente_nombre, datosNuevos.paciente_edad,
      datosNuevos.paciente_sexo, datosNuevos.causa_clinica_especifica, datosNuevos.ct_especifico,
      datosNuevos.id_tipo_activacion, datosNuevos.id_unidad_asignada, datosNuevos.id_causa_clinica,
      datosNuevos.id_agente_causante_general, final_id_estado_traslado,
      datosNuevos.tipo_activacion_otro,
      id
    ];
    const updateResult = await client.query(activacionQuery, activacionValues);
    const updatedFolio = updateResult.rows[0].num_reporte_local;

    // (Actualización de tablas relacionadas... sin cambios)
    await client.query('DELETE FROM activacion_causas_traumaticas WHERE id_activacion = $1', [id]);
    if (datosNuevos.id_causas_traumaticas && datosNuevos.id_causas_traumaticas.length > 0) {
      const causaTraumaticaQuery = 'INSERT INTO activacion_causas_traumaticas (id_activacion, id_causa_traumatica_especifica) VALUES ($1, $2)';
      for (const id_causa of datosNuevos.id_causas_traumaticas) {
        await client.query(causaTraumaticaQuery, [id, id_causa]);
      }
    }
    await client.query('DELETE FROM evaluacion_clinica WHERE id_activacion = $1', [id]);
    if (datosNuevos.evaluacion && (datosNuevos.evaluacion.id_estado_pupilas || datosNuevos.evaluacion.id_estado_piel)) {
      const evaluacionQuery = `INSERT INTO evaluacion_clinica (id_activacion, anisocoria_lado, id_estado_pupilas, id_estado_piel) VALUES ($1, $2, $3, $4);`;
      await client.query(evaluacionQuery, [
        id, datosNuevos.evaluacion.anisocoria_lado || null, datosNuevos.evaluacion.id_estado_pupilas || null, datosNuevos.evaluacion.id_estado_piel || null
      ]);
    }
    await client.query('DELETE FROM lesiones_activacion WHERE id_activacion = $1', [id]);
    if (datosNuevos.lesiones && datosNuevos.lesiones.length > 0) {
      const lesionQuery = `INSERT INTO lesiones_activacion (id_activacion, descripcion_lesion, id_tipo_lesion, id_ubicacion_lesion) VALUES ($1, $2, $3, $4);`;
      for (const lesion of datosNuevos.lesiones) {
        if (lesion.id_tipo_lesion || lesion.id_ubicacion_lesion || (lesion.descripcion_lesion && lesion.descripcion_lesion.trim() !== '')) {
            await client.query(lesionQuery, [id, lesion.descripcion_lesion, lesion.id_tipo_lesion, lesion.id_ubicacion_lesion]);
        }
      }
    }
    
    await client.query('COMMIT');

    // --- 👇 ¡MODIFICADO! PASO 3: Generar detalles y registrar historial ---
    const catalogMaps = catalogCache ? catalogCache.maps : null;
    const cambiosTexto = generarDetalleDeCambios(datosAntiguos, datosNuevos, catalogMaps);
    
    let detalleFinal = `Editó la activación '${updatedFolio}'. `;
    if (cambiosTexto && cambiosTexto !== '(Sin cambios detectados)') {
      detalleFinal += `Cambios: [${cambiosTexto}]`;
    } else {
      detalleFinal += "(Cambios menores o en tablas relacionadas detectados)";
    }

    await registrarHistorial(
      req.user.id, 
      req.user.username, 
      'EDITAR', 
      'ACTIVACION', 
      id, 
      detalleFinal
    );
    // --- 👆 FIN DE CAMBIOS 👆 ---

    res.status(200).json({ 
      message: 'Activación actualizada exitosamente',
      data: { num_reporte_local: updatedFolio }
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`Error al actualizar activación ${id}:`, err);
    res.status(500).json({ error: 'Error al actualizar el registro. La operación fue revertida.' });
  } finally {
    client.release();
  }
});

// Borrar una activación (Sin cambios)
app.delete('/api/activaciones/:id', [verificarToken, adminOnly], async (req, res) => {
    // ... (tu código de DELETE /api/activaciones/:id no cambia)
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'ID de activación requerido para eliminar.' });
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const infoQuery = await pool.query('SELECT num_reporte_local, paciente_nombre FROM activaciones WHERE id = $1', [id]);
        if (infoQuery.rowCount === 0) {
           await client.query('ROLLBACK');
           client.release();
           return res.status(404).json({ error: 'Activación no encontrada.' });
        }
        const { num_reporte_local, paciente_nombre } = infoQuery.rows[0];

        const deleteQuery = 'DELETE FROM activaciones WHERE id = $1 RETURNING id;';
        const result = await client.query(deleteQuery, [id]);
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ error: 'Activación no encontrada.' });
        }
        
        await client.query('COMMIT');
        console.log(`✅ Activación ID: ${id} eliminada exitosamente.`);

        await registrarHistorial(
          req.user.id, 
          req.user.username, 
          'ELIMINAR', 
          'ACTIVACION', 
          id, 
          `Eliminó la activación '${num_reporte_local}' (Paciente: ${paciente_nombre})`
        );

        res.status(200).json({ 
            message: `Activación con ID ${id} eliminada exitosamente.`,
            id: id
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Error al eliminar la activación ID ${id}:`, err);
        res.status(500).json({ 
            error: 'Error interno del servidor al eliminar la activación.',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    } finally {
        client.release();
    }
});


// --- RUTAS PARA EVENTOS ---

// Crear un evento (Sin cambios)
app.post('/api/eventos', verificarToken, async (req, res) => {
  // ... (tu código de POST /api/eventos no cambia)
  console.log('📨 RECIBIENDO PETICIÓN POST /api/eventos');
  const { nombre_evento } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const eventoQuery = `
      INSERT INTO eventos (
        nombre_evento, id_tipo_evento, id_categoria, fecha, hora_inicio, hora_fin,
        estado, lugar, direccion, organizador, institucion_responsable, 
        participantes_esperados, ambulancias_asignadas, personal_medico, 
        personal_apoyo, objetivos, descripcion, id_responsable, 
        observaciones, lecciones_aprendidas, observaciones_unidades
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING id, nombre_evento;
    `;
    const eventoValues = [
      req.body.nombre_evento, req.body.id_tipo_evento, req.body.id_categoria || null, req.body.fecha, req.body.hora_inicio, 
      req.body.hora_fin || null, req.body.estado || 'planificado', req.body.lugar, req.body.direccion || null, 
      req.body.organizador || null, req.body.institucion_responsable || null, req.body.participantes_esperados || null, 
      req.body.ambulancias_asignadas || null, req.body.personal_medico || null, req.body.personal_apoyo || null, 
      req.body.objetivos || null, req.body.descripcion || null, req.body.id_responsable || null, 
      req.body.observaciones || null, req.body.lecciones_aprendidas || null, req.body.observaciones_unidades || null
    ];
    
    const nuevoEventoResult = await client.query(eventoQuery, eventoValues);
    const nuevoEvento = nuevoEventoResult.rows[0];
    const nuevoEventoId = nuevoEvento.id;
    
    if (req.body.personal_participante_ids && req.body.personal_participante_ids.length > 0) {
      const personalQuery = 'INSERT INTO evento_personal (id_evento, id_usuario) VALUES ($1, $2)';
      for (const id_usuario of req.body.personal_participante_ids) {
        await client.query(personalQuery, [nuevoEventoId, id_usuario]);
      }
    }
    if (req.body.unidades_atienden && req.body.unidades_atienden.length > 0) {
      const getUnitIdsQuery = `SELECT id FROM unidad_asignada WHERE nombre = ANY($1::text[])`; 
      const unitIdsResult = await client.query(getUnitIdsQuery, [req.body.unidades_atienden]);
      const unitIds = unitIdsResult.rows.map(row => row.id);
      if (unitIds.length > 0) {
        const unidadesQuery = 'INSERT INTO evento_unidades (id_evento, id_unidad_transporte) VALUES ($1, $2)'; 
        for (const id_unidad of unitIds) {
          await client.query(unidadesQuery, [nuevoEventoId, id_unidad]);
        }
      }
    }

    await client.query('COMMIT');

    await registrarHistorial(
      req.user.id, 
      req.user.username, 
      'CREAR', 
      'EVENTO', 
      nuevoEvento.id, 
      `Creó el evento '${nuevoEvento.nombre_evento}'`
    );

    res.status(201).json({ 
      message: 'Evento registrado exitosamente',
      data: nuevoEvento
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error en la transacción de eventos:', err);
    res.status(500).json({ 
      error: 'Error al guardar el evento.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    client.release();
  }
});

// Ver eventos (Sin cambios)
app.get('/api/eventos', verificarToken, async (req, res) => {
  const { busqueda_texto, id_tipo_evento } = req.query;
  
  try {
    let values = [];
    let whereClauses = [];

    // Filtro de Búsqueda de Texto
    if (busqueda_texto) {
      values.push(`%${busqueda_texto}%`);
      const textIndex = values.length;
      whereClauses.push(
        `(
          e.nombre_evento ILIKE $${textIndex} OR
          e.lugar ILIKE $${textIndex} OR
          e.descripcion ILIKE $${textIndex}
        )`
      );
    }
    
    // Filtro por ID de Tipo de Evento
    if (id_tipo_evento) {
      values.push(id_tipo_evento);
      whereClauses.push(`e.id_tipo_evento = $${values.length}`);
    }

    // Consulta base (la misma que ya tenías)
    let query = `
      SELECT 
        e.id, e.nombre_evento, e.fecha, e.hora_inicio, e.estado, e.lugar, 
        e.descripcion, e.participantes_esperados, e.id_tipo_evento, e.id_responsable,
        te.nombre AS tipo_evento,
        u.nombre_completo AS responsable,
        (
            SELECT array_agg(ua.nombre) 
            FROM evento_unidades AS eu
            JOIN unidad_asignada AS ua ON eu.id_unidad_transporte = ua.id
            WHERE eu.id_evento = e.id
        ) AS unidades_atienden
      FROM 
        eventos AS e
      LEFT JOIN 
        tipo_evento AS te ON e.id_tipo_evento = te.id
      LEFT JOIN 
        usuarios AS u ON e.id_responsable = u.id
    `;

    // Añadimos los filtros si existen
    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ' ORDER BY e.fecha DESC, e.hora_inicio DESC;';

    const result = await pool.query(query, values);
    res.json(result.rows);
    
  } catch (err) {
    console.error('❌ Error al obtener la lista de eventos:', err);
    res.status(500).json({ error: 'Error interno al consultar los eventos.' });
  }
});

// Ver un evento (Sin cambios)
app.get('/api/eventos/:id', verificarToken, async (req, res) => {
    // ... (tu código de GET /api/eventos/:id no cambia)
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                e.*, 
                (SELECT array_agg(ep.id_usuario) FROM evento_personal AS ep WHERE ep.id_evento = e.id) AS personal_participante_ids,
                (SELECT array_agg(ua.nombre) FROM evento_unidades AS eu JOIN unidad_asignada AS ua ON eu.id_unidad_transporte = ua.id WHERE eu.id_evento = e.id) AS unidades_atienden
            FROM 
                eventos AS e
            WHERE 
                e.id = $1;
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Evento no encontrado' });
        }
        const eventoCompleto = result.rows[0];
        eventoCompleto.personal_participante_ids = eventoCompleto.personal_participante_ids || [];
        eventoCompleto.unidades_atienden = eventoCompleto.unidades_atienden || [];
        
        res.json(eventoCompleto);
    } catch (err) {
        console.error(`❌ Error al obtener detalles del evento ${id}:`, err);
        res.status(500).json({ error: 'Error interno al consultar el evento.' });
    }
});

// Editar un evento: [Admin, REGISTRO DETALLADO]
app.put('/api/eventos/:id', [verificarToken, adminOnly], async (req, res) => {
    const { id } = req.params;
    const datosNuevos = req.body;
    
    const client = await pool.connect();
    try {
        // --- PASO 1: Obtener datos antiguos (con IDs) ---
        const infoAntiguaQuery = `
            SELECT 
                e.*, 
                (SELECT array_agg(ua.nombre) FROM evento_unidades AS eu JOIN unidad_asignada AS ua ON eu.id_unidad_transporte = ua.id WHERE eu.id_evento = e.id) AS unidades_atienden
            FROM eventos AS e
            WHERE e.id = $1;
        `;
        const infoAntigua = await pool.query(infoAntiguaQuery, [id]);
        if (infoAntigua.rows.length === 0) {
            client.release();
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        const datosAntiguos = infoAntigua.rows[0];
        datosAntiguos.unidades_atienden = datosAntiguos.unidades_atienden || [];

        // --- PASO 2: Realizar la transacción de actualización (Sin cambios) ---
        await client.query('BEGIN');
        const eventoUpdateQuery = `
            UPDATE eventos SET
                nombre_evento = $1, id_tipo_evento = $2, id_categoria = $3, fecha = $4, hora_inicio = $5, 
                hora_fin = $6, estado = $7, lugar = $8, direccion = $9, organizador = $10, 
                institucion_responsable = $11, participantes_esperados = $12, ambulancias_asignadas = $13, 
                personal_medico = $14, personal_apoyo = $15, objetivos = $16, descripcion = $17, 
                id_responsable = $18, observaciones = $19, lecciones_aprendidas = $20, 
                observaciones_unidades = $21
            WHERE id = $22
            RETURNING id, nombre_evento;
        `;
        const eventoUpdateValues = [
            datosNuevos.nombre_evento, datosNuevos.id_tipo_evento, datosNuevos.id_categoria || null, datosNuevos.fecha, datosNuevos.hora_inicio, 
            datosNuevos.hora_fin || null, datosNuevos.estado || 'planificado', datosNuevos.lugar, datosNuevos.direccion || null, 
            datosNuevos.organizador || null, datosNuevos.institucion_responsable || null, datosNuevos.participantes_esperados || null, 
            datosNuevos.ambulancias_asignadas || null, datosNuevos.personal_medico || null, datosNuevos.personal_apoyo || null, 
            datosNuevos.objetivos || null, datosNuevos.descripcion || null, datosNuevos.id_responsable || null, 
            datosNuevos.observaciones || null, datosNuevos.lecciones_aprendidas || null, 
            datosNuevos.observaciones_unidades || null, id
        ];

        const result = await client.query(eventoUpdateQuery, eventoUpdateValues);
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            client.release();
            throw new Error("Evento no encontrado para actualizar.");
        }

        // (Actualización de tablas relacionadas... sin cambios)
        await client.query('DELETE FROM evento_personal WHERE id_evento = $1', [id]);
        if (datosNuevos.personal_participante_ids && datosNuevos.personal_participante_ids.length > 0) {
            const personalQuery = 'INSERT INTO evento_personal (id_evento, id_usuario) VALUES ($1, $2)';
            for (const id_usuario of datosNuevos.personal_participante_ids) {
                await client.query(personalQuery, [id, id_usuario]);
            }
        }
        await client.query('DELETE FROM evento_unidades WHERE id_evento = $1', [id]);
        if (datosNuevos.unidades_atienden && datosNuevos.unidades_atienden.length > 0) {
            const getUnitIdsQuery = `SELECT id FROM unidad_asignada WHERE nombre = ANY($1::text[])`; 
            const unitIdsResult = await client.query(getUnitIdsQuery, [datosNuevos.unidades_atienden]);
            const unitIds = unitIdsResult.rows.map(row => row.id);
            if (unitIds.length > 0) {
                const unidadesQuery = 'INSERT INTO evento_unidades (id_evento, id_unidad_transporte) VALUES ($1, $2)';
                for (const id_unidad of unitIds) {
                    await client.query(unidadesQuery, [id, id_unidad]);
                }
            }
        }
        await client.query('COMMIT');

        // --- 👇 ¡MODIFICADO! PASO 3: Generar detalles y registrar historial ---
        const catalogMaps = catalogCache ? catalogCache.maps : null;
        const cambiosTexto = generarDetalleDeCambios(datosAntiguos, datosNuevos, catalogMaps);

        let detalleFinal = `Editó el evento '${result.rows[0].nombre_evento}'. `;
        if (cambiosTexto && cambiosTexto !== '(Sin cambios detectados)') {
          detalleFinal += `Cambios: [${cambiosTexto}]`;
        } else {
          detalleFinal += "(Cambios menores o en listas de personal/unidades)";
        }
        
        await registrarHistorial(
          req.user.id, 
          req.user.username, 
          'EDITAR', 
          'EVENTO', 
          id, 
          detalleFinal
        );
        // --- 👆 FIN DE CAMBIOS 👆 ---

        res.status(200).json({
            message: 'Evento actualizado exitosamente',
            data: result.rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error en PUT /api/eventos/:id", err);
        let errorMessage = 'Error al actualizar el evento';
        if (err.code === '23503') errorMessage = 'Error: Referencia de ID inválida (Tipo, Categoría, Responsable o Unidad seleccionados no existen).';
        else if (err.code === '23502') errorMessage = 'Error: Faltan campos obligatorios en la base de datos.';
        else if (err.message.includes('Evento no encontrado')) errorMessage = 'Error: El evento no existe';
        res.status(500).json({ 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    } finally {
        client.release();
    }
});

// Borrar un evento (Sin cambios)
app.delete('/api/eventos/:id', [verificarToken, adminOnly], async (req, res) => {
    // ... (tu código de DELETE /api/eventos/:id no cambia)
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ error: 'ID de evento requerido para eliminar.' });
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const infoQuery = await pool.query('SELECT nombre_evento FROM eventos WHERE id = $1', [id]);
        if (infoQuery.rowCount === 0) {
           await client.query('ROLLBACK');
           client.release();
           return res.status(404).json({ error: 'Evento no encontrado.' });
        }
        const nombreEvento = infoQuery.rows[0].nombre_evento;

        const deleteQuery = 'DELETE FROM eventos WHERE id = $1 RETURNING id;';
        const result = await client.query(deleteQuery, [id]);
        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).json({ error: 'Evento no encontrado.' });
        }
        
        await client.query('COMMIT');
        console.log(`✅ Evento ID: ${id} eliminado exitosamente.`);

        await registrarHistorial(
          req.user.id, 
          req.user.username, 
          'ELIMINAR', 
          'EVENTO', 
          id, 
          `Eliminó el evento '${nombreEvento}' (ID: ${id})`
        );

        res.status(200).json({ 
            message: `Evento con ID ${id} eliminado exitosamente.`,
            id: id
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Error al eliminar el evento ID ${id}:`, err);
        res.status(500).json({ 
            error: 'Error interno del servidor al eliminar el evento.',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    } finally {
        client.release();
    }
});


// --- RUTAS CRUD PARA USUARIOS ---

// OBTENER TODOS LOS USUARIOS (Sin cambios)
app.get('/api/usuarios', [verificarToken, adminOnly], async (req, res) => {
  // ... (tu código de GET /api/usuarios no cambia)
  try {
    const result = await pool.query('SELECT id, nombre_completo, nombre_usuario, rol, email FROM usuarios ORDER BY nombre_completo');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ error: 'Error interno al consultar usuarios' });
  }
});

// CREAR UN NUEVO USUARIO (Sin cambios)
app.post('/api/usuarios', [verificarToken, adminOnly], async (req, res) => {
  // ... (tu código de POST /api/usuarios no cambia)
  const { nombre_completo, nombre_usuario, password, rol, email } = req.body;
  if (!nombre_completo || !nombre_usuario || !password || !rol) {
    return res.status(400).json({ error: 'Todos los campos son requeridos: nombre_completo, nombre_usuario, password, rol' });
  }
  if (rol !== 'admin' && rol !== 'usuario') {
    return res.status(400).json({ error: "Rol inválido. Debe ser 'admin' o 'usuario'." });
  }
  try {
    const salt = bcrypt.genSaltSync(10);
    const contrasena_hash = bcrypt.hashSync(password, salt);
    const query = `
      INSERT INTO usuarios (nombre_completo, nombre_usuario, contrasena_hash, rol, email)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, nombre_completo, nombre_usuario, rol, email;
    `;
    const values = [nombre_completo, nombre_usuario, contrasena_hash, rol, email || null];
    const result = await pool.query(query, values);
    const nuevoUsuario = result.rows[0];

    await registrarHistorial(
      req.user.id, 
      req.user.username, 
      'CREAR', 
      'USUARIO', 
      nuevoUsuario.id, 
      `Creó al usuario '${nuevoUsuario.nombre_usuario}' con rol '${nuevoUsuario.rol}'`
    );

    res.status(201).json(nuevoUsuario);
  } catch (err) {
    if (err.code === '23505') { 
      return res.status(409).json({ error: 'El nombre de usuario ya existe' });
    }
    console.error('Error al crear usuario:', err);
    res.status(500).json({ error: 'Error interno al crear el usuario' });
  }
});

// ACTUALIZAR UN USUARIO: [Admin, REGISTRO DETALLADO]
app.put('/api/usuarios/:id', [verificarToken, adminOnly], async (req, res) => {
  const { id } = req.params;
  const datosNuevos = req.body; 
  
  if (!datosNuevos.nombre_completo || !datosNuevos.nombre_usuario || !datosNuevos.rol) {
    return res.status(400).json({ error: 'Los campos nombre_completo, nombre_usuario y rol son requeridos' });
  }
  if (datosNuevos.rol !== 'admin' && datosNuevos.rol !== 'usuario') {
    return res.status(400).json({ error: "Rol inválido. Debe ser 'admin' o 'usuario'." });
  }
  try {
    // --- PASO 1: Obtener datos antiguos ---
    const infoAntigua = await pool.query('SELECT id, nombre_completo, nombre_usuario, rol, email FROM usuarios WHERE id = $1', [id]);
    if (infoAntigua.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const datosAntiguos = infoAntigua.rows[0];
    
    // --- PASO 2: Preparar y ejecutar la actualización (Sin cambios) ---
    let query;
    let values;
    let passwordCambiada = false;

    if (datosNuevos.password && datosNuevos.password.trim() !== '') {
      passwordCambiada = true;
      const salt = bcrypt.genSaltSync(10);
      const contrasena_hash = bcrypt.hashSync(datosNuevos.password, salt);
      query = `
        UPDATE usuarios SET
          nombre_completo = $1,
          nombre_usuario = $2,
          rol = $3,
          email = $4,
          contrasena_hash = $5
        WHERE id = $6
        RETURNING id, nombre_completo, nombre_usuario, rol, email;
      `;
      values = [datosNuevos.nombre_completo, datosNuevos.nombre_usuario, datosNuevos.rol, datosNuevos.email || null, contrasena_hash, id];
    } else {
      query = `
        UPDATE usuarios SET
          nombre_completo = $1,
          nombre_usuario = $2,
          rol = $3,
          email = $4
        WHERE id = $5
        RETURNING id, nombre_completo, nombre_usuario, rol, email;
      `;
      values = [datosNuevos.nombre_completo, datosNuevos.nombre_usuario, datosNuevos.rol, datosNuevos.email || null, id];
    }
    const result = await pool.query(query, values);
    const usuarioActualizado = result.rows[0];

    // --- 👇 ¡MODIFICADO! PASO 3: Generar detalles y registrar historial ---
    const catalogMaps = catalogCache ? catalogCache.maps : null;
    const cambiosTexto = generarDetalleDeCambios(datosAntiguos, datosNuevos, catalogMaps);
    
    let detalleFinal = `Editó al usuario '${usuarioActualizado.nombre_usuario}'. `;
    if (cambiosTexto && cambiosTexto !== '(Sin cambios detectados)') {
      detalleFinal += `Cambios: [${cambiosTexto}]. `;
    }
    if (passwordCambiada) {
      detalleFinal += "[Contraseña actualizada].";
    }
    if (cambiosTexto === '(Sin cambios detectados)' && !passwordCambiada) {
      detalleFinal += "(Sin cambios detectados)";
    }

    await registrarHistorial(
      req.user.id, 
      req.user.username, 
      'EDITAR', 
      'USUARIO', 
      usuarioActualizado.id, 
      detalleFinal
    );
    // --- 👆 FIN DE CAMBIOS 👆 ---

    res.status(200).json(usuarioActualizado);
  } catch (err) {
    if (err.code === '23505') { 
      return res.status(409).json({ error: 'El nombre de usuario ya existe' });
    }
    console.error(`Error al actualizar usuario ${id}:`, err);
    res.status(500).json({ error: 'Error interno al actualizar el usuario' });
  }
});

// BORRAR UN USUARIO (Sin cambios)
app.delete('/api/usuarios/:id', [verificarToken, adminOnly], async (req, res) => {
  // ... (tu código de DELETE /api/usuarios/:id no cambia)
  const { id } = req.params;
  if (req.user.id == id) {
    return res.status(403).json({ error: 'No puedes eliminar tu propia cuenta de administrador' });
  }
  try {
    const infoQuery = await pool.query('SELECT nombre_usuario FROM usuarios WHERE id = $1', [id]);
    if (infoQuery.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    const nombreUsuarioEliminado = infoQuery.rows[0].nombre_usuario;
    
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);

    await registrarHistorial(
      req.user.id, 
      req.user.username, 
      'ELIMINAR', 
      'USUARIO', 
      id, 
      `Eliminó al usuario '${nombreUsuarioEliminado}' (ID: ${id})`
    );

    res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  } catch (err) {
    console.error(`Error al eliminar usuario ${id}:`, err);
    res.status(500).json({ error: 'Error interno al eliminar el usuario' });
  }
});


// --- RUTA PARA VER EL HISTORIAL (Sin cambios) ---
// --- RUTA MEJORADA PARA EL HISTORIAL ---
app.get('/api/historial', [verificarToken, adminOnly], async (req, res) => {
  const { 
    fecha_inicio, 
    fecha_fin, 
    id_usuario, 
    accion,
    tipo_entidad,
    id_entidad,
    page = 1, 
    limit = 20 
  } = req.query;

  const offset = (page - 1) * limit;

  try {
    let whereClauses = [];
    let values = [];

    // 1. Filtro por Rango de Fechas
    if (fecha_inicio && fecha_fin) {
      values.push(fecha_inicio, fecha_fin);
      whereClauses.push(`DATE("timestamp") BETWEEN $${values.length - 1} AND $${values.length}`);
    } else if (fecha_inicio) {
      values.push(fecha_inicio);
      whereClauses.push(`DATE("timestamp") >= $${values.length}`);
    } else if (fecha_fin) {
      values.push(fecha_fin);
      whereClauses.push(`DATE("timestamp") <= $${values.length}`);
    }

    // 2. Filtro por Usuario
    if (id_usuario) {
      values.push(id_usuario);
      whereClauses.push(`id_usuario = $${values.length}`);
    }

    // 3. Filtro por Acción
    if (accion) {
      values.push(accion);
      whereClauses.push(`accion = $${values.length}`);
    }

    // 4. Filtro por Tipo de Entidad
    if (tipo_entidad) {
      values.push(tipo_entidad);
      whereClauses.push(`tipo_entidad = $${values.length}`);
    }

    // 5. Filtro por ID de Entidad
    if (id_entidad) {
      values.push(id_entidad);
      whereClauses.push(`id_entidad = $${values.length}`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Consulta principal con JOIN para obtener nombre de usuario
    const queryData = `
      SELECT 
        h.*,
        u.nombre_completo as nombre_usuario,
        u.email as usuario_email
      FROM historial_actividad h
      LEFT JOIN usuarios u ON h.id_usuario = u.id
      ${whereStr}
      ORDER BY h."timestamp" DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    // Consulta para el total
    const queryCount = `
      SELECT COUNT(*) 
      FROM historial_actividad h
      ${whereStr}
    `;

    // Consulta para estadísticas
    const queryStats = `
      SELECT 
        accion,
        COUNT(*) as count
      FROM historial_actividad h
      ${whereStr}
      GROUP BY accion
    `;

    // Ejecutar consultas en paralelo
    const [dataRes, countRes, statsRes] = await Promise.all([
      pool.query(queryData, [...values, parseInt(limit), offset]),
      pool.query(queryCount, values),
      pool.query(queryStats, values)
    ]);

    // Procesar estadísticas
    const stats = {
      creaciones: 0,
      ediciones: 0,
      eliminaciones: 0
    };

    statsRes.rows.forEach(row => {
      switch(row.accion) {
        case 'CREAR':
          stats.creaciones = parseInt(row.count);
          break;
        case 'EDITAR':
          stats.ediciones = parseInt(row.count);
          break;
        case 'ELIMINAR':
          stats.eliminaciones = parseInt(row.count);
          break;
      }
    });

    res.json({
      data: dataRes.rows,
      total: parseInt(countRes.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      stats: stats,
      filtros: {
        fecha_inicio,
        fecha_fin,
        id_usuario,
        accion,
        tipo_entidad,
        id_entidad
      }
    });

  } catch (err) {
    console.error('Error al obtener historial:', err);
    res.status(500).json({ 
      error: 'Error interno al consultar el historial',
      detalles: err.message 
    });
  }
});

app.get('/api/historial/exportar', [verificarToken, adminOnly], async (req, res) => {
  const { formato = 'csv' } = req.query;

  try {
    const query = `
      SELECT 
        h."timestamp" as fecha,
        u.nombre_completo as usuario,
        h.accion,
        h.tipo_entidad,
        h.id_entidad,
        h.detalles,
        h.ip_address
      FROM historial_actividad h
      LEFT JOIN usuarios u ON h.id_usuario = u.id
      ORDER BY h."timestamp" DESC
    `;

    const result = await pool.query(query);

    if (formato === 'csv') {
      // Generar CSV
      const headers = ['Fecha', 'Usuario', 'Acción', 'Entidad', 'ID Entidad', 'Detalles', 'IP'];
      const csvData = result.rows.map(row => [
        new Date(row.fecha).toLocaleString('es-MX'),
        row.usuario || 'Sistema',
        row.accion,
        row.tipo_entidad,
        row.id_entidad,
        `"${(row.detalles || '').replace(/"/g, '""')}"`,
        row.ip_address || 'N/A'
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=historial.csv');
      res.send(csvContent);
    } else {
      res.json(result.rows);
    }

  } catch (err) {
    console.error('Error al exportar historial:', err);
    res.status(500).json({ error: 'Error interno al exportar historial' });
  }
});

// --- RUTA PARA OBTENER ESTADÍSTICAS GLOBALES ---
app.get('/api/historial/estadisticas', [verificarToken, adminOnly], async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN accion = 'CREAR' THEN 1 END) as creaciones,
        COUNT(CASE WHEN accion = 'EDITAR' THEN 1 END) as ediciones,
        COUNT(CASE WHEN accion = 'ELIMINAR' THEN 1 END) as eliminaciones,
        COUNT(DISTINCT id_usuario) as usuarios_activos,
        COUNT(DISTINCT tipo_entidad) as tipos_entidad,
        MAX("timestamp") as ultima_actividad
      FROM historial_actividad
      WHERE "timestamp" >= CURRENT_DATE - INTERVAL '30 days'
    `;

    const result = await pool.query(query);
    
    res.json({
      estadisticas: result.rows[0],
      periodo: '30_dias'
    });

  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({ error: 'Error interno al obtener estadísticas' });
  }
});

// --- RUTA PARA ACTIVIDAD RECIENTE ---
app.get('/api/historial/reciente', [verificarToken, adminOnly], async (req, res) => {
  const { limite = 10 } = req.query;

  try {
    const query = `
      SELECT 
        h.*,
        u.nombre_completo as nombre_usuario
      FROM historial_actividad h
      LEFT JOIN usuarios u ON h.id_usuario = u.id
      ORDER BY h."timestamp" DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [parseInt(limite)]);
    
    res.json({
      actividad_reciente: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error('Error al obtener actividad reciente:', err);
    res.status(500).json({ error: 'Error interno al obtener actividad reciente' });
  }
});

const getFechasReporte = (req) => {
let { fecha_inicio, fecha_fin } = req.query;
  // Usamos un rango lo suficientemente amplio para cubrir cualquier registro
  if (!fecha_inicio || !fecha_fin) {
    return ['2000-01-01', '2100-12-31'];
  }
  
  return [fecha_inicio, fecha_fin];
};
// --- RUTAS PARA REPORTES DE ACTIVACIONES ---
// 1. Gráfica: Origen de Activación (image_d0ffc8.png)
app.get('/api/reportes/origen', [verificarToken], async (req, res) => {
  const [fecha_inicio, fecha_fin] = getFechasReporte(req);
  try {
    const query = `
      SELECT 
        COALESCE(T.nombre, 'Sin Asignar') AS nombre, 
        COUNT(A.id) AS total,
        -- 🎯 CORRECCIÓN APLICADA: Si la categoría es 'Otro', agregamos los valores de tipo_activacion_otro
        CASE
          WHEN COALESCE(T.nombre, 'Sin Asignar') = 'Otro' THEN STRING_AGG(A.tipo_activacion_otro, ', ' ORDER BY A.tipo_activacion_otro)
          ELSE COALESCE(T.nombre, 'Sin Asignar')
        END AS desglose
      FROM activaciones A 
      LEFT JOIN tipo_activacion T ON A.id_tipo_activacion = T.id 
      WHERE A.fecha_activacion BETWEEN $1 AND $2 
      GROUP BY COALESCE(T.nombre, 'Sin Asignar') -- Blindaje: Agrupamos por el campo COALESCED
      ORDER BY total DESC;
    `;
    const result = await pool.query(query, [fecha_inicio, fecha_fin]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error en reporte /origen:', err);
    res.status(500).json({ error: 'Error al generar reporte de origen' });
  }
});

// 2. Gráfica: Urgencias Médicas (Imagen...9eac2d29.jpg)
app.get('/api/reportes/causas-clinicas', [verificarToken], async (req, res) => {
  const [fecha_inicio, fecha_fin] = getFechasReporte(req);
  try {
    const query = `
      SELECT 
        C.nombre, 
        COUNT(A.id) AS total 
      FROM activaciones A 
      JOIN causa_clinica C ON A.id_causa_clinica = C.id 
      WHERE A.fecha_activacion BETWEEN $1 AND $2 
      GROUP BY C.nombre 
      HAVING COUNT(A.id) > 0 
      ORDER BY total DESC;
    `;
    const result = await pool.query(query, [fecha_inicio, fecha_fin]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error en reporte /causas-clinicas:', err);
    res.status(500).json({ error: 'Error al generar reporte de causas clínicas' });
  }
});

// 3. Gráfica: Emergencias Traumatológicas (Imagen...c5a9596a.jpg)
app.get('/api/reportes/causas-traumaticas', [verificarToken], async (req, res) => {
  const [fecha_inicio, fecha_fin] = getFechasReporte(req);
  try {
    const query = `
      SELECT 
        C.nombre, 
        COUNT(A.id_activacion) AS total 
      FROM activacion_causas_traumaticas A 
      JOIN causa_traumatica_especifica C ON A.id_causa_traumatica_especifica = C.id 
      JOIN activaciones Act ON A.id_activacion = Act.id 
      WHERE Act.fecha_activacion BETWEEN $1 AND $2 
      GROUP BY C.nombre 
      HAVING COUNT(A.id_activacion) > 0 
      ORDER BY total DESC;
    `;
    const result = await pool.query(query, [fecha_inicio, fecha_fin]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error en reporte /causas-traumaticas:', err);
    res.status(500).json({ error: 'Error al generar reporte de causas traumáticas' });
  }
});

// 4. Gráfica: Destino Posterior (image_d103a7.png)
app.get('/api/reportes/destinos', [verificarToken], async (req, res) => {
  const [fecha_inicio, fecha_fin] = getFechasReporte(req);
  try {
    const query = `
      -- Parte 1: Traslados
      (
        SELECT 
          CASE 
            WHEN hospital_destino IN (SELECT nombre FROM catalogo_hospitales WHERE nombre != 'Otro') THEN hospital_destino
            ELSE 'Otros Hospitales' 
          END AS nombre,
          COUNT(id) AS total,
          -- CORRECCIÓN: Usamos STRING_AGG directamente, es seguro y válido siempre.
          STRING_AGG(DISTINCT hospital_destino, ', ') AS desglose
        FROM activaciones 
        WHERE requirio_traslado = true 
          AND hospital_destino IS NOT NULL 
          AND fecha_activacion BETWEEN $1 AND $2 
        GROUP BY 
          CASE 
            WHEN hospital_destino IN (SELECT nombre FROM catalogo_hospitales WHERE nombre != 'Otro') THEN hospital_destino
            ELSE 'Otros Hospitales' 
          END
      )
      UNION ALL
      -- Parte 2: No Traslados
      (
        SELECT 
          T.nombre AS nombre, 
          COUNT(A.id) AS total,
          NULL AS desglose
        FROM activaciones A 
        JOIN estado_traslado T ON A.id_estado_traslado = T.id 
        WHERE A.requirio_traslado = false 
          AND A.id_estado_traslado IS NOT NULL 
          AND A.fecha_activacion BETWEEN $1 AND $2 
        GROUP BY T.nombre
      )
      ORDER BY total DESC;
    `;
    const result = await pool.query(query, [fecha_inicio, fecha_fin]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error en reporte /destinos:', err);
    // Agregamos el mensaje de error real para que lo veas en la terminal si vuelve a fallar
    res.status(500).json({ error: 'Error al generar reporte de destinos', details: err.message });
  }
});

// Mapa seguro: Nombre en URL -> Nombre Real en Base de Datos
const TABLE_MAP = {
  'hospitales': 'catalogo_hospitales',
  'unidades': 'unidad_asignada',
  'tipos-evento': 'tipo_evento',
  'causas-clinicas': 'causa_clinica',
  'tipos-lesion': 'tipo_lesion',
  'tipos-activacion': 'tipo_activacion',
  'causas-traumaticas': 'causa_traumatica_especifica',
  'ubicaciones-lesion': 'ubicacion_lesion',
  'estados-traslado': 'estado_traslado',
  'agentes-causales': 'agente_causante_general'
};

// 1. GET: Obtener lista (Ordenada por ID)
app.get('/api/config/:catalogo', verificarToken, async (req, res) => {
  const { catalogo } = req.params;
  const tableName = TABLE_MAP[catalogo];

  if (!tableName) return res.status(400).json({ error: 'Catálogo no válido' });

  try {
    const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY nombre ASC`);
    res.json(result.rows);
  } catch (err) {
    console.error(`Error al obtener catálogo ${catalogo}:`, err);
    res.status(500).json({ error: 'Error al cargar el catálogo' });
  }
});

// 2. POST: Crear nuevo
app.post('/api/config/:catalogo', [verificarToken, adminOnly], async (req, res) => {
  const { catalogo } = req.params;
  const { nombre } = req.body;
  const tableName = TABLE_MAP[catalogo];

  if (!tableName || !nombre) return res.status(400).json({ error: 'Datos inválidos' });

  try {
    const query = `INSERT INTO ${tableName} (nombre, activo) VALUES ($1, true) RETURNING *`;
    const result = await pool.query(query, [nombre]);
    
    catalogCache = null;
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { 
      return res.status(409).json({ error: 'El nombre ya existe en este catálogo' });
    }
    console.error(`Error al crear en ${catalogo}:`, err);
    res.status(500).json({ error: 'Error al crear (posible duplicado)' });
  }
});

// 3. PUT: Editar nombre
app.put('/api/config/:catalogo/:id', [verificarToken, adminOnly], async (req, res) => {
  const { catalogo, id } = req.params;
  const { nombre } = req.body;
  const tableName = TABLE_MAP[catalogo];

  if (!tableName || !nombre) return res.status(400).json({ error: 'Datos inválidos' });

  try {
    const query = `UPDATE ${tableName} SET nombre = $1 WHERE id = $2 RETURNING *`;
    const result = await pool.query(query, [nombre, id]);
    
    catalogCache = null;
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { 
      return res.status(409).json({ error: 'El nombre ya existe en este catálogo' });
    }
    console.error(`Error al editar en ${catalogo}:`, err);
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

// 4. DELETE INTELIGENTE (Con protección especial para Hospitales)
app.delete('/api/config/:catalogo/:id', [verificarToken, adminOnly], async (req, res) => {
  const { catalogo, id } = req.params;
  const tableName = TABLE_MAP[catalogo];

  if (!tableName) return res.status(400).json({ error: 'Catálogo no válido' });

  try {
    // --- PASO EXTRA SOLO PARA HOSPITALES ---
    if (catalogo === 'hospitales') {
      // 1. Obtenemos el nombre del hospital
      const hospitalResult = await pool.query('SELECT nombre FROM catalogo_hospitales WHERE id = $1', [id]);
      
      if (hospitalResult.rows.length > 0) {
        const nombreHospital = hospitalResult.rows[0].nombre;
        
        // 2. Buscamos si se usó en activaciones (buscando por texto)
        const usoResult = await pool.query('SELECT 1 FROM activaciones WHERE hospital_destino = $1 LIMIT 1', [nombreHospital]);
        
        // 3. Si se usa, forzamos la desactivación
        if (usoResult.rows.length > 0) {
          const softDeleteQuery = `UPDATE ${tableName} SET activo = false WHERE id = $1 RETURNING *`;
          await pool.query(softDeleteQuery, [id]);
          
          catalogCache = null;
          return res.json({ 
            type: 'soft_deleted', 
            message: `El hospital "${nombreHospital}" se usa en reportes históricos. Se ha DESACTIVADO para no afectar las estadísticas.` 
          });
        }
      }
    }
    // --- FIN PASO EXTRA ---

    // INTENTO NORMAL (Borrado Físico)
    const query = `DELETE FROM ${tableName} WHERE id = $1`;
    await pool.query(query, [id]);
    
    catalogCache = null; 
    res.json({ type: 'deleted', message: 'Registro eliminado permanentemente (no tenía uso).' });

  } catch (err) {
    // INTENTO 2: Fallback por llave foránea (Para Unidades, Tipos, etc.)
    if (err.code === '23503') {
      try {
        const softDeleteQuery = `UPDATE ${tableName} SET activo = false WHERE id = $1 RETURNING *`;
        await pool.query(softDeleteQuery, [id]);
        
        catalogCache = null;
        return res.json({ 
          type: 'soft_deleted', 
          message: 'El registro está en uso. Se ha DESACTIVADO en lugar de borrarse.' 
        });
      } catch (updateErr) {
        console.error(`Error al desactivar fallback en ${catalogo}:`, updateErr);
        return res.status(500).json({ error: 'Error crítico al intentar desactivar.' });
      }
    }
    console.error(`Error al eliminar en ${catalogo}:`, err);
    res.status(500).json({ error: 'Error desconocido al eliminar.' });
  }
});

// 5. TOGGLE: Reactivar o Desactivar manualmente
app.patch('/api/config/:catalogo/:id/toggle', [verificarToken, adminOnly], async (req, res) => {
  const { catalogo, id } = req.params;
  const { activo } = req.body;
  const tableName = TABLE_MAP[catalogo];

  if (!tableName) return res.status(400).json({ error: 'Catálogo no válido' });

  try {
    const query = `UPDATE ${tableName} SET activo = $1 WHERE id = $2 RETURNING *`;
    const result = await pool.query(query, [activo, id]);
    
    catalogCache = null;
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error al cambiar estado en ${catalogo}:`, err);
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
});

// 7. Iniciar Servidor
// --- 👇 ¡MODIFICADO! Cargamos la caché antes de iniciar ---
getCatalogos().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Servidor backend unificado corriendo en http://localhost:${PORT}`);
    console.log(`📋 Módulos disponibles: Activaciones, Eventos, Usuarios, Historial`);
    console.log(`🔒 Seguridad: Rutas protegidas por Token JWT y Roles de Admin.`);
  });
}).catch(err => {
    console.error("❌ No se pudo iniciar el servidor por error al cargar catálogos:", err);
    process.exit(1);
});