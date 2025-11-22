// Verificar si el usuario está logueado
fetch('/api/check-session')
  .then(response => response.json())
  .then(data => {
    if (!data.loggedIn) {
      window.location.href = 'login.html';
    }
  });

// Obtener el ID de la build desde la URL
function obtenerBuildId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('id');
}

// Cargar datos de la build
async function cargarBuild() {
  const buildId = obtenerBuildId();
  if (!buildId) {
    alert('No se especificó una build para modificar');
    return;
  }

  const response = await fetch(`/api/builds/${buildId}`);
  const build = await response.json();

  document.getElementById('nombre_build').value = build.nombre_build;
  document.getElementById('campeon').value = build.campeon_id;
  document.getElementById('rol').value = build.rol_id;

  // Seleccionar runas, spells e items
  build.runas.primarias.forEach(r => {
    document.querySelector(`#runas_primarias option[value="${r.id}"]`).selected = true;
  });
  build.runas.secundarias.forEach(r => {
    document.querySelector(`#runas_secundarias option[value="${r.id}"]`).selected = true;
  });
  build.spells.forEach(s => {
    document.querySelector(`#spells option[value="${s.id}"]`).selected = true;
  });
  build.items.core.forEach(i => {
    document.querySelector(`#items_core option[value="${i.id}"]`).selected = true;
  });
  build.items.situacionales.forEach(i => {
    document.querySelector(`#items_situacionales option[value="${i.id}"]`).selected = true;
  });
}

// Cargar campeones, roles, runas, spells e items desde la API
async function cargarOpciones() {
  const [campeones, roles, runas, spells, items] = await Promise.all([
    fetch('/api/campeones').then(r => r.json()),
    fetch('/api/roles').then(r => r.json()),
    fetch('/api/runas').then(r => r.json()),
    fetch('/api/spells').then(r => r.json()),
    fetch('/api/items').then(r => r.json())
  ]);

  const campeonSelect = document.getElementById('campeon');
  const rolSelect = document.getElementById('rol');
  const runasPrimariasSelect = document.getElementById('runas_primarias');
  const runasSecundariasSelect = document.getElementById('runas_secundarias');
  const spellsSelect = document.getElementById('spells');
  const itemsCoreSelect = document.getElementById('items_core');
  const itemsSituacionalesSelect = document.getElementById('items_situacionales');

  campeones.forEach(c => {
    const option = document.createElement('option');
    option.value = c.id;
    option.textContent = c.nombre_campeon;
    campeonSelect.appendChild(option);
  });

  roles.forEach(r => {
    const option = document.createElement('option');
    option.value = r.id;
    option.textContent = r.nombre_rol;
    rolSelect.appendChild(option);
  });

  runas.forEach(r => {
    const option = document.createElement('option');
    option.value = r.id;
    option.textContent = r.nombre_runa;
    runasPrimariasSelect.appendChild(option.cloneNode(true));
    runasSecundariasSelect.appendChild(option.cloneNode(true));
  });

  spells.forEach(s => {
    const option = document.createElement('option');
    option.value = s.id;
    option.textContent = s.nombre_spell;
    spellsSelect.appendChild(option);
  });

  items.forEach(i => {
    const option = document.createElement('option');
    option.value = i.id;
    option.textContent = i.nombre_item;
    itemsCoreSelect.appendChild(option.cloneNode(true));
    itemsSituacionalesSelect.appendChild(option.cloneNode(true));
  });
}

document.getElementById('buildForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const buildId = obtenerBuildId();
  const formData = {
    nombre_build: document.getElementById('nombre_build').value,
    campeon_id: document.getElementById('campeon').value,
    rol_id: document.getElementById('rol').value,
    runas: {
      primarias: Array.from(document.getElementById('runas_primarias').selectedOptions).map(o => o.value),
      secundarias: Array.from(document.getElementById('runas_secundarias').selectedOptions).map(o => o.value)
    },
    spells: Array.from(document.getElementById('spells').selectedOptions).map(o => o.value),
    items: {
      core: Array.from(document.getElementById('items_core').selectedOptions).map(o => o.value),
      situacionales: Array.from(document.getElementById('items_situacionales').selectedOptions).map(o => o.value)
    }
  };

  try {
    const response = await fetch(`/api/builds/${buildId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      alert('Build actualizada exitosamente');
      window.location.href = 'admin_index.html';
    } else {
      alert('Error al actualizar la build');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
});

cargarOpciones();
cargarBuild();