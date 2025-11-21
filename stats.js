const nombreAId = {
  Wukong: "MonkeyKing",
  RekSai: "RekSai",
  AurelionSol: "AurelionSol",
  // agrega otros si quieres
};
function obtenerIdOficial(nombreAmigable) {
  const nombreCapitalizado = nombreAmigable.charAt(0).toUpperCase() + nombreAmigable.slice(1);
  return nombreAId[nombreCapitalizado] || nombreCapitalizado;
}


// Obtener versión actual de Data Dragon
async function getLatestVersion() {
  const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
  const versions = await res.json();
  return versions[0];
}

// Obtener parámetro champ de URL
function getChampionFromURL() {
  const params = new URLSearchParams(window.location.search);
  const champParam = params.get('champ');
  if (!champParam) return null;
  return obtenerIdOficial(champParam);
}

// Capitalizar primera letra
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Obtener datos del campeón desde Data Dragon
async function getChampionData(championId, version) {
  const nombreCapitalizado = championId.charAt(0).toUpperCase() + championId.slice(1);
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/es_ES/champion/${nombreCapitalizado}.json`;
  const res = await fetch(url);
  const data = await res.json();
  return data.data[nombreCapitalizado];
}

// Obtener datos de items desde Data Dragon
async function getItemsData(version) {
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/es_ES/item.json`;
  const res = await fetch(url);
  const data = await res.json();
  return data.data;
}

// Cargar builds desde builds.json
async function getBuildsData() {
  const res = await fetch('builds.json');
  const data = await res.json();
  return data;
}
// Calcular stats base por nivel
function calcularStatsPorNivel(statsBase, level) {
  return {
    hp: Math.round(statsBase.hp + statsBase.hpperlevel * (level - 1)),
    ad: +(statsBase.attackdamage + statsBase.attackdamageperlevel * (level - 1)).toFixed(2),
    ap: 0,
    armor: +(statsBase.armor + statsBase.armorperlevel * (level - 1)).toFixed(2),
    spellblock: +(statsBase.spellblock + statsBase.spellblockperlevel * (level - 1)).toFixed(2),
    mana: Math.round(statsBase.mp + statsBase.mpperlevel * (level - 1)),
    manaRegen: +(statsBase.mpregen + statsBase.mpregenperlevel * (level - 1)).toFixed(2),
    hpRegen: +(statsBase.hpregen + statsBase.hpregenperlevel * (level - 1)).toFixed(2),
    ah: 0,
    moveSpeed: statsBase.movespeed,
    attackRange: statsBase.attackrange
  };
}

// --- helper conversions ---
function percentCooldownToAbilityHaste(percent) {
  // percent: ej -0.10 o 0.10 => 10% reducción
  const p = Math.abs(Number(percent)) || 0;
  if (p <= 0 || p >= 1) return 0;
  return Math.round((p / (1 - p)) * 100);
}
function abilityHasteToPercent(ah) {
  ah = Number(ah) || 0;
  if (ah <= 0) return 0;
  return +(ah / (ah + 100) * 100).toFixed(2);
}

// --- statMap (mapeo común) ---
const statMap = {
  FlatHPPoolMod: 'hp',
  PercentHPPoolMod: 'hpPercent',
  FlatPhysicalDamageMod: 'ad',
  FlatMagicDamageMod: 'ap',
  FlatArmorMod: 'armor',
  FlatSpellBlockMod: 'spellblock',
  FlatMPPoolMod: 'mana',
  FlatMPRegenMod: 'manaRegen',
  FlatHPRegenMod: 'hpRegen',
  FlatMovementSpeedMod: 'moveSpeed',
  PercentMovementSpeedMod: 'moveSpeedPercent',
  FlatAttackSpeedMod: 'attackSpeed',         // algunas versiones
  PercentAttackSpeedMod: 'attackSpeedPercent',
  FlatCritChanceMod: 'critChance',
  FlatCritDamageMod: 'critDamage',
  FlatMagicPenetrationMod: 'magicPen',
  FlatPhysicalPenetrationMod: 'armorPen',
  FlatSpellBlockModPerLevel: 'spellblockPerLevel',
  // cooldown/ability-haste handled separately (AbilityHaste, PercentCooldownMod, etc.)
};


