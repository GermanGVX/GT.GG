require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); // Importante: /promise
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- FUNCIÓN DE CONEXIÓN CORREGIDA ---
async function getConnection() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ Error: No hay DATABASE_URL");
        throw new Error("Falta configuración de base de datos");
    }

    try {
        // TRUCO: Le agregamos '?multipleStatements=true' a la URL de Railway
        // Esto permite ejecutar el script de creación de tablas sin errores.
        const connectionString = process.env.DATABASE_URL.includes('?')
            ? process.env.DATABASE_URL + '&multipleStatements=true'
            : process.env.DATABASE_URL + '?multipleStatements=true';

        // Pasamos el texto de la URL directamente, SIN llaves {}
        const connection = await mysql.createConnection(connectionString);
        
        return connection;
    } catch (error) {
        console.error("❌ Error conectando:", error.message);
        throw error;
    }
}

// Probamos la conexión al iniciar el servidor para ver si funciona
getConnection()
    .then(async (conn) => {
        console.log("✅ ¡Conexión exitosa con MySQL en el arranque!");
        await conn.end(); // Cerramos esta conexión de prueba
    })
    .catch(err => {
        console.error("⚠️ Advertencia: El servidor inicia, pero la BD no responde:", err.message);
    });
// --- RUTA DE EMERGENCIA: CREAR TABLAS DESDE EL NAVEGADOR ---
app.get('/setup-db', async (req, res) => {
    const connection = await getConnection();
    try {
        console.log("🛠️ Iniciando creación de tablas en la nube...");
        
        // 1. Limpieza (Cuidado: borra datos previos)
        await connection.query(`DROP TABLE IF EXISTS build_spells`);
        await connection.query(`DROP TABLE IF EXISTS build_runes`);
        await connection.query(`DROP TABLE IF EXISTS build_items`);
        await connection.query(`DROP TABLE IF EXISTS builds`);
        await connection.query(`DROP TABLE IF EXISTS spells`);
        await connection.query(`DROP TABLE IF EXISTS runas`);
        await connection.query(`DROP TABLE IF EXISTS items`);
        await connection.query(`DROP TABLE IF EXISTS campeones`);
        await connection.query(`DROP TABLE IF EXISTS roles`);
        await connection.query(`DROP TABLE IF EXISTS admin_users`);

        // 2. Crear tablas maestras
        await connection.query(`CREATE TABLE roles (id INT AUTO_INCREMENT PRIMARY KEY, nombre_rol VARCHAR(50) UNIQUE NOT NULL)`);
        await connection.query(`CREATE TABLE campeones (id INT AUTO_INCREMENT PRIMARY KEY, campeon_id_api INT UNIQUE NOT NULL, nombre_campeon VARCHAR(100))`);
        await connection.query(`CREATE TABLE items (id INT AUTO_INCREMENT PRIMARY KEY, item_id_api INT UNIQUE NOT NULL, nombre_item VARCHAR(100))`);
        await connection.query(`CREATE TABLE runas (id INT AUTO_INCREMENT PRIMARY KEY, runa_id_api INT UNIQUE NOT NULL, nombre_runa VARCHAR(100))`);
        await connection.query(`CREATE TABLE spells (id INT AUTO_INCREMENT PRIMARY KEY, spell_id_api INT UNIQUE NOT NULL, nombre_spell VARCHAR(100))`);
        
        // 3. Crear tabla Usuarios y Admin por defecto
        await connection.query(`CREATE TABLE admin_users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL)`);
        await connection.query(`INSERT INTO admin_users (username, password) VALUES ('admin', 'admin123')`);

        // 4. Crear tabla Builds y relaciones
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

        res.send("<h1>✅ ¡Tablas creadas con éxito en Railway!</h1><p>Ahora puedes usar la app.</p>");

    } catch (error) {
        console.error(error);
        res.status(500).send("<h1>❌ Error creando tablas</h1><pre>" + error.message + "</pre>");
    } finally {
        connection.end();
    }
});
// --- RUTA: GUARDAR BUILD COMPLETA ---
app.post('/api/builds', async (req, res) => {
    const connection = await getConnection();
    
    try {
        await connection.beginTransaction(); // Iniciamos una transacción (si algo falla, se cancela todo)

        // Datos que vienen del Frontend
        const { 
            nombre_build, 
            campeon_data, // Objeto: { id_api: 103, nombre: 'Ahri' }
            rol_nombre,   // String: 'Mago'
            items,        // Array: [{ id_api: 3089, nombre: 'Rabadon', tipo: 'Core', orden: 1 }, ...]
            runas,        // Array: [{ id_api: 8112, nombre: 'Electrocutar', tipo: 'Primaria' }, ...]
            spells        // Array: [{ id_api: 4, nombre: 'Flash' }, ...]
        } = req.body;

        // 1. GESTIONAR ROL (Si no existe, lo crea)
        // Usamos INSERT IGNORE para no fallar si ya existe
        await connection.query('INSERT IGNORE INTO roles (nombre_rol) VALUES (?)', [rol_nombre]);
        const [rolRes] = await connection.query('SELECT id FROM roles WHERE nombre_rol = ?', [rol_nombre]);
        const rolId = rolRes[0].id;

        // 2. GESTIONAR CAMPEÓN (Si no existe, lo crea)
        await connection.query('INSERT IGNORE INTO campeones (campeon_id_api, nombre_campeon) VALUES (?, ?)', 
            [campeon_data.id_api, campeon_data.nombre]);
        const [campRes] = await connection.query('SELECT id FROM campeones WHERE campeon_id_api = ?', [campeon_data.id_api]);
        const campeonId = campRes[0].id;

        // 3. CREAR LA BUILD
        const [buildRes] = await connection.query(
            'INSERT INTO builds (nombre_build, campeon_id, rol_id) VALUES (?, ?, ?)',
            [nombre_build, campeonId, rolId]
        );
        const buildId = buildRes.insertId;

        // 4. GESTIONAR ITEMS (Bucle)
        if (items && items.length > 0) {
            for (const item of items) {
                // Asegurar que el ítem exista en el catálogo
                await connection.query('INSERT IGNORE INTO items (item_id_api, nombre_item) VALUES (?, ?)', 
                    [item.id_api, item.nombre]);
                // Obtener su ID interno
                const [itemDb] = await connection.query('SELECT id FROM items WHERE item_id_api = ?', [item.id_api]);
                // Relacionarlo con la build
                await connection.query(
                    'INSERT INTO build_items (build_id, item_id, tipo, orden) VALUES (?, ?, ?, ?)',
                    [buildId, itemDb[0].id, item.tipo, item.orden]
                );
            }
        }

        // 5. GESTIONAR RUNAS (Bucle)
        if (runas && runas.length > 0) {
            for (const runa of runas) {
                await connection.query('INSERT IGNORE INTO runas (runa_id_api, nombre_runa) VALUES (?, ?)', 
                    [runa.id_api, runa.nombre]);
                const [runaDb] = await connection.query('SELECT id FROM runas WHERE runa_id_api = ?', [runa.id_api]);
                await connection.query(
                    'INSERT INTO build_runes (build_id, runa_id, tipo) VALUES (?, ?, ?)',
                    [buildId, runaDb[0].id, runa.tipo]
                );
            }
        }

        await connection.commit(); // Guardar todo
        res.json({ success: true, message: 'Build guardada con ID: ' + buildId });

    } catch (error) {
        await connection.rollback(); // Si falla, deshacer cambios
        console.error(error);
        res.status(500).json({ error: 'Error guardando la build', details: error.message });
    } finally {
        connection.end();
    }
});

