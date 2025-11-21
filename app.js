let builds = {};

const nombreAId = {
  Wukong: "MonkeyKing",
  Aurelionsol: "AurelionSol",
  Reksai: "RekSai",
  Maestroyi: "MasterYi",
  // Agrega aca otros si queres
  
};
function obtenerIdOficial(nombreAmigable) {
  // Capitaliza para evitar problemas de mayúsculas/minúsculas
  const nombreCapitalizado = nombreAmigable.charAt(0).toUpperCase() + nombreAmigable.slice(1);
  return nombreAId[nombreCapitalizado] || nombreCapitalizado;
}
// Mapeo inverso ID oficial → nombre amigable
const idANombre = {};
for (const [nombre, id] of Object.entries(nombreAId)) {
  idANombre[id] = nombre;
}


const contenedorBuild = document.getElementById('contenedorBuild');
async function getVersion() {
  const response = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
  const versiones = await response.json();
  versionActual = versiones[0];
}

async function loadBuilds() {
  try {
    const response = await fetch("builds.json");
    if (!response.ok) {
      throw new Error(`Error al cargar builds.json: ${response.status}`);
    }
    builds = await response.json();
    console.log("Builds cargadas:", builds);
  } catch (error) {
    console.error("No se pudo cargar el archivo JSON:", error);
  }
}


function renderBotones(campeonId) {
  const botonesDiv = document.getElementById("botones");
  botonesDiv.innerHTML = "";
  if (!builds[campeonId]) return;

  const roles = Object.keys(builds[campeonId]);
  let firstButton = null;

  roles.forEach((rol, index) => {
    const btn = document.createElement("button");
    btn.textContent = rol.toUpperCase();

    btn.onclick = () => {
      mostrarBuild(campeonId, rol);

      // quitar la clase activa de todos los botones
      document.querySelectorAll("#botones button").forEach(b => b.classList.remove("active"));

      // agregar la clase activa solo al botón clickeado
      btn.classList.add("active");
    };

    botonesDiv.appendChild(btn);

    // guardar referencia al primer botón
    if (index === 0) {
      firstButton = btn;
    }
  });

  //  marcar como activo el primer botón automáticamente
  if (firstButton) {
    firstButton.classList.add("active");
    mostrarBuild(campeonId, roles[0]); // mostrar la build del primer rol
  }
}

function normalizarRol(rol) {
  return rol.charAt(0).toUpperCase() + rol.slice(1).toLowerCase();
}