// --- función principal para debugging y suma ---
function sumarStatsItems(itemsEquipados = [], itemsData = {}) {
  const totalStats = {};
  totalStats.abilityHaste = 0;  // raw AH
  totalStats.cdrPercent = 0;

  itemsEquipados.forEach(itemId => {
    const idStr = String(itemId);
    const item = itemsData[idStr];
    if (!item) return;

    // 1) Stats directas
    if (item.stats) {
      for (const statKey in item.stats) {
        const valueNum = Number(item.stats[statKey]) || 0;

        if (['AbilityHaste','FlatAbilityHasteMod','rFlatAbilityHasteMod'].includes(statKey) || statKey.toLowerCase().includes('abilityhaste')) {
          totalStats.abilityHaste += valueNum;
          continue;
        }

        if (statKey === 'PercentCooldownMod') {
          totalStats.abilityHaste += percentCooldownToAbilityHaste(valueNum);
          continue;
        }

        const mapped = statMap[statKey];
        if (mapped) totalStats[mapped] = (totalStats[mapped] || 0) + valueNum;
      }
    }

    // 2) Effect
    if (item.effect) {
      for (const effKey in item.effect) {
        const effVal = Number(item.effect[effKey]);
        if (isNaN(effVal)) continue;
        if (/ability|haste|cooldown/i.test(effKey)) totalStats.abilityHaste += effVal;
      }
    }

    // 3) Description (siempre, no depende de tags)
    if (item.description) {
      const descText = item.description.replace(/<[^>]+>/g, ' '); // limpiar HTML
      const re = /(\d+(?:\.\d+)?)\s*(?:de\s*)?(?:velocidad de habilidades|aceleraci[oó]n de habilidades|ability haste|abilityhaste)/i;
      const m = descText.match(re);
      if (m) totalStats.abilityHaste += Number(m[1]);
    }
  });

  // Derivar CDR % y sincronizar AH con ah para render
  totalStats.cdrPercent = abilityHasteToPercent(totalStats.abilityHaste);
  totalStats.ah = totalStats.abilityHaste || 0;

  return totalStats;
}

// Sumar base + items
function sumarStats(baseStats, itemsStats) {
  const total = { ...baseStats };
  for (const stat in itemsStats) {
    total[stat] = (total[stat] || 0) + itemsStats[stat];
  }
  return total;
}

// Render tabla con base, items y total
function renderStatsTable(baseStats, itemsStats, totalStats) {
  return `
    <table class="stats-table">
      <thead>
        <tr><th>Estadística</th><th>Base</th><th>Ítems</th><th>Total</th></tr>
      </thead>
      <tbody>
        <tr><td>Vida (HP)</td><td>${baseStats.hp}</td><td>${itemsStats.hp || 0}</td><td>${totalStats.hp}</td></tr>
        <tr><td>Daño de Ataque (AD)</td><td>${baseStats.ad}</td><td>${itemsStats.ad || 0}</td><td>${totalStats.ad}</td></tr>
        <tr><td>Daño Mágico (AP)</td><td>${baseStats.ap || 0}</td><td>${itemsStats.ap || 0}</td><td>${totalStats.ap || 0}</td></tr>
        <tr><td>Armadura</td><td>${baseStats.armor}</td><td>${itemsStats.armor || 0}</td><td>${totalStats.armor}</td></tr>
        <tr><td>Resistencia Mágica</td><td>${baseStats.spellblock}</td><td>${itemsStats.spellblock || 0}</td><td>${totalStats.spellblock}</td></tr>
        <tr><td>Maná</td><td>${baseStats.mana}</td><td>${itemsStats.mana || 0}</td><td>${totalStats.mana}</td></tr>
        <tr><td>Aceleración de Habilidades (CDR)</td><td>${baseStats.ah || 0}</td><td>${itemsStats.ah || 0}</td><td>${totalStats.ah || 0}</td></tr>
        <tr><td>Velocidad de Movimiento</td><td>${baseStats.moveSpeed}</td><td>${itemsStats.moveSpeed || 0}</td><td>${totalStats.moveSpeed}</td></tr>
        <tr><td>Rango de Ataque</td><td>${baseStats.attackRange}</td><td>0</td><td>${totalStats.attackRange}</td></tr>
      </tbody>
    </table>
  `;
}



