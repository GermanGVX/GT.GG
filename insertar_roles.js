require('dotenv').config();
const mysql = require('mysql2/promise');

// Definición de roles
const roles = {
  "Mage": {
    nombre: "Mage",
    descripcion: "Campeones que infligen daño constante mediante sus habilidades. No siempre deben ser de poder de habilidad (AP), pero su estilo se centra en maximizar el daño de habilidades, aprovechar la reducción de enfriamiento, la gestión de maná y pasivas que proporcionan mayor daño. Suelen posicionarse en la retaguardia para aplicar presión con su DPS de habilidades."
  },
  "Assassin": {
    nombre: "Assassin",
    descripcion: "Campeón de alto burst que busca eliminar rápidamente a los objetivos frágiles, no busca peleas largas ni continuas, busca daño bruto y penetracion de armadura ya sea porcentual o plana ."
  },
  "Assault": {
    nombre: "Assault",
     descripcion: "Campeones centrados en infligir daño sostenido con ataques básicos. Su estilo gira en torno a maximizar el DPS a través de velocidad de ataque, efectos al impacto (on-hit) o críticos(on-attack), aprovechando la presión constante en peleas extendidas."
  },
  "Tank": {
    nombre: "Tank",
    descripcion: "Campeones resistentes cuya función principal es absorber daño y proteger a su equipo. Se enfocan en acumulación de vida, armadura y resistencia mágica, destacando por su capacidad de iniciar peleas, aplicar control de masas y mantenerse en primera línea."
  },
    
  //2
  "Aegis": {
    nombre: "Aegis",
    descripcion: "Campeones que son Tankes y Mages, por lo tanto buscan peleas donde puedan extender tradeos metiendo daño de habilidades continuos con la variable de poder absorber daño."
  },
  "Spellbade": {
    nombre: "Spellbade",
    descripcion: "Campeones que son Assault y Mages, por lo tanto buscan peleas donde puedan extender tradeos metiendo daño de habilidades continuos y daño continuo de basicos"
  },
  "Berserker": {
    nombre: "Berserker",
    descripcion: "Campeones que son Assault y Tank, por lo tanto buscan peleas donde puedan extender tradeos metiendo daño continuo de basicos con la variable de poder absorber daño."
  },
  "Warlock": {
    nombre: "Warlock",
    descripcion: "Campeones que son Assassin y Mages, por lo tanto buscan peleas donde pueda meter un daño explosivo de habilidades, para deletear a un objetivo"
  },
  "Duelist": {
    nombre: "Duelist",
    descripcion: "Campeones que son Assassin y Assault, por lo tanto buscan peleas donde pueda meter un daño explosivo de basicos, para deletear a un objetivo"
  },
  "Rogue": {
    nombre: "Rogue",
    descripcion: "Campeones que son Tank y Assassin, por lo tanto buscan peleas donde puedan meter un daño explosivo, para deletear a un objetivo con la variable de poder absorber daño"
  },

  //3
    "Emberlord": {
    nombre: "Emberlord",
    descripcion: "Campeones que son Assault, Tank y Mage, por lo tanto buscan peleas donde puedan extender tradeos metiendo daño continuo de basicos y habilidades con la variable de poder absorber daño."
  },
    "Arcanist": {
    nombre: "Arcanist",
    descripcion: "Campeones que son Assassin, Tank y Mage, por lo tanto buscan peleas donde puedan meter daño explosivo de habilidades con la variable de poder absorber daño."
  },
    "Revenant": {
    nombre: "Revenant",
    descripcion: "Campeones que son Assassin, Tank y Assault, por lo tanto buscan peleas donde puedan meter daño explosivo de basicos con la variable de poder absorber daño."
  },
    "Duskbane": {
    nombre: "Duskbane",
    descripcion: "Campeones que son Assault, Assassin y Mage, por lo tanto buscan peleas donde puedan extender tradeos metiendo daño continuo de basicos y habilidades con la variable de poder meter un burts de daño"
  },
  //4
  "Elite": {
    nombre: "Elite",
    descripcion: "Campeones que son Assault, Assassin, Mage y Tank, por lo tanto buscan peleas donde puedan extender tradeos metiendo daño continuo de basicos y habilidades con la variable de poder meter un burts de daño y el poder absorber daño"
  },
  //5
"Peeler": { 
  "nombre": "Peeler",
  "descripcion": "Campeones enfocados en proteger a los carries, ofreciendo curaciones, escudos y mejoras. Su estilo de juego gira en torno a mantener con vida a los aliados clave y darles las herramientas para brillar en peleas."
},

"Vanguard": {
  "nombre": "Vanguard",
  "descripcion": "Campeones que lideran la carga, absorben daño y aseguran la primera línea. Suelen iniciar peleas, controlar zonas y aportar utilidad defensiva para mantener la cohesión del equipo."
},

"Playmaker": {
  "nombre": "Playmaker",
  "descripcion": "Campeones híbridos que combinan la protección de un Peeler con la iniciativa de un Vanguard. Destacan por generar jugadas clave, ya sea salvando a un aliado o iniciando peleas ventajosas para el equipo."
}
};

async function insertarRoles() {
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

    console.log("📥 Insertando roles...");

    let count = 0;
    for (const roleName in roles) {
      const role = roles[roleName];
      // Insertar el rol
      await connection.query(
        `INSERT IGNORE INTO roles (nombre_rol, descripcion) VALUES (?, ?)`,
        [role.nombre, role.descripcion]
      );
      count++;
    }

    console.log(`✅ ${count} roles insertados o ya existían.`);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    if (connection) await connection.end();
  }
}

insertarRoles();