let versionActual = '';

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

async function getVersion() {
  const response = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
  const versiones = await response.json();
  versionActual = versiones[0];
}

// ✅ Nueva función: redirigir a admin_champion.html
function buscarCampeon(nombreParam) {
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

  // Redirigir a admin_champion.html con el campeón como parámetro
  window.location.href = `admin_champion.html?champ=${idOficial}`;
}

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
  const resultados = campeonesNombres
  .map(id => idANombre[id] || id)
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

// Código del carrusel (sin mostrar builds)
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
    // Añadir evento click para redirigir a admin_champion.html
    cuadro.onclick = () => {
      window.location.href = `admin_champion.html?champ=${campeon.id}`;
    };
  }
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

let isDragging = false;
let startX = 0;
let currentIndiceCentral = indiceCentral; // para guardar el índice al inicio del drag

document.addEventListener('DOMContentLoaded', () => {
  const carrusel = document.getElementById('carrusel');
  if (!carrusel) {
    console.error('No se encontró el elemento con id "carrusel"');
    return;
  }

  carrusel.style.cursor = 'grab';

  carrusel.addEventListener('pointerdown', (e) => {
    isDragging = true;
    startX = e.clientX;
    currentIndiceCentral = indiceCentral;
    carrusel.style.cursor = 'grabbing';
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