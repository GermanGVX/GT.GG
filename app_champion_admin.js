let builds = {};
let versionActual = '';
let isAdmin = false;

// Mapeo de nombres amigables (opcional, si lo usas)
const nombreAId = {
  Wukong: "MonkeyKing",
  Aurelionsol: "AurelionSol",
  Reksai: "RekSai",
  Maestroyi: "MasterYi",
  // Agrega otros aquí si es necesario
};

function obtenerIdOficial(nombreAmigable) {
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

// ✅ Cargar builds desde la API
async function loadBuilds(campeonId) {
  try {
    const response = await fetch(`https://gtgg-production.up.railway.app/api/builds/search?q=${campeonId}`);
    if (!response.ok) {
      throw new Error(`Error al cargar builds: ${response.status}`);
    }
    const buildsData = await response.json();
    builds = {};

    // Agrupar builds por rol
    buildsData.forEach(build => {
      const rol = build.nombre_rol;
      if (!builds[rol]) {
        builds[rol] = [];
      }
      builds[rol].push(build);
    });

    console.log("Builds cargadas:", builds);
  } catch (error) {
    console.error("No se pudo cargar el archivo JSON:", error);
  }
}

function renderBotones(campeonId) {
  const botonesDiv = document.getElementById("botones");
  botonesDiv.innerHTML = "";
  if (!builds || Object.keys(builds).length === 0) {
    botonesDiv.innerHTML = `
      <p>⚠️ No hay builds disponibles para este campeón.</p>
      ${isAdmin ? `<button class="btn-admin" onclick="crearBuild('${campeonId}', 'Nuevo Rol')">Crear Build</button>` : ''}
    `;
    return;
  }

  const roles = Object.keys(builds);
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

  // marcar como activo el primer botón automáticamente
  if (firstButton) {
    firstButton.classList.add("active");
    mostrarBuild(campeonId, roles[0]); // mostrar la build del primer rol
  }
}

// Función para mostrar una build específica
function mostrarBuild(campeonId, rol) {
  const buildData = builds[rol][0]; // Tomamos la primera build del rol
  if (!buildData) {
    console.error("No existe build con rol", rol, "para", campeonId);
    return;
  }

  const resultados = document.getElementById("resultado");
  const nombreAmigable = idANombre[campeonId] || campeonId;

  // Aquí necesitas hacer otra petición para obtener los detalles de la build
  fetch(`https://gtgg-production.up.railway.app/api/builds/${buildData.id}`)
    .then(response => response.json())
    .then(data => {
      resultados.innerHTML = `
      <div class="card">
        <div class="card-header">
          <img class="champion-icon" 
               src="https://ddragon.leagueoflegends.com/cdn/${versionActual}/img/champion/${campeonId}.png">
          <h2>${nombreAmigable}</h2>
        </div>

        <div class="section">
          <h3>Runas</h3>
          <div class="runes-primary">
            ${data.runas.primarias.map(runa => 
              `<img src="https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/${runa.id_api}.png" alt="${runa.nombre}">`
            ).join("")}
          </div>
          <div class="runes-secondary">
            ${data.runas.secundarias.map(runa => 
              `<img src="https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/${runa.id_api}.png" alt="${runa.nombre}">`
            ).join("")}
          </div>
          <div class="shards">
            ${data.runas.fragmentos.map(shard => 
              `<img src="https://ddragon.leagueoflegends.com/cdn/img/perk-images/Statmods/${shard.id_api}.png" alt="${shard.nombre}">`
            ).join("")}
          </div>
        </div>

        <div class="section">
          <h3>Spells</h3>
          <div class="spells">
            ${data.spells.map(spell => 
              `<img src="https://ddragon.leagueoflegends.com/cdn/${versionActual}/img/spell/${spell.nombre_spell}.png" alt="${spell.nombre_spell}">`
            ).join("")}
          </div>
        </div>

        <div class="section">
          <h3>Items</h3>
          <div class="items">
            ${data.items.core.map(item => 
              `<img src="https://ddragon.leagueoflegends.com/cdn/${versionActual}/img/item/${item.id_api}.png">`
            ).join("<span class='arrow'>→</span>")}
          </div>
          <h3>Items Situacionales</h3>
          <div class="Items_S">
            ${data.items.situacionales.map(item => 
              `<img src="https://ddragon.leagueoflegends.com/cdn/${versionActual}/img/item/${item.id_api}.png">`
            ).join("")}
          </div>
        </div>

        <div class="section1">
          <h3>Rol: ${buildData.nombre_rol}</h3>
          <p>${buildData.descripcion || "Sin información disponible para este rol."}</p>
        </div>
      </div>

      <div style="text-align: center; margin-top: 15px;">
        <button class="btn-stats" onclick="window.location.href='stats.html?champ=${campeonId}'">Stats</button>
      </div>
      `;

      // Si es admin, mostrar botones de administración
      if (isAdmin) {
        resultados.innerHTML += `
          <div style="text-align: center; margin-top: 15px;">
            <button class="btn-admin" onclick="crearBuild('${campeonId}', '${rol}')">Crear Build</button>
            <button class="btn-admin" onclick="modificarBuild('${buildData.id}')">Modificar Build</button>
            <button class="btn-admin" onclick="eliminarBuild('${buildData.id}')">Eliminar Build</button>
          </div>
        `;
      }
    })
    .catch(err => console.error("Error al cargar detalles de la build:", err));
}

// Función para obtener el campeón desde la URL
function obtenerCampeonDeURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('champ');
}

// Cargar builds y mostrar la build del campeón seleccionado
async function inicializarPagina() {
  await getVersion();

  // Verificar si es admin
  const response = await fetch('/api/check-session');
  const session = await response.json();
  isAdmin = session.loggedIn;

  const campeonId = obtenerCampeonDeURL();
  if (!campeonId) {
    document.getElementById("resultado").innerHTML = "<p>⚠️ No se especificó un campeón.</p>";
    return;
  }

  await loadBuilds(campeonId);

  // Verificar si hay builds para este campeón
  if (Object.keys(builds).length === 0) {
    document.getElementById("resultado").innerHTML = `<p>⚠️ No hay builds para ${campeonId}</p>`;
    return;
  }

  renderBotones(campeonId);
  const roles = Object.keys(builds);
  const rolPredeterminado = roles[0];
  mostrarBuild(campeonId, rolPredeterminado);
}

// Funciones de administración
function crearBuild(campeonId, rol) {
  window.location.href = `crear_build.html?campeon=${campeonId}&rol=${rol}`;
}

function modificarBuild(buildId) {
  window.location.href = `modificar_build.html?id=${buildId}`;
}

function eliminarBuild(buildId) {
  if (confirm("¿Estás seguro de que quieres eliminar esta build?")) {
    fetch(`/api/builds/${buildId}`, { method: 'DELETE' })
      .then(() => location.reload());
  }
}

// Inicializar al cargar la página
inicializarPagina();