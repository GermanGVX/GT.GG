require('dotenv').config();
const mysql = require('mysql2/promise');

// Definición de fragmentos de runas (shards)
const fragmentos = [
  { id_api: 5008, nombre: "Adaptive Force" },
  { id_api: 5005, nombre: "Attack Speed" },
  { id_api: 5007, nombre: "CDR Scaling" },
  { id_api: 5002, nombre: "Armor" },
  { id_api: 5003, nombre: "Magic Resist" },
  { id_api: 5001, nombre: "Health Scaling" }
];

async function insertarFragmentos() {
  let connection;

  try {
    // Conectar a la base de datos
    const dbUrlString = process.env.DATABASE_URL || "mysql://root:sQuqZeKRyywMcenFMVKkpPeMxOQKNmeH@mysql.railway.internal:3306/railway";
    const dbUrl = new URL(dbUrlString);
    const config = {
      host: dbUrl.hostname,
      user: dbUrl.username,
      password: dbUrl.password,
      database: dbUrl.pathname.slice(1),
      port: dbUrl.port,
      ssl: { rejectUnauthorized: false }
    };

    connection = await mysql.createConnection(config);
    console.log("🔌 Conectado a la base de datos");

    console.log("📥 Insertando fragmentos de runas...");

    let count = 0;
    for (const fragmento of fragmentos) {
      // Insertar el fragmento como una runa más
      await connection.query(
        `INSERT IGNORE INTO runas (runa_id_api, nombre_runa) VALUES (?, ?)`,
        [fragmento.id_api, fragmento.nombre]
      );
      count++;
    }

    console.log(`✅ ${count} fragmentos insertados o ya existían.`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) await connection.end();
  }
}

insertarFragmentos();