const inforoles = {
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


// ✅ la función se mueve afuera
function mostrarBuild(campeonId, rol, opcionRunasIndex = 0) {
  const campeonBuilds = builds[campeonId];
  if (!campeonBuilds) {
    console.error("No existe build para", campeonId);
    return;
  }

  const build = campeonBuilds[rol]; // 👉 usamos la clave exacta, ej: "Mage 🔵"
  if (!build) {
    console.error("No existe build con rol", rol, "para", campeonId);
    return;
  }

  const resultados = document.getElementById("resultado");
  const nombreAmigable = idANombre[campeonId] || campeonId;
  const runas = build.opcionesRunas 
    ? build.opcionesRunas[opcionRunasIndex] 
    : build.runas;

  resultados.innerHTML = `
  <div class="card">
    <div class="card-header">
      <img class="champion-icon" 
           src="https://ddragon.leagueoflegends.com/cdn/${versionActual}/img/champion/${campeonId}.png">
      <h2>${nombreAmigable}</h2>
    </div>

    ${build ? `
      <div class="section">
        <h3>Runas</h3>
        ${build.opcionesRunas ? `
          <div class="rune-options">
            ${build.opcionesRunas.map((r, i) => `
              <button class="rune-btn ${i == opcionRunasIndex ? "active" : ""}" 
                      onclick="mostrarBuild('${campeonId}', '${rol}', ${i})">
                ${r.nombre}
              </button>
            `).join("")}
          </div>
        ` : ""}
        <div class="runes-primary">
          ${runas.primario.runas.map(r =>
            `<img src="https://ddragon.leagueoflegends.com/cdn/img/${r.icono}" alt="${r.nombre}">`
          ).join("")}
        </div>
        <div class="runes-secondary">
          ${runas.secundario.runas.map(r =>
            `<img src="https://ddragon.leagueoflegends.com/cdn/img/${r.icono}" alt="${r.nombre}">`
          ).join("")}
        </div>
        <div class="shards">
          ${runas.shards.map(s =>
            `<img src="https://ddragon.leagueoflegends.com/cdn/img/${s.icono}" alt="${s.nombre}">`
          ).join("")}
        </div>
        <div class="spells">
          ${build.spells.map(s =>
            `<img src="https://ddragon.leagueoflegends.com/cdn/${versionActual}/img/${s.icono}" alt="${s.nombre}">`
          ).join("")}
        </div>
      </div>

      <div class="section">
        <h3>Items</h3>
        <div class="items">
          ${build.items.map((id, index) => `
            <img src="https://ddragon.leagueoflegends.com/cdn/${versionActual}/img/item/${id}.png">
            ${index < build.items.length - 1 ? '<span class="arrow">→</span>' : ""}
          `).join("")}
        </div>
        <h3>Items Situacionales</h3>
        <div class="Items_S">
          ${build.Items_S.map(id => 
            `<img src="https://ddragon.leagueoflegends.com/cdn/${versionActual}/img/item/${id}.png">`
          ).join("")}
        </div>
      </div>

      <!-- 🔹 Info del rol -->
      <div class="section1">
        <h3>Rol: ${inforoles[build.rol]?.nombre || build.rol}</h3>
        <p>${inforoles[build.rol]?.descripcion || "Sin información disponible para este rol."}</p>
      </div>
    ` : `<p>⚠️ No hay build guardada para este campeón</p>`}
  </div>

  <div style="text-align: center; margin-top: 15px;">
    <button class="btn-stats" onclick="window.location.href='stats.html?champ=${campeonId}'">Stats</button>
  </div>
  `;
}

async function buscarCampeon(nombreParam) {
  const resultados = document.getElementById("resultado");
  let nombre = nombreParam;
  if (!nombre) {
    nombre = document.getElementById("search").value.toLowerCase();
  } else {
    nombre = nombre.toLowerCase();
  }
  // Capitalizar primera letra para buscar en el mapeo
  nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);

  nombre = nombreAId[nombre] || nombre;

  // Obtener ID oficial para buscar datos
  const idOficial = obtenerIdOficial(nombre);
  await getVersion();
  if (Object.keys(builds).length === 0) {
    await loadBuilds();
  }
  // Traigo lista de campeones
  const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${versionActual}/data/es_ES/champion.json`);
  const data = await response.json();
  const campeones = Object.values(data.data);
  // Buscar campeón por ID oficial (minúsculas)
  const campeon = campeones.find(c => c.id.toLowerCase() === idOficial.toLowerCase());
  if (!campeon) {
    resultados.innerHTML = `<p>⚠️ No se encontró el campeón "${nombre}"</p>`;
    return;
  }
  renderBotones(campeon.id);
  const roles = Object.keys(builds[campeon.id]);
  let rolPredeterminado = roles[0];
  mostrarBuild(campeon.id, rolPredeterminado);
  // Ocultar carrusel
  const carrusel = document.getElementById('carrusel');
  const titulo = document.querySelector('.titulo');
  const botones  = document.querySelector('.botones-home');
  if (carrusel) carrusel.style.display = 'none';
  if (titulo) titulo.style.display = 'none';
  if (botones) botones.style.display = 'none';
}





document.getElementById("resetDePagina").addEventListener("click", () => {
  location.reload();
});

document.getElementById("search").addEventListener("keydown", function(event) {                             
  if (event.key === "Enter") {
    event.preventDefault();  // evita que se envíe un formulario si lo hubiera
    buscarCampeon();
  }
});



let campeonesNombres = [];

async function cargarCampeones() {
  await getVersion();

  const response = await fetch(`https://ddragon.leagueoflegends.com/cdn/${versionActual}/data/es_ES/champion.json`);
  const data = await response.json();
  campeonesNombres = Object.values(data.data).map(c => c.id); // o c.name para nombre completo
}

const input = document.getElementById("search");
const sugerenciasDiv = document.getElementById("sugerencias");

input.addEventListener("input", () => {
  const texto = input.value.toLowerCase();
  sugerenciasDiv.innerHTML = "";

  if (texto.length === 0) {
    return;
  }
  
  // Filtrar por nombre amigable en el array campeones
  const resultados = campeones
  .map(c => c.nombre)
  .filter(nombre => nombre.toLowerCase().includes(texto.toLowerCase()))
  .slice(0, 5);
  resultados.forEach(nombre => {
    const div = document.createElement("div");
    div.textContent = nombre;
    div.addEventListener("click", () => {
      input.value = nombre;
      sugerenciasDiv.innerHTML = "";
      buscarCampeon(nombre); // Buscar con nombre amigable
    });
    sugerenciasDiv.appendChild(div);
  });
});

// Opcional: cerrar sugerencias al hacer clic fuera
document.addEventListener("click", (e) => {
  if (e.target !== input) {
    sugerenciasDiv.innerHTML = "";
  }
});

// Carga campeones al inicio
cargarCampeones();




const carrusel = document.getElementById('carrusel');
const cuadros = Array.from(carrusel.querySelectorAll('.cuadro'));

