// === KONFIGURACJA LINKÓW Z ARKUSZA GOOGLE ============================
const URL_PODSUMOWANIE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT04qgjfew9Fu4mR3zTP2TIbYaYMmhMQUfUhsHDPsxb2X0Ra4CjcZo6yqpD-fN3V16dG5zsFMexZKvO/pub?gid=0&single=true&output=csv";
const URL_RANKING = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT04qgjfew9Fu4mR3zTP2TIbYaYMmhMQUfUhsHDPsxb2X0Ra4CjcZo6yqpD-fN3V16dG5zsFMexZKvO/pub?gid=1621614425&single=true&output=csv";
// TUTAJ WKLEJ NOWY LINK DLA PUNKTACJI:
const URL_PUNKTACJA = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT04qgjfew9Fu4mR3zTP2TIbYaYMmhMQUfUhsHDPsxb2X0Ra4CjcZo6yqpD-fN3V16dG5zsFMexZKvO/pub?gid=2121037205&single=true&output=csv";
// =====================================================================

let refreshInterval = null;
let globalData = {
  "Podsumowanie": [],
  "Ranking": [],
  "Punktacja": [],
  "Legenda": []
};

function updateTimestamp() {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  const el = document.getElementById("lastUpdate");
  if (el) {
    el.textContent = "Ostatnia aktualizacja: " + hh + ":" + mm + ":" + ss;
  }
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  return lines
    .map(line => {
      if (!line.trim()) return null;
      const delimiter = line.includes(";") ? ";" : ",";
      return line.split(delimiter).map(cell => cell.replace(/^"|"\$/g, '').trim());
    })
    .filter(row => row !== null);
}

function loadData() {
  if (URL_PUNKTACJA.includes("TUTAJ_WKLEJ")) {
    const content = document.getElementById("content");
    if (content) {
      content.innerHTML = `<div style="color: #ff8c00; padding: 20px; background: #1c1c1c; border-radius: 8px;">
        <strong>Konfiguracja wymagana:</strong> Wklej wygenerowany link CSV dla Punktacji w pliku app.js!
      </div>`;
    }
    return;
  }

  Promise.all([
    fetch(URL_PODSUMOWANIE).then(r => { if (!r.ok) throw new Error("Błąd Podsumowania"); return r.text(); }),
    fetch(URL_RANKING).then(r => { if (!r.ok) throw new Error("Błąd zakładki Ranking"); return r.text(); }),
    fetch(URL_PUNKTACJA).then(r => { if (!r.ok) throw new Error("Błąd zakładki Punktacja"); return r.text(); })
  ])
  .then(([csvPodsumowanie, csvRanking, csvPunktacja]) => {
    globalData["Podsumowanie"] = parseCSV(csvPodsumowanie);
    globalData["Ranking"] = parseCSV(csvRanking);
    globalData["Punktacja"] = parseCSV(csvPunktacja);

    renderTabs();
    updateTimestamp();
  })
  .catch(error => {
    console.error(error);
    const content = document.getElementById("content");
    if (content) {
      content.innerHTML = `<div style="color: #ff3333; padding: 20px; background: #1c1c1c; border-radius: 8px;">
        Błąd ładowania danych! Upewnij się, że wszystkie arkusze są poprawnie opublikowane jako CSV.<br>
        <small style="color: #aaa;">Szczegóły: ${error.message}</small>
      </div>`;
    }
  });
}

function renderTabs() {
  const tabs = document.getElementById("tabs");
  const activeTabBtn = document.querySelector(".tab-btn.active");
  const activeTabName = activeTabBtn ? activeTabBtn.dataset.name : "Podsumowanie";

  tabs.innerHTML = "";
  const tabsList = ["Podsumowanie", "Ranking", "Punktacja", "Legenda"];

  tabsList.forEach(name => {
    const btn = document.createElement("button");
    btn.className = "tab-btn";
    btn.textContent = name;
    btn.dataset.name = name;
    
    if (name === activeTabName) btn.classList.add("active");

    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      showTab(name, globalData[name]);
    });
    tabs.appendChild(btn);
  });

  const currentActiveBtn = document.querySelector(`.tab-btn[data-name="${activeTabName}"]`);
  if (currentActiveBtn) {
    showTab(activeTabName, globalData[activeTabName]);
  }
}

