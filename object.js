// Obtener versión actual de Data Dragon
async function getLatestVersion() {
  const res = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
  const versions = await res.json();
  return versions[0]; // la más reciente
}

// Obtener datos de todos los ítems en español
async function getItemsData(version) {
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/es_ES/item.json`;
  const res = await fetch(url);
  const data = await res.json();
  return data.data;
}

const statMap = {
  FlatPhysicalDamageMod: "ad",
  FlatMagicDamageMod: "ap",
  FlatArmorMod: "armadura",
  FlatSpellBlockMod: "mr",
  FlatHPPoolMod: "hp",
  FlatMPPoolMod: "mana",
  FlatHPRegenMod: "hpRegen",
  FlatMPRegenMod: "manaRegen",
  PercentCritChanceMod: "crit",
  PercentAttackSpeedMod: "as",
  FlatMovementSpeedMod: "moveSpeed",
  PercentLifeStealMod: "lifesteal",
  FlatLethality: "lethality",
  FlatArmorPenetrationMod: "armorPen",
  FlatMagicPenetrationMod: "magicPenFlat",
  PercentMagicPenetrationMod: "magicPenPercent",
  FlatOnHitMod: "onHit",
  FlatAbilityHasteMod: "abilityHaste",
  PercentMovementSpeedMod: "moveSpeedPercent",
  PercentHealAndShieldPowerMod: "shieldPower",
  Omnivamp: "omnivamp"
};

const goldValues = {
  ad: 35,              // Daño Físico
  ap: 21.75,           // Poder de Habilidad
  armadura: 20,           // Armadura
  mr: 18,              // Resistencia Mágica
  hp: 2.67,            // Vida
  mana: 1.4,           // Maná
  hpRegen: 3,          // Regeneración de Vida
  manaRegen: 5,        // Regeneración de Maná
  crit: 40,            // Probabilidad de Crítico
  as: 2500,              // Velocidad de Ataque
  moveSpeed: 12,       // Velocidad de Movimiento plana
  lifesteal: 5357.00,    // Robo de Vida
  lethality: 56.6,     // Letalidad
  armorPen: 41.67,     // Pen. Armadura
  magicPenFlat: 31.11, // Pen. Mágica plana
  magicPenPercent: 54.33,     // Pen. Mágica %
  onHit: 25,           // Daño de efecto de impacto
  abilityHaste: 26,    // Velocidad de habilidades
  moveSpeedPercent: 8000,// Vel. Movimiento %
  shieldPower: 68,     // Poder de escudo/curación
  omnivamp: 39.67      // Omnivampirismo
};
// Traducción de stats a nombres "bonitos"
const statNames = {
  hp: "Vida",
  mana: "Maná",
  ad: "Daño de ataque",
  ap: "Poder de habilidad",
  armor: "Armadura",
  mr: "Resistencia mágica",
  hpRegen: "Reg. Vida",
  manaRegen: "Reg. Maná",
  crit: "Prob. crítico",
  as: "Velocidad de ataque",
  moveSpeed: "Vel. movimiento",
  lifesteal: "Robo de vida",
  lethality: "Letalidad",
  armorPen: "Pen. armadura %",
  magicPenFlat: "Pen. mágica plana",
  magicPenPercent: "Pen. mágica %",
  onHit: "Daño de impacto",
  abilityHaste: "Vel. de habilidades",
  moveSpeedPercent: "Vel. mov. %",
  shieldPower: "Poder de escudo/curación",
  omnivamp: "Omnivampirismo"
};

function getItemStats(item) {
  const stats = {};

  // 1) Primero limpiar HTML de la descripción
  if (item.description) {
    const descText = item.description.replace(/<[^>]+>/g, ' ');

    // ✅ Usamos parsePenetraciones (ya separa plano y % sin pisarse)
    const { flat, percent } = parsePenetraciones(descText);
    if (flat) stats.magicPenFlat = (stats.magicPenFlat || 0) + flat;
    if (percent) stats.magicPenPercent = (stats.magicPenPercent || 0) + percent;
  }

  // 1) Stats directas
  for (const key in item.stats) {
    const valueNum = Number(item.stats[key]) || 0;

    // Ability haste (múltiples variantes posibles)
    if (['AbilityHaste','FlatAbilityHasteMod','rFlatAbilityHasteMod'].includes(key) || key.toLowerCase().includes('abilityhaste')) {
      stats.abilityHaste = (stats.abilityHaste || 0) + valueNum;
      continue;
    }

    if (key === 'PercentCooldownMod') {
      stats.abilityHaste = (stats.abilityHaste || 0) + percentCooldownToAbilityHaste(valueNum);
      continue;
    }
    


    

    const mapped = statMap[key];
    if (mapped) {
      stats[mapped] = (stats[mapped] || 0) + valueNum;
    }
  }

  // 2) Efectos ocultos (item.effect)
  if (item.effect) {
    for (const effKey in item.effect) {
      const effVal = Number(item.effect[effKey]);
      if (isNaN(effVal)) continue;

      if (/lethality/i.test(effKey)) {
        stats.lethality = (stats.lethality || 0) + effVal;
      }
      if (/ability|haste|cooldown/i.test(effKey)) {
        stats.abilityHaste = (stats.abilityHaste || 0) + effVal;
      }
      if (/magicpen|magicpenetration/i.test(effKey)) {
        stats.magicPenPercent = (stats.magicPenPercent || 0) + effVal;
      }
      if (/armorPen/i.test(effKey)) {
        stats.armorPen = (stats.armorPen || 0) + effVal;
      }
      if (/crit/i.test(effKey)) {
        stats.crit = (stats.crit || 0) + effVal;
      }
      if (/magicpenetrationflat|flatmagicpen/i.test(effKey)) {
      stats.magicPenFlat = (stats.magicPenFlat || 0) + effVal;
     }
      if (/magicpenetrationpercent|magicpenpercent/i.test(effKey)) {
      stats.magicPenPercent = (stats.magicPenPercent || 0) + effVal;
      }
      if (/PercentHealAndShieldPowerMod|shieldPower/i.test(effKey)) {
      stats.shieldPower = (stats.shieldPower || 0) + effVal;
      }
    }
  }

  // 3) Regex sobre la descripción (último recurso)
  if (item.description) {
    const descText = item.description.replace(/<[^>]+>/g, ' ');

    // Letalidad
    const lethalityMatch = descText.match(/(\d+(?:\.\d+)?)\s*(?:de\s*)?letalidad/i);
    if (lethalityMatch) {
      stats.lethality = (stats.lethality || 0) + Number(lethalityMatch[1]);
    }

    // Velocidad de habilidades
    const ahMatch = descText.match(/(\d+(?:\.\d+)?)\s*(?:de\s*)?(?:velocidad de habilidades|aceleraci[oó]n de habilidades|ability haste)/i);
    if (ahMatch) {
      stats.abilityHaste = (stats.abilityHaste || 0) + Number(ahMatch[1]);
    }

  const apMatch  = descText.match(/(\d+(?:\.\d+)?)\s*%?\s*(?:de\s*)?penetraci[oó]n de armadura/i);
  if (apMatch) {
    stats.armorPen = (stats.armorPen || 0) + Number(apMatch[1]); // Guardar como fracción
  }


  const hpRegenMatch  = descText.match(/(\d+(?:\.\d+)?)\s*%?\s*(?:de\s*)?(?:regeneración de vida|vida por segundo|hp regen)/i);
  if (hpRegenMatch) {
    stats.hpRegen   = (stats.hpRegen   || 0) + Number(hpRegenMatch[1]); // Guardar como fracción
  }

  const manaRegenMatch  = descText.match(/(\d+(?:\.\d+)?)\s*%?\s*(?:de\s*)?(?:regeneración de maná|mana por segundo|mana regen)/i);
  if (manaRegenMatch) {
    stats.manaRegen  = (stats.manaRegen  || 0) + Number(manaRegenMatch[1]); // Guardar como fracción
  }






const critMatch = descText.match(/(\d+(?:\.\d+)?)\s*%?\s*(?:de\s*)?(?:probabilidad\s+de\s+)/i);
if (critMatch) {
  stats.crit = (stats.crit || 0) + Number(critMatch[1]); 
}

const shieldPowerMatches = descText.matchAll(/(\d+(?:\.\d+)?)\s*%?\s*(?:de\s*)?(?:escudo|escudos|curación|curaciones|curaciones y escudos|poder de curaciones y escudos)/gi);

for (const match of shieldPowerMatches) {
  stats.shieldPower = (stats.shieldPower || 0) + Number(match[1]);
}


}
  return stats;
}

function parsePenetraciones(descText) {
  const result = { flat: 0, percent: 0 };

  // 1) Penetración mágica porcentual: número seguido de %
  const percentMatches = [...descText.matchAll(/(\d+(?:\.\d+)?)\s*%\s*(?:de\s*)?penetraci[oó]n m[aá]gica/gi)];
  percentMatches.forEach(m => {
    result.percent += Number(m[1]);
  });

  // 2) Penetración mágica plana: número sin % delante de "penetración mágica"
  const flatMatches = [...descText.matchAll(/(\d+(?:\.\d+)?)\s*(?:de\s*)?penetraci[oó]n m[aá]gica(?!\s*%)/gi)];
  flatMatches.forEach(m => {
    result.flat += Number(m[1]);
  });

  return result;
}

function calcularValorOro(itemStats) {
  let totalGold = 0;
  const desglose = {};

  for (const stat in itemStats) {
    if (goldValues[stat] && typeof itemStats[stat] === "number") {
      const valor = itemStats[stat] * goldValues[stat];
      desglose[stat] = valor;
      totalGold += valor;
    }
  }

  return { totalGold, desglose };
}




// Función para detectar legendarios (SoloQ, no míticos, no ARAM)
function isLegendary(item, id) {
  if (!item.gold || !item.gold.total) return false;

  // forzamos el id a número
  const idNum = Number(id);

  // lista de ids baneados (NUMÉRICOS)
  const bannedIds = [323107,667666]; 
  if (bannedIds.includes(idNum)) {
    // console.log("Excluido por bannedIds:", idNum, item.name);
    return false;
  }
  

  // rango de Arena
  if (idNum >= 320000 && idNum < 330000) {
    // console.log("Excluido por rango Arena:", idNum, item.name);
    return false;
  }

  const isRift = item.maps && item.maps["11"];
  const isFinal = !item.into;
  const hasCost = item.gold.total >= 1000;
  const notMythic = !(item.description && 
                     (item.description.includes("Mítico") || 
                      item.description.includes("Pasiva mítica")));
  const inStore = item.inStore !== false;
  const notEvent = !item.requiredChampion && !item.requiredAlly;
  const notSpecialMode = !(item.description && (
    item.description.includes("Supremacía") || 
    item.name.includes("Crueldad") ||
    item.name.includes("Espada de los dioses") ||
    item.name.includes("Juicio de Atma") ||  
    item.name.includes("Escudo de roca fundida") ||  
    item.name.includes("Capa de la noche estrellada") ||  
    item.name.includes("Sable-pistola hextech") ||  
    item.name.includes("Protector pétreo de gárgola") ||  
    item.name.includes("Espada del amanecer floreciente") || 
    item.name.includes("Corona de la reina quebrada") || 
    item.name.includes("Espada del apostador") || 
    item.name.includes("Comecarne") || 
    item.name.includes("Céfiro") ||
    item.description.includes("Doom") ||      
    item.description.includes("Modo") ||
    item.description.includes("Bots")
  ));

  return isRift && isFinal && hasCost && notMythic && inStore && notEvent && notSpecialMode;
}

(async () => {
  const version = await getLatestVersion();
  const items = await getItemsData(version);

  for (const [id, item] of Object.entries(items)) {
    if (isLegendary(item, id)) {
      console.log("Incluido:", id, item.name);
    } else if (id === "323107") {
      console.log("Excluido:", id, item.name);
    }
  }
})();


// Renderizar ítems en la grilla
async function renderItems(version) {
  const itemsGrid = document.getElementById("itemsGrid");
  const modal = document.getElementById("itemModal");
  const closeModal = document.getElementById("closeModal");

  const itemName = document.getElementById("itemName");
  const itemImage = document.getElementById("itemImage");
  const itemDescription = document.getElementById("itemDescription");
  const itemGold = document.getElementById("itemGold");

  const items = await getItemsData(version);

for (const [id, item] of Object.entries(items)) {
  if (!isLegendary(item, id)) continue;  // Filtrar solo legendarios

    const div = document.createElement("div");
    div.classList.add("item");

    const img = document.createElement("img");
    img.src = `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image.full}`;
    img.alt = item.name;

    div.appendChild(img);
    itemsGrid.appendChild(div);

    div.addEventListener("click", () => {
  itemName.textContent = item.name;
  itemImage.src = img.src;
  itemDescription.innerHTML = item.description;
  itemGold.textContent = `${item.gold.total} de oro`;

  // 🟢 Calcular valor en oro de stats
  const itemStats = getItemStats(item);
  const { totalGold, desglose } = calcularValorOro(itemStats);

  let statsHTML = `
    <h4>Eficiencia en oro</h4>
    <table>
      <tr><th>Estadística</th><th>Valor</th><th>Oro</th></tr>
  `;

  for (const stat in desglose) {
  const nombre = statNames[stat] || stat;
  let valor = itemStats[stat];

  // Si es velocidad de ataque o movimiento %, mostrar en %
  if (stat === "as" || stat === "moveSpeedPercent"|| stat === "lifesteal"|| stat === "magicPen") {
    valor = (valor * 100).toFixed(0) + "%";
  }

  statsHTML += `<tr>
    <td>${nombre}</td>
    <td>${valor}</td>
    <td>${desglose[stat].toFixed(2)} oro</td>
  </tr>`;
}

  statsHTML += `
      <tr class="total"><td colspan="2"><b>Total</b></td>
      <td><b>${totalGold.toFixed(2)} oro</b></td></tr>
    </table>
  `;

  document.getElementById("item-stats").innerHTML = statsHTML;

  modal.style.display = "block";
});
  }

  // Cerrar modal
  
  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
}
function renderItemValor(itemName, itemStats) {
  const { totalGold, desglose } = calcularValorOro(itemStats);

  let html = `
    <div class="item-box">
      <h3>${itemName}</h3>
      <table>
        <tr><th>Estadística</th><th>Valor en oro</th></tr>
  `;

  for (const stat in desglose) {
    html += `<tr>
      <td>${stat}</td>
      <td>${desglose[stat].toFixed(2)} oro</td>
    </tr>`;
  }

  html += `
      <tr class="total"><td><b>Total</b></td><td><b>${totalGold.toFixed(2)} oro</b></td></tr>
      </table>
    </div>
  `;

  document.getElementById("item-stats").innerHTML += html;
}


// Inicializar
(async () => {
  const version = await getLatestVersion();
  renderItems(version);
})();