// Array con todos los campeones (puede tener cualquier cantidad)
const campeoneslista = [
  "Aatrox", "Ahri", "Akali", "Alistar","Ambessa", "Amumu", "Anivia", "Annie", "Aphelios", "Ashe",
  "AurelionSol","Aurora", "Azir", "Bard", "Belveth", "Blitzcrank", "Brand", "Braum", "Briar", "Caitlyn",
  "Camille", "Cassiopeia", "Chogath", "Corki", "Darius", "Diana", "Draven", "DrMundo", "Ekko",
  "Elise", "Evelynn", "Ezreal", "FiddleSticks", "Fiora", "Fizz", "Galio", "Gangplank", "Garen",
  "Gnar", "Gragas", "Graves", "Gwen", "Hecarim", "Heimerdinger", "Hwei", "Illaoi", "Irelia",
  "Ivern", "Janna", "JarvanIV", "Jax", "Jayce", "Jhin", "Jinx", "Kaisa", "Kalista", "Karma",
  "Karthus", "Kassadin", "Katarina", "Kayle", "Kayn", "Kennen", "Khazix", "Kindred", "Kled",
  "KogMaw", "KSante", "Leblanc", "LeeSin", "Leona", "Lillia", "Lissandra", "Lucian", "Lulu",
  "Lux", "Malphite", "Malzahar", "Maokai", "MasterYi","Mel", "Milio", "MissFortune", 
  "Mordekaiser", "Morgana", "Naafiri", "Nami", "Nasus", "Nautilus", "Neeko", "Nidalee", "Nilah",
  "Nocturne", "Nunu", "Olaf", "Orianna", "Ornn", "Pantheon", "Poppy", "Pyke", "Qiyana", "Quinn",
  "Rakan", "Rammus", "RekSai", "Rell", "Renata", "Renekton", "Rengar", "Riven", "Rumble", "Ryze",
  "Samira", "Sejuani", "Senna", "Seraphine", "Sett", "Shaco", "Shen", "Shyvana", "Singed", "Sion",
  "Sivir", "Skarner", "Smolder", "Sona", "Soraka", "Swain", "Sylas", "Syndra", "TahmKench",
  "Taliyah", "Talon", "Taric", "Teemo", "Thresh", "Tristana", "Trundle", "Tryndamere", "TwistedFate",
  "Twitch", "Udyr", "Urgot", "Varus", "Vayne", "Veigar", "Velkoz", "Vex", "Vi", "Viego", "Viktor",
  "Vladimir", "Volibear", "Warwick","MonkeyKing", "Xayah", "Xerath", "XinZhao", "Yasuo", "Yone", "Yorick","Yunara",
  "Yuumi", "Zac", "Zed", "Zeri", "Ziggs", "Zilean", "Zoe", "Zyra"
];

const campeones = campeoneslista.map(nombreId => ({
  nombre: idANombre[nombreId] || nombreId, // nombre amigable o el mismo ID si no está en el mapeo
  id: nombreId,
  img: `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${nombreId}_0.jpg`
}));



// Índice del campeón que está en el centro
let indiceCentral = 0;

// Función para obtener índice circular (para que no se salga del rango)
function indiceCircular(i) {
  const n = campeones.length;
  return ((i % n) + n) % n; // módulo que funciona con negativos
}


// Renderizar
function renderizar() {
  for (let i = 0; i < cuadros.length; i++) {
    const desplazamiento = i - 3; // posiciones -3 a +3
    const indiceCampeon = indiceCircular(indiceCentral + desplazamiento);
    const cuadro = cuadros[i];
    cuadro.className = 'cuadro';
    cuadro.classList.add(`pos${i}`);
    const campeon = campeones[indiceCampeon];
    cuadro.innerHTML = `
      <img src="${campeon.img}" alt="${campeon.nombre}" style="width:100%; height:auto; border-radius:12px;">
      <p style="position:absolute; bottom:10px; width:100%; text-align:center; font-weight:bold; margin:0;">${campeon.nombre}</p>
    `;
    // Añadir evento click para centrar el cuadro clickeado
    cuadro.onclick = () => {
  if (i === 3) {
    buscarCampeon(campeones[indiceCampeon].nombre); // nombre con mayúsculas internas
  } else {
    indiceCentral = indiceCircular(indiceCentral + desplazamiento);
    renderizar();
  }
};

  }
}




function mostrarBuildCompleta(campeonId) {
  if (!builds[campeonId]) {
    contenedorBuild.innerHTML = `<p>⚠️ No hay builds para ${campeonId}</p>`;
    return;
  }
  renderBotones(campeonId);
  // Mostrar build predeterminada (primer rol)
  const roles = Object.keys(builds[campeonId]);
  const rolPredeterminado = roles[0];
  mostrarBuild(campeonId, rolPredeterminado);
}