function showTab(name, rows) {
  const content = document.getElementById("content");
  content.innerHTML = "";

  // --- 1. LEGENDA ---
  if (name === "Legenda") {
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
    return;
  }

  if (!rows || rows.length === 0) return;

  // --- 2. ZAKŁADKA: PUNKTACJA (NOWOŚĆ) ---
  if (name === "Punktacja") {
    const mainContainer = document.createElement("div");
    // Flexbox do wyświetlenia dwóch tabel obok siebie na komputerach i pod sobą na telefonach
    mainContainer.style.display = "flex";
    mainContainer.style.flexWrap = "wrap";
    mainContainer.style.gap = "20px";

    // Tworzenie tabeli dla Norm Punktowych
    const normDiv = document.createElement("div");
    normDiv.className = "player-list";
    normDiv.style.flex = "1 1 300px";
    normDiv.innerHTML = `<div style="font-weight:bold; font-size:18px; margin-bottom:10px; color:#ffd700; border-bottom:1px solid #444; padding-bottom:5px;">Normy Punktów</div>`;

    // Tworzenie tabeli dla Punktów za Skrzynie
    const chestDiv = document.createElement("div");
    chestDiv.className = "player-list";
    chestDiv.style.flex = "1 1 350px";
    chestDiv.innerHTML = `<div style="font-weight:bold; font-size:18px; margin-bottom:10px; color:#8e2de2; border-bottom:1px solid #444; padding-bottom:5px;">Chest Type -> Points</div>`;

    let sekcjaSkrzyn = false;

    rows.forEach(row => {
      if (!row || row.length === 0 || !row[0]) return;
      
      const col1 = row[0].trim();
      const col2 = row[1] ? row[1].trim() : "";

      // Wykrywanie przełączenia sekcji w pliku CSV
      if (col1.toLowerCase().includes("chest type")) {
        sekcjaSkrzyn = true;
        return;
      }
      if (col1.toLowerCase().includes("normy punktów")) {
        sekcjaSkrzyn = false;
        return;
      }
      if (col1.toLowerCase() === "points") return; // pomin nagłówek kolumny danych

      const item = document.createElement("div");
      item.className = "player-list-item";
      item.style.display = "flex";
      item.style.justifyContent = "space-between";
      item.innerHTML = `<span>${col1}</span><span style="font-weight:bold; color:#fff;">${col2}</span>`;

      if (sekcjaSkrzyn) {
        chestDiv.appendChild(item);
      } else {
        normDiv.appendChild(item);
      }
    });

    mainContainer.appendChild(normDiv);
    mainContainer.appendChild(chestDiv);
    content.appendChild(mainContainer);
    return;
  }

  // --- 3. ZAKŁADKA: RANKING ---
  if (name === "Ranking") {
    let headerIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i] && rows[i].includes("Gracz")) {
        headerIndex = i;
        break;
      }
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

      if (miejsce == "1" || miejsce.includes("1")) item.classList.add("top1");
      if (miejsce == "2" || miejsce.includes("2")) item.classList.add("top2");
      if (miejsce == "3" || miejsce.includes("3")) item.classList.add("top3");

      item.textContent = `${miejsce}. ${medal} ${gracz} (${poziom}) — Punkty: ${punkty} — Norma: ${norma}% — Skrzynie: ${razem}`;
      listDiv.appendChild(item);
    });

    content.appendChild(listDiv);
    return;
  }

  // --- 4. ZAKŁADKA: PODSUMOWANIE ---
  const headers = rows[0];
  const sortedRows = rows.slice(1).sort((a, b) => Number(b[2] || 0) - Number(a[2] || 0));

  const listDiv = document.createElement("div");
  listDiv.className = "player-list";

  sortedRows.forEach((row, index) => {
    if (!row || row.length < 3) return;
    const item = document.createElement("div");
    item.className = "player-list-item";

    if (index === 0) item.classList.add("top1");
    if (index === 1) item.classList.add("top2");
    if (index === 2) item.classList.add("top3");

    item.textContent = `${row[0]} — ${row[1] || 0} — ${row[2] || 0}`;
    listDiv.appendChild(item);
  });

  content.appendChild(listDiv);

  rows.slice(1).forEach(row => {
    if (!row || row.length < 3) return; 
    
    const card = document.createElement("div");
    card.className = "player-card";

    const headerDiv = document.createElement("div");
    headerDiv.className = "player-name";
    headerDiv.textContent = row[0];

    const statsDiv = document.createElement("div");
    statsDiv.className = "player-stats";
    statsDiv.innerHTML = `Razem: ${row[1] || 0}<br>Punkty: ${row[2] || 0}`;

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

      const short = header
