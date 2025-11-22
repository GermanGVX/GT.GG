// Verificar si el usuario está logueado
fetch('/api/check-session')
  .then(response => response.json())
  .then(data => {
    if (!data.loggedIn) {
      window.location.href = 'login.html';
    }
  });

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
    const response = await fetch('/api/builds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      alert('Build guardada exitosamente');
      window.location.href = 'admin_index.html';
    } else {
      alert('Error al guardar la build');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión');
  }
});

cargarOpciones();