// --- RUTA: OBTENER BUILDS DE UN CAMPEÓN ---
app.get('/api/builds/:campeonIdApi', async (req, res) => {
    const connection = await getConnection();
    try {
        const campIdApi = req.params.campeonIdApi;
        
        // Consulta compleja para traer todo junto
        const sql = `
            SELECT 
                b.id as build_id, b.nombre_build, r.nombre_rol,
                c.nombre_campeon,
                i.item_id_api, i.nombre_item, bi.tipo as item_tipo,
                ru.runa_id_api, ru.nombre_runa, br.tipo as runa_tipo
            FROM builds b
            JOIN campeones c ON b.campeon_id = c.id
            JOIN roles r ON b.rol_id = r.id
            LEFT JOIN build_items bi ON b.id = bi.build_id
            LEFT JOIN items i ON bi.item_id = i.id
            LEFT JOIN build_runes br ON b.id = br.build_id
            LEFT JOIN runas ru ON br.runa_id = ru.id
            WHERE c.campeon_id_api = ?
        `;

        const [rows] = await connection.query(sql, [campIdApi]);
        
        // Aquí tendrías que procesar 'rows' para agrupar los items por build
        // (Esto se puede mejorar con JSON_ARRAYAGG si tu MySQL es versión 8.0+)
        
        res.json(rows);
    } catch (error) {
        res.status(500).send(error.message);
    } finally {
        connection.end();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor Profesional listo en puerto ${PORT}`);
});