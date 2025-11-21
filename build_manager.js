// --- build_manager.js ---
// Este archivo maneja la conexión con la Base de Datos y la lógica de armado de builds.
// No interfiere con el carrusel ni otras animaciones de app.js.

// Configuración
const API_URL = 'http://localhost:3000/api/builds';

// Estado global de la build que se está armando
window.buildActual = {
    nombre_build: "",
    campeon_data: { id_api: 0, nombre: "" },
    rol_nombre: "",
    items: [],
    runas: [],
    spells: []
};

// --- FUNCIONES DE SELECCIÓN ---

// Llama a esta función cuando el usuario haga clic en un campeón
function seleccionarCampeon(idApi, nombre) {
    window.buildActual.campeon_data = { id_api: idApi, nombre: nombre };
    console.log(`✅ Campeón seleccionado: ${nombre} (ID: ${idApi})`);
    
    // Opcional: Actualizar visualmente algún elemento del DOM si existe
    const visor = document.getElementById('visor-campeon-seleccionado');
    if (visor) visor.src = `https://ddragon.leagueoflegends.com/cdn/13.21.1/img/champion/${nombre}.png`;
}

// Llama a esta función cuando el usuario elija un rol (botón o select)
function seleccionarRol(nombreRol) {
    window.buildActual.rol_nombre = nombreRol;
    console.log(`✅ Rol seleccionado: ${nombreRol}`);
}

// Llama a esta función al hacer clic en un ítem
function agregarItem(idApi, nombreItem, tipo = 'Core') {
    if (window.buildActual.items.length >= 6) {
        alert("⚠️ Inventario lleno (Máx 6 items).");
        return;
    }

    // Calculamos el orden automáticamente
    const orden = window.buildActual.items.length + 1;

    window.buildActual.items.push({
        id_api: idApi,
        nombre: nombreItem,
        tipo: tipo,
        orden: orden
    });

    console.log(`⚔️ Ítem agregado: ${nombreItem}`);
    actualizarVistaItems(); // Refresca los iconos en pantalla
}

// Llama a esta función al hacer clic en una runa
function agregarRuna(idApi, nombreRuna, tipo) {
    window.buildActual.runas.push({
        id_api: idApi,
        nombre: nombreRuna,
        tipo: tipo
    });
    console.log(`✨ Runa agregada: ${nombreRuna}`);
}

// --- FUNCIONES DE SERVIDOR (GUARDAR) ---

async function guardarBuild() {
    // 1. Intentar obtener el nombre desde el input del HTML
    const inputNombre = document.getElementById('nombreBuildInput');
    if (inputNombre) window.buildActual.nombre_build = inputNombre.value;

    // 2. Validaciones
    if (!window.buildActual.campeon_data.nombre) {
        alert("⚠️ Debes seleccionar un campeón.");
        return;
    }
    if (!window.buildActual.nombre_build) {
        alert("⚠️ Debes ponerle un nombre a la build.");
        return;
    }

    console.log("⏳ Enviando build al servidor...", window.buildActual);

    try {
        const respuesta = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(window.buildActual)
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert(`✅ ¡Build guardada con éxito! (ID Interno: ${resultado.id})`);
            limpiarBuildActual();
        } else {
            console.error("Error del servidor:", resultado);
            alert(`❌ Error al guardar: ${resultado.details || resultado.error}`);
        }

    } catch (error) {
        console.error("Error de red:", error);
        alert("❌ No se pudo conectar con el servidor (Asegúrate de correr 'node server.js')");
    }
}

// --- FUNCIONES VISUALES (UI) ---

function actualizarVistaItems() {
    const contenedor = document.getElementById('contenedor-items-visual'); // Asegúrate de crear este DIV en tu HTML
    if (!contenedor) return;

    contenedor.innerHTML = ''; // Borrar contenido anterior

    window.buildActual.items.forEach((item, index) => {
        const img = document.createElement('img');
        // URL oficial de Riot para iconos
        img.src = `https://ddragon.leagueoflegends.com/cdn/13.21.1/img/item/${item.id_api}.png`;
        img.style.width = '50px';
        img.style.margin = '5px';
        img.style.border = '2px solid gold';
        img.style.cursor = 'pointer';
        img.title = "Clic para eliminar";
        
        // Al hacer clic en la imagen pequeña, se borra el ítem
        img.onclick = () => {
            window.buildActual.items.splice(index, 1);
            actualizarVistaItems();
        };

        contenedor.appendChild(img);
    });
}

function limpiarBuildActual() {
    window.buildActual.items = [];
    window.buildActual.runas = [];
    window.buildActual.nombre_build = "";
    
    actualizarVistaItems();
    
    const input = document.getElementById('nombreBuildInput');
    if (input) input.value = "";
}

// --- INICIALIZACIÓN ---
// Esperamos a que el HTML cargue para buscar el botón de guardar
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-guardar-build');
    if (btn) {
        btn.addEventListener('click', guardarBuild);
        console.log("✅ Botón de guardar vinculado correctamente.");
    }
});