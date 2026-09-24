// === KONFIGURACJA LINKÓW Z ARKUSZA GOOGLE ============================
// Wklej tutaj wygenerowane linki CSV dla poszczególnych zakładek:
const URL_PODSUMOWANIE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT04qgjfew9Fu4mR3zTP2TIbYaYMmhMQUfUhsHDPsxb2X0Ra4CjcZo6yqpD-fN3V16dG5zsFMexZKvO/pub?gid=0&single=true&output=csv";
const URL_NOWA_ZAKLADKA = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT04qgjfew9Fu4mR3zTP2TIbYaYMmhMQUfUhsHDPsxb2X0Ra4CjcZo6yqpD-fN3V16dG5zsFMexZKvO/pub?gid=1621614425&single=true&output=csv";
// =====================================================================

let refreshInterval = null;
// Obiekt, w którym będziemy przechowywać przetworzone wiersze dla każdej z kart
let globalData = {
  "Podsumowanie": [],
  "Nowa Zakładka": [], // Możesz zmienić tę nazwę na taką, jaka ma być na przycisku
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

// Prosty parser CSV uwzględniający przecinki i średniki
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
  if (URL_PODSUMOWANIE.includes("https://docs.google.com/spreadsheets/d/e/2PACX-1vT04qgjfew9Fu4mR3zTP2TIbYaYMmhMQUfUhsHDPsxb2X0Ra4CjcZo6yqpD-fN3V16dG5zsFMexZKvO/pub?gid=0&single=true&output=csv") || URL_NOWA_ZAKLADKA.includes("https://docs.google.com/spreadsheets/d/e/2PACX-1vT04qgjfew9Fu4mR3zTP2TIbYaYMmhMQUfUhsHDPsxb2X0Ra4CjcZo6yqpD-fN3V16dG5zsFMexZKvO/pub?gid=1621614425&single=true&output=csv")) {
    const content = document.getElementById("content");
    if (content) {
      content.innerHTML = `<div style="color: #ff8c00; padding: 20px; background: #1c1c1c; border-radius: 8px;">
        <strong>Konfiguracja wymagana:</strong> Uupełnij oba linki CSV w pliku app.js!
      </div>`;
    }
    return;
  }

  // Pobieramy oba arkusze jednocześnie za pomocą Promise.all
  Promise.all([
    fetch(URL_PODSUMOWANIE).then(r => { if (!r.ok) throw new Error("Błąd Podsumowania"); return r.text(); }),
    fetch(URL_NOWA_ZAKLADKA).then(r => { if (!r.ok) throw new Error("Błąd Nowej Zakładki"); return r.text(); })
  ])
  .then(([csvPodsumowanie, csvNowaZakladka]) => {
    globalData["Podsumowanie"] = parseCSV(csvPodsumowanie);
    globalData["Nowa Zakładka"] = parseCSV(csvNowaZakladka); // Nazwa musi być spójna z przyciskiem tab

    // Generujemy przyciski zakładek tylko raz na początku lub odświeżamy widok
    renderTabs();
    updateTimestamp();
  })
  .catch(error => {
    console.error(error);
    const content = document.getElementById("content");
    if (content) {
      content.innerHTML = `<div style="color: #ff3333; padding: 20px; background: #1c1c1c; border-radius: 8px;">
        Błąd ładowania danych! Upewnij się, że oba arkusze są poprawnie opublikowane jako CSV.<br>
        <small style="color: #aaa;">Szczegóły: ${error.message}</small>
      </div>`;
    }
  });
}

function renderTabs() {
  const tabs = document.getElementById("tabs");
  
  // Zapamiętujemy, która zakładka była aktywna przed odświeżeniem danych
  const activeTabBtn = document.querySelector(".tab-btn.active");
  const activeTabName = activeTabBtn ? activeTabBtn.dataset.name : "Podsumowanie";

  tabs.innerHTML = "";

  // Definiujemy listę kart, które mają się pojawić w menu
  const tabsList = ["Podsumowanie", "Ranking", "Legenda"];

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

  // Wymuszamy kliknięcie i załadowanie zawartości aktualnej zakładki
  const currentActiveBtn = document.querySelector(`.tab-btn[data-name="${activeTabName}"]`);
  if (currentActiveBtn) {
    showTab(activeTabName, globalData[activeTabName]);
  }
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

  if (!rows || rows.length === 0) return;

  // --- PRZETWARZANIE WIERZY (DLA OBU ARKUSZY LOGIKA JEST TA SAMA) ---
  const headers = rows[0];
  // Sortowanie graczy według punktów (indeks 2)
  const sortedRows = rows.slice(1).sort((a, b) => Number(b[2] || 0) - Number(a[2] || 0));

  // --- LISTA GRACZY (RANKING) ---
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

  // --- KARTY GRACZY ---
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
