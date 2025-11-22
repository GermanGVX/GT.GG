require('dotenv').config();
const mysql = require('mysql2/promise');
const fetch = require('node-fetch'); // Asegúrate de tenerlo instalado

async function insertarRunas() {
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

    // Obtener la versión actual de DDragon
    const versionResponse = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
    const versiones = await versionResponse.json();
    const versionActual = versiones[0];
    console.log("📦 Versión de DDragon:", versionActual);

    // Obtener las runas
    const runesResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${versionActual}/data/es_ES/runesReforged.json`);
    const runesData = await runesResponse.json();

    console.log("📥 Insertando runas...");

    let count = 0;
    for (const runeTree of runesData) {
      // Insertar runas primarias (mainTree)
      for (const slot of runeTree.slots) {
        for (const rune of slot.runes) {
          await connection.query(
            `INSERT IGNORE INTO runas (runa_id_api, nombre_runa) VALUES (?, ?)`,
            [rune.id, rune.name]
          );
          count++;
        }
      }

      // Insertar runas secundarias (subTree)
      for (const slot of runeTree.slots) {
        for (const rune of slot.runes) {
          await connection.query(
            `INSERT IGNORE INTO runas (runa_id_api, nombre_runa) VALUES (?, ?)`,
            [rune.id, rune.name]
          );
        }
      }
    }

    console.log(`✅ ${count} runas insertadas o ya existían.`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) await connection.end();
  }
}

insertarRunas();