require('dotenv').config();
const mysql = require('mysql2/promise'); // Usamos la versión con Promesas para que sea más limpio

async function crearTablas() {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log("🔌 Conectado a Railway MySQL...");

    try {
        // 1. BORRAR TABLAS EXISTENTES (En orden inverso para evitar errores de llaves foráneas)
        // Si te da error aquí la primera vez, no pasa nada, es porque no existen.
        await connection.query(`DROP TABLE IF EXISTS build_spells`);
        await connection.query(`DROP TABLE IF EXISTS build_runes`);
        await connection.query(`DROP TABLE IF EXISTS build_items`);
        await connection.query(`DROP TABLE IF EXISTS builds`);
        await connection.query(`DROP TABLE IF EXISTS spells`);
        await connection.query(`DROP TABLE IF EXISTS runas`);
        await connection.query(`DROP TABLE IF EXISTS items`);
        await connection.query(`DROP TABLE IF EXISTS campeones`);
        await connection.query(`DROP TABLE IF EXISTS roles`);
        await connection.query(`DROP TABLE IF EXISTS usuarios`);

        console.log("🗑️ Tablas antiguas limpiadas.");

        // 2. CREAR TABLAS "CATÁLOGO" (Las que guardan la info estática de Riot)
        
        // Tabla ROLES (Clases)
        await connection.query(`
            CREATE TABLE roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre_rol VARCHAR(50) UNIQUE NOT NULL, -- Ej: 'Mago', 'Asesino'
                descripcion VARCHAR(255)
            );
        `);

        // Tabla CAMPEONES
        await connection.query(`
            CREATE TABLE campeones (
                id INT AUTO_INCREMENT PRIMARY KEY,
                campeon_id_api INT UNIQUE NOT NULL, -- ID de Riot (ej: 103 para Ahri)
                nombre_campeon VARCHAR(100)
            );
        `);

        // Tabla ITEMS
        await connection.query(`
            CREATE TABLE items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                item_id_api INT UNIQUE NOT NULL, -- ID de Riot (ej: 3089)
                nombre_item VARCHAR(100)
            );
        `);

        // Tabla RUNAS
        await connection.query(`
            CREATE TABLE runas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                runa_id_api INT UNIQUE NOT NULL,
                nombre_runa VARCHAR(100)
            );
        `);

        // Tabla SPELLS (Hechizos de Invocador)
        await connection.query(`
            CREATE TABLE spells (
                id INT AUTO_INCREMENT PRIMARY KEY,
                spell_id_api INT UNIQUE NOT NULL,
                nombre_spell VARCHAR(100)
            );
        `);

        // 3. CREAR TABLA PRINCIPAL (La Build)
        await connection.query(`
            CREATE TABLE builds (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nombre_build VARCHAR(100), -- Ej: "Ahri Explosiva"
                campeon_id INT,
                rol_id INT,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (campeon_id) REFERENCES campeones(id) ON DELETE CASCADE,
                FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE SET NULL
            );
        `);

        // 4. CREAR TABLAS CONECTORAS (Las relaciones muchos-a-muchos)

        // Conector BUILD <-> ITEMS
        await connection.query(`
            CREATE TABLE build_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                build_id INT,
                item_id INT, -- Referencia a nuestra tabla items, no a la API directa
                tipo ENUM('Core', 'Situacional', 'Botas') DEFAULT 'Core',
                orden INT, -- Para saber en qué slot va (1-6)
                
                FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE,
                FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
            );
        `);

        // Conector BUILD <-> RUNAS
        await connection.query(`
            CREATE TABLE build_runes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                build_id INT,
                runa_id INT, -- Referencia a nuestra tabla runas
                tipo ENUM('Primaria', 'Secundaria', 'Fragmento'),
                
                FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE,
                FOREIGN KEY (runa_id) REFERENCES runas(id) ON DELETE CASCADE
            );
        `);

        // Conector BUILD <-> SPELLS
        await connection.query(`
            CREATE TABLE build_spells (
                id INT AUTO_INCREMENT PRIMARY KEY,
                build_id INT,
                spell_id INT, -- Referencia a nuestra tabla spells
                
                FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE,
                FOREIGN KEY (spell_id) REFERENCES spells(id) ON DELETE CASCADE
            );
        `);

        await connection.query(`
            CREATE TABLE usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user VARCHAR(50) UNIQUE NOT NULL,
                pass VARCHAR(255) NOT NULL
            );
            
            
            `);

        console.log("✅ ¡Estructura de tablas creada con éxito en Railway!");
        console.log("👉 Ahora tu base de datos soporta múltiples builds por campeón.");

    } catch (error) {
        console.error("❌ Error creando tablas:", error);
    } finally {
        connection.end();
    }
}

crearTablas();