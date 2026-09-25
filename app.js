// === KONFIGURACJA LINKÓW Z ARKUSZA GOOGLE ============================
const LINKS = {
  "Podsumowanie": "https://docs.google.com/spreadsheets/d/e/2PACX-1vT04qgjfew9Fu4mR3zTP2TIbYaYMmhMQUfUhsHDPsxb2X0Ra4CjcZo6yqpD-fN3V16dG5zsFMexZKvO/pub?gid=0&single=true&output=csv",
  "Ranking": "https://docs.google.com/spreadsheets/d/e/2PACX-1vT04qgjfew9Fu4mR3zTP2TIbYaYMmhMQUfUhsHDPsxb2X0Ra4CjcZo6yqpD-fN3V16dG5zsFMexZKvO/pub?gid=1621614425&single=true&output=csv",
  "Punktacja": "https://docs.google.com/spreadsheets/d/e/2PACX-1vT04qgjfew9Fu4mR3zTP2TIbYaYMmhMQUfUhsHDPsxb2X0Ra4CjcZo6yqpD-fN3V16dG5zsFMexZKvO/pub?gid=2121037205&single=true&output=csv" // Wklej link lub zostaw puste, jeśli nie działa
};
// =====================================================================

let refreshInterval = null;
let currentTab = "Podsumowanie";

function updateTimestamp() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const el = document.getElementById("lastUpdate");
  if (el) el.textContent = "Ostatnia aktualizacja: " + hh + ":" + mm + ":" + ss;
}

function parseCSV(text) {
  if (!text) return [];
  return text.split(/\r?\n/)
    .map(line => {
      if (!line.trim()) return null;
      const delimiter = line.includes(";") ? ";" : ",";
      return line.split(delimiter).map(cell => cell ? cell.replace(/^"|"\$/g, '').trim() : "");
    })
    .filter(row => row !== null);
}

// Główna funkcja ładująca wybraną kartę niezależnie od innych
function loadTabContent(tabName) {
  const content = document.getElementById("content");
  if (!content) return;

  // Obsługa samej Legendy (nie potrzebuje sieci)
  if (tabName === "Legenda") {
    renderLegenda();
    updateTimestamp();
    return;
  }

  const url = LINKS[tabName];
  if (!url || url.includes("TUTAJ_WKLEJ")) {
    content.innerHTML = `<div style="color: #ff8c00; padding: 20px; background: #1c1c1c; border-radius: 8px;">
      Zakładka "${tabName}" nie została jeszcze skonfigurowana w pliku app.js.
    </div>`;
    return;
  }

  content.innerHTML = `<div style="color: #aaa; padding: 20px;">Ładowanie danych z Arkusza Google...</div>`;

  fetch(url)
    .then(r => {
      if (!r.ok) throw new Error("Status: " + r.status);
      return r.text();
    })
    .then(csvText => {
      const rows = parseCSV(csvText);
      if (tabName === "Podsumowanie") renderPodsumowanie(rows);
      else if (tabName === "Ranking") renderRanking(rows);
      else if (tabName === "Punktacja") renderPunktacja(rows);
      updateTimestamp();
    })
    .catch(error => {
      console.error(error);
      content.innerHTML = `<div style="color: #ff3333; padding: 20px; background: #1c1c1c; border-radius: 8px;">
        Błąd pobierania zakładki "${tabName}". Sprawdź czy opublikowano ją jako CSV.<br>
        <small style="color: #aaa;">Szczegóły: ${error.message}</small>
      </div>`;
    });
}

function renderTabs() {
  const tabs = document.getElementById("tabs");
  if (!tabs) return;
  tabs.innerHTML = "";

  const tabsList = ["Podsumowanie", "Ranking", "Punktacja", "Legenda"];

  tabsList.forEach(name => {
    const btn = document.createElement("button");
    btn.className = "tab-btn" + (name === currentTab ? " active" : "");
    btn.textContent = name;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTab = name;
      loadTabContent(name);
    });
    tabs.appendChild(btn);
  });
}

// --- WIDOK: LEGENDA ---
function renderLegenda() {
  const content = document.getElementById("content");
  const legend = document.createElement("div");
  legend.className = "legend";
  const items = [
    ["C5", "Crypt__5"], ["C10", "Crypt__10"], ["C15", "Crypt__15"],
    ["C20", "Crypt__20"], ["C25", "Crypt__25"], ["RC10", "rare Crypt__10"],
    ["RC15", "rare Crypt__15"], ["RC20", "rare Crypt__20"], ["RC25", "rare Crypt__25"],
    ["V", "Vault"], ["H", "Hermes"], ["A", "Ancients"]
  ];
  items.forEach(([short, full]) => {
    const div = document.createElement("div");
    div.className = "legend-item";
    div.textContent = `${short} — ${full}`;
    legend.appendChild(div);
  });
  content.appendChild(legend);
}

