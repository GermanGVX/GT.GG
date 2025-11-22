require('dotenv').config();
const mysql = require('mysql2/promise');
const fetch = require('node-fetch'); // Asegúrate de tenerlo instalado

async function insertarCampeones() {
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

    // Obtener los campeones
    const championsResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${versionActual}/data/es_ES/champion.json`);
    const championsData = await championsResponse.json();
    const champions = championsData.data;

    console.log("📥 Insertando campeones...");

    let count = 0;
    for (const championKey in champions) {
      const champion = champions[championKey];
      // Insertar el campeón
      await connection.query(
        `INSERT IGNORE INTO campeones (campeon_id_api, nombre_campeon) VALUES (?, ?)`,
        [parseInt(champion.key), champion.name] // key es el ID interno de Riot
      );
      count++;
    }

    console.log(`✅ ${count} campeones insertados o ya existían.`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) await connection.end();
  }
}

insertarCampeones();