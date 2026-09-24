// === KONFIGURACJA ===================================================
// 1. W Arkuszu Google wejdź w: Plik -> Udostępnij -> Opublikuj w internecie
// 2. Wybierz zakładkę "Podsumowanie" oraz format "Wartości rozdzielane przecinkami (.csv)"
// 3. Kliknij Opublikuj i wklej wygenerowany link poniżej:
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT04qgjfew9Fu4mR3zTP2TIbYaYMmhMQUfUhsHDPsxb2X0Ra4CjcZo6yqpD-fN3V16dG5zsFMexZKvO/pub?gid=0&single=true&output=csv";
// ====================================================================

let refreshInterval = null;

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

// Prosty parser CSV uwzględniający przecinki i średniki
function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  return lines
    .map(line => {
      if (!line.trim()) return null;
      // Arkusze Google w zależności od języka używają przecinka lub średnika
      const delimiter = line.includes(";") ? ";" : ",";
      return line.split(delimiter).map(cell => cell.replace(/^"|"\$/g, '').trim());
    })
    .filter(row => row !== null);
}

function loadData() {
  if (SHEET_CSV_URL === "TUTAJ_WKLEJ_SWOJ_LINK_Z_ARKUSZA_GOOGLE_CSV") {
    const content = document.getElementById("content");
    if (content) {
      content.innerHTML = `<div style="color: #ff8c00; padding: 20px; background: #1c1c1c; border-radius: 8px;">
        <strong>Konfiguracja wymagana:</strong> Wklej wygenerowany link CSV z Arkusza Google w pliku app.js!
      </div>`;
    }
    return;
  }

  fetch(SHEET_CSV_URL)
    .then(r => {
      if (!r.ok) throw new Error("Problem z pobraniem danych (Status: " + r.status + ")");
      return r.text();
    })
    .then(csvText => {
      const rows = parseCSV(csvText);
      if (rows.length > 0) {
        renderTabs(rows);
        updateTimestamp();
      }
    })
    .catch(error => {
      console.error(error);
      const content = document.getElementById("content");
      if (content) {
        content.innerHTML = `<div style="color: #ff3333; padding: 20px; background: #1c1c1c; border-radius: 8px;">
          Błąd ładowania danych! Upewnij się, że arkusz jest prawidłowo opublikowany jako CSV.<br>
          <small style="color: #aaa;">Szczegóły: ${error.message}</small>
        </div>`;
      }
    });
}

function renderTabs(rows) {
  const tabs = document.getElementById("tabs");
  tabs.innerHTML = "";

  // Ponieważ ciągniemy dane bezpośrednio z zakładki "Podsumowanie", stworzymy sztywne karty dla tej zakładki oraz Legendy
  const tabsList = ["Podsumowanie", "Legenda"];

  tabsList.forEach(name => {
    const btn = document.createElement("button");
    btn.className = "tab-btn";
    btn.textContent = name;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      showTab(name, rows);
    });
    tabs.appendChild(btn);
  });

  const firstBtn = document.querySelector(".tab-btn");
  if (firstBtn) firstBtn.click();
}

function showTab(name, rows) {
  const content = document.getElementById("content");
  content.innerHTML = "";

  // --- LEGENDA ---
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

  // --- PRZETWARZANIE PODSUMOWANIA ---
  const headers = rows[0];
  // Sortowanie graczy według punktów (kolumna 3, indeks 2) od największej do najmniejszej
  const sortedRows = rows.slice(1).sort((a, b) => Number(b[2] || 0) - Number(a[2] || 0));

  // --- LISTA GRACZY (RANKING) ---
  const listDiv = document.createElement("div");
  listDiv.className = "player-list";

  sortedRows.forEach((row, index) => {
    if (!row[0]) return; // Pomiń puste wiersze
    const item = document.createElement("div");
    item.className = "player-list-item";

    if (index === 0) item.classList.add("top1");
    if (index === 1) item.classList.add("top2");
    if (index === 2) item.classList.add("top3");

    item.textContent = `${row[0]} — ${row[1] || 0} — ${row[2] || 0}`;
    listDiv.appendChild(item);
  });

  content.appendChild(listDiv);

  // --- KARTY GRACZY ---
  rows.slice(1).forEach(row => {
    if (!row[0]) return; 
    
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
        .replace("Crypt__", "C")
        .replace("rare Crypt__", "RC")
        .replace("Vault", "V")
        .replace("Hermes", "H")
        .replace("Ancients", "A");

      const box = document.createElement("div");
      box.className = "box " + type;
      box.innerHTML = `
        <span class="box-label">${short}</span>
        <span class="box-value">${value}</span>
      `;
      grid.appendChild(box);
    });

    card.appendChild(headerDiv);
    card.appendChild(statsDiv);
    card.appendChild(grid);
    content.appendChild(card);
  });
}

// Obsługa auto-refreshu (30 sekund)
function startAutoRefresh() {
  if (refreshInterval) return;
  refreshInterval = setInterval(() => {
    if (document.visibilityState === "visible") {
      loadData();
    }
  }, 30000);
}

function stopAutoRefresh() {
  if (!refreshInterval) return;
  clearInterval(refreshInterval);
  refreshInterval = null;
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
});

loadData();
startAutoRefresh();