// --- WIDOK: RANKING ---
function renderRanking(rows) {
  const content = document.getElementById("content");
  let headerIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i] && rows[i].includes("Gracz")) { headerIndex = i; break; }
  }
  if (headerIndex === -1) headerIndex = 0;
  const dataRows = rows.slice(headerIndex + 1).filter(r => r && r[2]); 

  const listDiv = document.createElement("div");
  listDiv.className = "player-list";

  dataRows.forEach((row) => {
    const item = document.createElement("div");
    item.className = "player-list-item";
    const miejsce = row[0] || "";
    const medal = row[1] || "";
    const gracz = row[2] || "";
    const poziom = row[3] || "";
    const punkty = row[4] || "0";
    const norma = row[5] || "0";
    const razem = row[6] || "0";

    if (miejsce == "1") item.classList.add("top1");
    if (miejsce == "2") item.classList.add("top2");
    if (miejsce == "3") item.classList.add("top3");

    item.textContent = `${miejsce}. ${medal} ${gracz} (${poziom}) — Punkty: ${punkty} — Norma: ${norma}% — Skrzynie: ${razem}`;
    listDiv.appendChild(item);
  });
  content.appendChild(listDiv);
}

// --- WIDOK: PUNKTACJA ---
function renderPunktacja(rows) {
  const content = document.getElementById("content");
  const mainContainer = document.createElement("div");
  mainContainer.style.display = "flex";
  mainContainer.style.flexWrap = "wrap";
  mainContainer.style.gap = "20px";

  const normDiv = document.createElement("div");
  normDiv.className = "player-list";
  normDiv.style.flex = "1 1 300px";
  normDiv.innerHTML = `<div style="font-weight:bold; font-size:18px; margin-bottom:10px; color:#ffd700; border-bottom:1px solid #444; padding-bottom:5px;">Normy Punktów</div>`;

  const chestDiv = document.createElement("div");
  chestDiv.className = "player-list";
  chestDiv.style.flex = "1 1 350px";
  chestDiv.innerHTML = `<div style="font-weight:bold; font-size:18px; margin-bottom:10px; color:#8e2de2; border-bottom:1px solid #444; padding-bottom:5px;">Punkty za skrzynie</div>`;

  let sekcjaSkrzyn = false;

  rows.forEach(row => {
    if (!row || row.length === 0 || !row[0]) return;
    const col1 = row[0].trim();
    const col2 = row[1] ? row[1].trim() : "";

    if (col1.toLowerCase().includes("chest type")) { sekcjaSkrzyn = true; return; }
    if (col1.toLowerCase().includes("normy punktów")) { sekcjaSkrzyn = false; return; }
    if (col1.toLowerCase() === "points" || col1.toLowerCase().includes("normy")) return;

    const item = document.createElement("div");
    item.className = "player-list-item";
    item.style.display = "flex";
    item.style.justifyContent = "space-between";
    item.innerHTML = `<span>${col1}</span><span style="font-weight:bold; color:#fff;">${col2}</span>`;

    if (sekcjaSkrzyn) chestDiv.appendChild(item);
    else normDiv.appendChild(item);
  });

  mainContainer.appendChild(normDiv);
  mainContainer.appendChild(chestDiv);
  content.appendChild(mainContainer);
}

// --- WIDOK: PODSUMOWANIE ---
function renderPodsumowanie(rows) {
  const content = document.getElementById("content");
  const headers = rows[0];
  if (!headers) return;

  const sortedRows = rows.slice(1).filter(r => r && r[2]).sort((a, b) => Number(b[2] || 0) - Number(a[2] || 0));

  const listDiv = document.createElement("div");
  listDiv.className = "player-list";

  sortedRows.forEach((row, index) => {
    const item = document.createElement("div");
    item.className = "player-list-item";
    if (index === 0) item.classList.add("top1");
    if (index === 1) item.classList.add("top2");
    if (index === 2) item.classList.add("top3");
    item.textContent = `${row[0]} — ${row[1]} — ${row[2]}`;
    listDiv.appendChild(item);
  });
  content.appendChild(listDiv);

  rows.slice(1).forEach(row => {
    if (!row || row.length < 3 || !row[0]) return;
    const card = document.createElement("div");
    card.className = "player-card";

    const headerDiv = document.createElement("div");
    headerDiv.className = "player-name";
    headerDiv.textContent = row[0];

    const statsDiv = document.createElement("div");
    statsDiv.className = "player-stats";
    statsDiv.innerHTML = `Razem: ${row[1]}<br>Punkty: ${row[2]}`;

    const grid = document.createElement("div");
    grid.className = "icon-grid";

    headers.forEach((header, i) => {
      if (i < 3 || !header) return;
      const value = row[i];
      if (!value || Number(value) === 0 || isNaN(Number(value))) return;

      let type = "";
      if (header.includes("rare")) type = "rare";
      else if (header.includes("Crypt")) type = "crypt";
      else if (header.includes("Vault")) type = "vault";
      else if (header.includes("Hermes")) type = "hermes";
      else if (header.includes("Ancients")) type = "ancients";

      const short = header.replace("Crypt__", "C").replace("rare Crypt__", "RC").replace("Vault", "V").replace("Hermes", "H").replace("Ancients", "A");

      const box = document.createElement("div");
      box.className = "box " + type;
      box.innerHTML = `<span class="box-label">${short}</span><span class="box-value">${value}</span>`;
      grid.appendChild(box);
    });

    card.appendChild(headerDiv);
    card.appendChild(statsDiv);
    card.appendChild(grid);
    content.appendChild(card);
  });
}

function startAutoRefresh() {
  if (refreshInterval) return;
  refreshInterval = setInterval(() => {
    if (document.visibilityState === "visible") loadTabContent(currentTab);
  }, 120000);
}

renderTabs();
loadTabContent(currentTab);
startAutoRefresh();
