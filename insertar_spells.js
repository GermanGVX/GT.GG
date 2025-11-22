require('dotenv').config();
const mysql = require('mysql2/promise');
const fetch = require('node-fetch'); // Asegúrate de tenerlo instalado

async function insertarSpells() {
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

    // Obtener los spells (hechizos de invocador)
    const spellsResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${versionActual}/data/es_ES/summoner.json`);
    const spellsData = await spellsResponse.json();
    const spells = spellsData.data;

    console.log("📥 Insertando spells...");

    let count = 0;
    for (const spellKey in spells) {
      const spell = spells[spellKey];
      // Insertar el spell
      await connection.query(
        `INSERT IGNORE INTO spells (spell_id_api, nombre_spell) VALUES (?, ?)`,
        [parseInt(spell.key), spell.name] // key es el ID interno de Riot
      );
      count++;
    }

    console.log(`✅ ${count} spells insertados o ya existían.`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) await connection.end();
  }
}

insertarSpells();