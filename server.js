require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); 
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 🔴 LÍNEA MÁGICA: Servir archivos estáticos (HTML, CSS, JS, Imágenes)
// Esto hace que al entrar a tu web, se vea el index.html y funcionen los estilos.
app.use(express.static(__dirname)); 

// --- FUNCIÓN DE CONEXIÓN ---
const DB_URL_INTERNAL = "mysql://root:sQuqZeKRyywMcenFMVKkpPeMxOQKNmeH@mysql.railway.internal:3306/railway";

async function getConnection() {
    const dbUrlString = process.env.DATABASE_URL || DB_URL_INTERNAL;

    if (!dbUrlString) {
        console.error("❌ ERROR: No hay variable DATABASE_URL.");
        throw new Error("Falta configuración de base de datos");
    }

    try {
        const dbUrl = new URL(dbUrlString);
        const config = {
            host: dbUrl.hostname,
            user: dbUrl.username,
            password: dbUrl.password,
            database: dbUrl.pathname.slice(1),
            port: dbUrl.port,
            multipleStatements: true,
            ssl: { rejectUnauthorized: false }
        };

        const connection = await mysql.createConnection(config);
        return connection;

    } catch (error) {
        console.error("❌ Error técnico al conectar:", error.message);
        throw error;
    }
}

// --- RUTA DE EMERGENCIA: SETUP ---
app.get('/setup-db', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        // Borrar todo para empezar limpio
        await connection.query(`DROP TABLE IF EXISTS build_spells, build_runes, build_items, builds, spells, runas, items, campeones, roles, admin_users`);

        // Crear tablas
        await connection.query(`CREATE TABLE roles (id INT AUTO_INCREMENT PRIMARY KEY, nombre_rol VARCHAR(50) UNIQUE NOT NULL)`);
        await connection.query(`CREATE TABLE campeones (id INT AUTO_INCREMENT PRIMARY KEY, campeon_id_api INT UNIQUE NOT NULL, nombre_campeon VARCHAR(100))`);
        await connection.query(`CREATE TABLE items (id INT AUTO_INCREMENT PRIMARY KEY, item_id_api INT UNIQUE NOT NULL, nombre_item VARCHAR(100))`);
        await connection.query(`CREATE TABLE runas (id INT AUTO_INCREMENT PRIMARY KEY, runa_id_api INT UNIQUE NOT NULL, nombre_runa VARCHAR(100))`);
        await connection.query(`CREATE TABLE spells (id INT AUTO_INCREMENT PRIMARY KEY, spell_id_api INT UNIQUE NOT NULL, nombre_spell VARCHAR(100))`);
        
        await connection.query(`CREATE TABLE admin_users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL)`);
        await connection.query(`INSERT INTO admin_users (username, password) VALUES ('admin', 'admin123')`);

        await connection.query(`
            CREATE TABLE builds (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre_build VARCHAR(100),
                campeon_id INT,
                rol_id INT,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (campeon_id) REFERENCES campeones(id) ON DELETE CASCADE,
                FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE SET NULL
            )
        `);

        await connection.query(`
            CREATE TABLE build_items (
                id INT AUTO_INCREMENT PRIMARY KEY, build_id INT, item_id INT, tipo ENUM('Core', 'Situacional', 'Botas') DEFAULT 'Core', orden INT,
                FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE, FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
            )
        `);

        await connection.query(`
            CREATE TABLE build_runes (
                id INT AUTO_INCREMENT PRIMARY KEY, build_id INT, runa_id INT, tipo ENUM('Primaria', 'Secundaria', 'Fragmento'),
                FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE, FOREIGN KEY (runa_id) REFERENCES runas(id) ON DELETE CASCADE
            )
        `);

        res.send("<h1>✅ Tablas Creadas</h1><a href='/'>Ir al Inicio</a>");

    } catch (error) {
        res.status(500).send("<h1>❌ Error</h1><pre>" + error.message + "</pre>");
    } finally {
        if (connection) connection.end();
    }
});

