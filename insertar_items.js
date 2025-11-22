require('dotenv').config();
const mysql = require('mysql2/promise');
const fetch = require('node-fetch'); // Asegúrate de tenerlo instalado

async function insertarItems() {
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

    // Obtener los items
    const itemsResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${versionActual}/data/es_ES/item.json`);
    const itemsData = await itemsResponse.json();
    const items = itemsData.data;

    console.log("📥 Insertando items...");

    let count = 0;
    for (const itemId in items) {
      const item = items[itemId];
      // Solo insertar items que no sean "tags" ni estén ocultos
      if (item.name && !item.hideFromAll) {
        await connection.query(
          `INSERT IGNORE INTO items (item_id_api, nombre_item) VALUES (?, ?)`,
          [parseInt(itemId), item.name]
        );
        count++;
      }
    }

    console.log(`✅ ${count} items insertados o ya existían.`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) await connection.end();
  }
}

insertarItems();