let timeoutReinicio;
let intervaloRotacion;
let tiempoEspera = 2000; // 2 segundos rotación automática normal
let tiempoEsperaDespuesInteraccion = 5000; // 5 segundos después de interacción
// Función para iniciar rotación automática
function iniciarRotacionAutomatica(tiempo) {
  if (intervaloRotacion) clearInterval(intervaloRotacion);
  intervaloRotacion = setInterval(() => {
    indiceCentral = indiceCircular(indiceCentral + 1);
    renderizar();
  }, tiempo);
}
// Inicia rotación automática normal
iniciarRotacionAutomatica(tiempoEspera);
// Función que llamas cuando el usuario interactúa (click o arrastre)
function usuarioInteraccion() {
  // Detén la rotación automática actual
  clearInterval(intervaloRotacion);
  // Cancela cualquier timeout pendiente para reiniciar la rotación
  if (timeoutReinicio) clearTimeout(timeoutReinicio);
  // Reinicia la rotación automática con mayor tiempo de espera
  timeoutReinicio = setTimeout(() => {
    iniciarRotacionAutomatica(tiempoEspera);
  }, tiempoEsperaDespuesInteraccion);
}











// Función para rotar carrusel a la derecha (rueda del mouse)
function rotarIzquierda() {
  indiceCentral = indiceCircular(indiceCentral +1);
  renderizar();
  usuarioInteraccion();
}

// Función para rotar carrusel a la derecha (rueda del mouse)
function rotarDerecha() {
  indiceCentral = indiceCircular(indiceCentral -1);
  renderizar();
  usuarioInteraccion();
}

// Función para rotar carrusel a la izquierda (click en cuadro izquierdo)
function rotarIzquierdaclick() {
  indiceCentral = indiceCircular(indiceCentral);
  renderizar();
  usuarioInteraccion();
}

// Función para rotar carrusel a la derecha (click en cuadro derecho)
function rotarDerechaclick() {
  indiceCentral = indiceCircular(indiceCentral );
  renderizar();
  usuarioInteraccion();
}

// Añadir eventos click a cuadros extremos
cuadros.forEach((cuadro, i) => {
  cuadro.style.cursor = 'pointer';
  if (i === 0|| i === 1 || i === 2) {
    cuadro.addEventListener('click', rotarDerechaclick);
  

  } else if (i === cuadros.length - 1 || i === cuadros.length - 2 || i === cuadros.length - 3) {
    cuadro.addEventListener('click', rotarIzquierdaclick);
  

  } else {
    // Opcional: deshabilitar click en cuadros centrales
    cuadro.style.cursor = 'pointer';
  }
});

// Render inicial
renderizar();


function capitalizarPrimeraLetra(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}



let isDragging = false;
let startX = 0;
let currentIndiceCentral = indiceCentral; // para guardar el índice al inicio del drag





document.addEventListener('DOMContentLoaded', () => {
  const carrusel = document.getElementById('carrusel');
  if (!carrusel) {
    console.error('No se encontró el elemento con id "carrusel"');
    return;
  }

  let isDragging = false;
  let startX = 0;
  let currentIndiceCentral = indiceCentral;

  carrusel.style.cursor = 'grab';

  carrusel.addEventListener('pointerdown', (e) => {
    isDragging = true;
    startX = e.clientX;
    currentIndiceCentral = indiceCentral;
    carrusel.style.cursor = 'grabbing';
    // Prevenir selección de texto mientras arrastras
    e.preventDefault();
  });

  window.addEventListener('pointerup', () => {
    isDragging = false;
    carrusel.style.cursor = 'grab';
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX;
    const threshold = 30;

    if (deltaX > threshold) {
      indiceCentral = indiceCircular(currentIndiceCentral - 1);
      renderizar();
      startX = e.clientX;
      currentIndiceCentral = indiceCentral;
      usuarioInteraccion();
    } else if (deltaX < -threshold) {
      indiceCentral = indiceCircular(currentIndiceCentral + 1);
      renderizar();
      startX = e.clientX;
      currentIndiceCentral = indiceCentral;
      usuarioInteraccion();
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const carrusel = document.getElementById('carrusel');
  if (!carrusel) {
    console.error('No se encontró el elemento con id "carrusel"');
    return;
  }
  // Aquí va tu código de arrastre, clicks, etc.
  // Agrega aquí el listener wheel:
  carrusel.addEventListener('wheel', (e) => {
    e.preventDefault();
    const umbral = 10; // para ignorar scrolls muy pequeños
    if (e.deltaY < -umbral) {
      rotarIzquierda();
      usuarioInteraccion();
    } else if (e.deltaY > umbral) {
      rotarDerecha();
      usuarioInteraccion();
    }
  }, { passive: false });
});