// --- API: GUARDAR BUILD ---
app.post('/api/builds', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        await connection.beginTransaction(); 

        const { nombre_build, campeon_data, rol_nombre, items, runas } = req.body;

        if (!campeon_data || !rol_nombre) throw new Error("Faltan datos");

        await connection.query('INSERT IGNORE INTO roles (nombre_rol) VALUES (?)', [rol_nombre]);
        const [rolRes] = await connection.query('SELECT id FROM roles WHERE nombre_rol = ?', [rol_nombre]);
        
        await connection.query('INSERT IGNORE INTO campeones (campeon_id_api, nombre_campeon) VALUES (?, ?)', [campeon_data.id_api, campeon_data.nombre]);
        const [campRes] = await connection.query('SELECT id FROM campeones WHERE campeon_id_api = ?', [campeon_data.id_api]);
        
        const [buildRes] = await connection.query('INSERT INTO builds (nombre_build, campeon_id, rol_id) VALUES (?, ?, ?)', [nombre_build, campRes[0].id, rolRes[0].id]);
        const buildId = buildRes.insertId;

        if (items && items.length > 0) {
            for (const item of items) {
                await connection.query('INSERT IGNORE INTO items (item_id_api, nombre_item) VALUES (?, ?)', [item.id_api, item.nombre]);
                const [itemDb] = await connection.query('SELECT id FROM items WHERE item_id_api = ?', [item.id_api]);
                await connection.query('INSERT INTO build_items (build_id, item_id, tipo, orden) VALUES (?, ?, ?, ?)', [buildId, itemDb[0].id, item.tipo || 'Core', item.orden || 1]);
            }
        }

        if (runas && runas.length > 0) {
            for (const runa of runas) {
                await connection.query('INSERT IGNORE INTO runas (runa_id_api, nombre_runa) VALUES (?, ?)', [runa.id_api, runa.nombre]);
                const [runaDb] = await connection.query('SELECT id FROM runas WHERE runa_id_api = ?', [runa.id_api]);
                await connection.query('INSERT INTO build_runes (build_id, runa_id, tipo) VALUES (?, ?, ?)', [buildId, runaDb[0].id, runa.tipo || 'Primaria']);
            }
        }

        await connection.commit(); 
        res.json({ success: true, message: 'Guardado', id: buildId });

    } catch (error) {
        if (connection) await connection.rollback(); 
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.end();
    }
});

// --- API: BUSCAR ---
app.get('/api/builds/search', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const query = req.query.q; 
        let sql = `SELECT b.id, b.nombre_build, b.fecha, c.nombre_campeon, c.campeon_id_api, r.nombre_rol FROM builds b LEFT JOIN campeones c ON b.campeon_id = c.id LEFT JOIN roles r ON b.rol_id = r.id`;
        let params = [];
        if (query) { sql += ` WHERE c.nombre_campeon LIKE ?`; params.push(`%${query}%`); }
        sql += ` ORDER BY b.fecha DESC LIMIT 20`;
        const [rows] = await connection.query(sql, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.end();
    }
});

// --- API: LOGIN ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    let connection;
    try {
        connection = await getConnection();
        const [rows] = await connection.query('SELECT * FROM admin_users WHERE username = ? AND password = ?', [username, password]);
        if (rows.length > 0) {
            res.json({ success: true });
        } else {
            res.status(401).json({ success: false });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.end();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor web listo en puerto ${PORT}`);
});

// --- API: DETALLES DE UNA BUILD ---
app.get('/api/builds/:buildId', async (req, res) => {
  const { buildId } = req.params;
  let connection;

  try {
    connection = await getConnection();

    // Consultar la build
    const [buildRows] = await connection.query(`
      SELECT 
        b.nombre_build,
        b.fecha,
        c.nombre_campeon,
        c.campeon_id_api,
        r.nombre_rol,
        r.descripcion
      FROM builds b
      LEFT JOIN campeones c ON b.campeon_id = c.id
      LEFT JOIN roles r ON b.rol_id = r.id
      WHERE b.id = ?
    `, [buildId]);

    if (buildRows.length === 0) {
      return res.status(404).json({ error: "Build no encontrada" });
    }

    const build = buildRows[0];

    // Consultar items de la build
    const [itemRows] = await connection.query(`
      SELECT 
        i.nombre_item,
        i.item_id_api,
        bi.tipo,
        bi.orden
      FROM build_items bi
      JOIN items i ON bi.item_id = i.id
      WHERE bi.build_id = ?
      ORDER BY bi.tipo, bi.orden
    `, [buildId]);

    // Consultar runas de la build
    const [runeRows] = await connection.query(`
      SELECT 
        r.nombre_runa,
        r.runa_id_api,
        br.tipo
      FROM build_runes br
      JOIN runas r ON br.runa_id = r.id
      WHERE br.build_id = ?
      ORDER BY br.tipo
    `, [buildId]);

    // Agrupar items y runas
    const items = { core: [], situacionales: [] };
    itemRows.forEach(item => {
      if (item.tipo === 'Situacional') {
        items.situacionales.push({ nombre: item.nombre_item, id_api: item.item_id_api });
      } else {
        items.core.push({ nombre: item.nombre_item, id_api: item.item_id_api });
      }
    });

    const runas = { primarias: [], secundarias: [], fragmentos: [] };
    runeRows.forEach(runa => {
      if (runa.tipo === 'Primaria') {
        runas.primarias.push({ nombre: runa.nombre_runa, id_api: runa.runa_id_api });
      } else if (runa.tipo === 'Secundaria') {
        runas.secundarias.push({ nombre: runa.nombre_runa, id_api: runa.runa_id_api });
      } else if (runa.tipo === 'Fragmento') {
        runas.fragmentos.push({ nombre: runa.nombre_runa, id_api: runa.runa_id_api });
      }
    });

    res.json({
      ...build,
      items,
      runas
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) connection.end();
  }
});