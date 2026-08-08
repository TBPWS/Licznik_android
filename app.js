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

function loadData() {
  const url =
    "https://docs.google.com/spreadsheets/d/1OmkKHiEm0jA9nhygs3UV8yOkhDYt3EntSV4YZf-zf8U/gviz/tq?tqx=out:json";

  fetch(url)
    .then(r => r.text())
    .then(text => {
      // Google Sheets zwraca JS, nie czysty JSON → trzeba wyciąć
      const json = JSON.parse(text.substring(47, text.length - 2));

      // Konwersja Google → rows[]
      const rows = json.table.rows.map(r =>
        r.c.map(cell => (cell ? cell.v : ""))
      );

      // Pierwszy wiersz to nagłówki
      const headers = rows[0];

      // Reszta to dane
      const dataRows = rows.slice(1);

      // Twój format danych
      const data = {
        "Podsumowanie": [headers, ...dataRows]
      };

      renderTabs(data);
      updateTimestamp();
    })
    .catch(err => {
      console.error("Błąd pobierania danych z Google Sheets:", err);
    });
}


function renderTabs(data) {
  const tabs = document.getElementById("tabs");
  const content = document.getElementById("content");

  tabs.innerHTML = "";
  content.innerHTML = "";

  const sheetNames = Object.keys(data).filter(
    name => name !== "Dane" && name !== "Ranking Historia"
  );

  // Dodajemy zakładkę LEGENDA
  sheetNames.push("Legenda");

  sheetNames.forEach(name => {
    const btn = document.createElement("button");
    btn.className = "tab-btn";
    btn.textContent = name;
    btn.dataset.sheet = name;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      showTab(name, data[name]);
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
      ["C5", "Crypt__5"],
      ["C10", "Crypt__10"],
      ["C15", "Crypt__15"],
      ["C20", "Crypt__20"],
      ["C25", "Crypt__25"],
      ["RC10", "rare Crypt__10"],
      ["RC15", "rare Crypt__15"],
      ["RC20", "rare Crypt__20"],
      ["RC25", "rare Crypt__25"],
      ["V", "Vault"],
      ["H", "Hermes"],
      ["A", "Ancients"]
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

  // --- LISTA GRACZY (sortowanie po punktach) ---
  const listDiv = document.createElement("div");
  listDiv.className = "player-list";

  const sortedRows = rows.slice(1).sort((a, b) => Number(b[2]) - Number(a[2]));

  sortedRows.forEach((row, index) => {
    const name = row[0];
    const razem = row[1];
    const punkty = row[2];

    const item = document.createElement("div");
    item.className = "player-list-item";

    if (index === 0) item.classList.add("top1");
    if (index === 1) item.classList.add("top2");
    if (index === 2) item.classList.add("top3");

    item.textContent = `${name} — ${razem} — ${punkty}`;
    listDiv.appendChild(item);
  });

  content.appendChild(listDiv);

  // --- KARTY GRACZY ---
  const headers = rows[0];

  rows.slice(1).forEach(row => {
    const card = document.createElement("div");
    card.className = "player-card";

    const playerName = row[0];
    const razem = row[1];
    const punkty = row[2];

    const headerDiv = document.createElement("div");
    headerDiv.className = "player-name";
    headerDiv.textContent = playerName;

    const statsDiv = document.createElement("div");
    statsDiv.className = "player-stats";
    statsDiv.innerHTML = `Razem: ${razem}<br>Punkty: ${punkty}`;

    const grid = document.createElement("div");
    grid.className = "icon-grid";

    headers.forEach((header, i) => {
      if (i < 3) return;

      const value = row[i];

      if (!value || Number(value) === 0) return;

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