// Render cooldowns de habilidades
function renderCooldowns(spells) {
  let html = `<h3 style="text-align:center;">Cooldowns</h3>
<table class="cooldown-table">
  <tbody>`;
  const keys = ['Q', 'W', 'E', 'R'];
  spells.forEach((spell, i) => {
    html += `<tr><td>${keys[i]} </td><td>${spell.cooldown.join(' / ')}</td></tr>`;
  });
  html += `</tbody></table>`;
  return html;
}

// Render botones de nivel
function renderLevelButtons(selectedLevel) {
  let html = '<div class="level-buttons">';
  for (let i = 1; i <= 18; i++) {
    html += `<button class="level-btn${i === selectedLevel ? ' active' : ''}" data-level="${i}">${i}</button>`;
  }
  html += '</div>';
  return html;
}

// Obtener la primera build disponible para el campeón
function getFirstBuildItems(buildsData, championId) {
  const champBuilds = buildsData[capitalize(championId)];
  if (!champBuilds) return [];
  const firstBuildKey = Object.keys(champBuilds)[0];
  if (!firstBuildKey) return [];
  return champBuilds[firstBuildKey].items || [];
}

// Render selector de builds
function renderBuildSelector(buildsData, championId) {
  const champBuilds = buildsData[capitalize(championId)];
  if (!champBuilds) return '';
  let html = '<label for="build-selector"></label><select id="build-selector">';
  Object.keys(champBuilds).forEach(buildName => {
    html += `<option value="${buildName}">${buildName}</option>`;
  });
  html += '</select><br><br>';
  return html;
}


// Función principal
async function main() {
  const champ = getChampionFromURL();
  if (!champ) {
    document.getElementById('stats-container').innerHTML = '<p>Campeón no especificado.</p>';
    return;
  }

  const version = await getLatestVersion();

  const [champData, itemsData, buildsData] = await Promise.all([
    getChampionData(champ, version),
    getItemsData(version),
    getBuildsData()
  ]);

  if (!champData) {
    document.getElementById('stats-container').innerHTML = '<p>Campeón no encontrado.</p>';
    return;
  }

  // Mostrar nombre amigable (si quieres)
  const nombreAmigable = Object.keys(nombreAId).find(key => nombreAId[key] === champ) || champ;
  document.getElementById('champion-name').textContent = nombreAmigable;
  
  let selectedLevel = 1;
  let selectedBuildItems = getFirstBuildItems(buildsData, champ);

  const container = document.getElementById('stats-container');

  // Renderizar selector de builds UNA vez
  container.innerHTML = renderBuildSelector(buildsData, champ);

  const buildSelector = document.getElementById('build-selector');
  buildSelector.value = Object.keys(buildsData[capitalize(champ)])[0]; // seleccionar primera build

  buildSelector.addEventListener('change', () => {
    const selectedBuildName = buildSelector.value;
    selectedBuildItems = buildsData[capitalize(champ)][selectedBuildName].items || [];
    updateStats(selectedLevel, selectedBuildItems);
  });

  // Función para actualizar solo la parte de stats, botones y cooldowns
  function updateStats(level, buildItems) {
    selectedLevel = level;
    const baseStats = calcularStatsPorNivel(champData.stats, level);
    const itemsStats = sumarStatsItems(buildItems, itemsData);
    const totalStats = sumarStats(baseStats, itemsStats);

    // Solo actualizar esta parte, sin tocar el selector
    const statsHtml = `
      ${renderLevelButtons(selectedLevel)}
      ${renderStatsTable(baseStats, itemsStats, totalStats)}
      ${renderCooldowns(champData.spells)}
    `;

    // Puedes tener un div interno para stats, por ejemplo con id="stats-content"
    // Si no, creamos uno ahora:
    let statsContent = document.getElementById('stats-content');
    if (!statsContent) {
      statsContent = document.createElement('div');
      statsContent.id = 'stats-content';
      container.appendChild(statsContent);
    }
    statsContent.innerHTML = statsHtml;

    // Agregar eventos a botones de nivel
    statsContent.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        updateStats(parseInt(btn.getAttribute('data-level')), selectedBuildItems);
      });
    });
  }

  // Inicializar con la primera build y nivel 1
  updateStats(selectedLevel, selectedBuildItems);
}

window.onload = main;
