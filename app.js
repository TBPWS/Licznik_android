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
  fetch("https://raw.githubusercontent.com/TBPWS/Licznik_v1.1/main/data.json")
    .then(r => r.json())
    .then(data => {
      renderTabs(data);
      updateTimestamp();
    })
    .catch(console.error);
}

function renderTabs(data) {
  const tabs = document.getElementById("tabs");
  const content = document.getElementById("content");

  tabs.innerHTML = "";
  content.innerHTML = "";

  const sheetNames = Object.keys(data).filter(
    name => name !== "Dane" && name !== "Ranking Historia"
  );

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

  if (name !== "Podsumowanie") {
    const p = document.createElement("p");
    p.textContent = "Ta zakładka będzie w wersji mobilnej jako lista / prosty widok (do dopracowania).";
    content.appendChild(p);
    return;
  }

  const headers = rows[0];

  // --- LISTA GRACZY (Nazwa / Razem / Punkty) + TOP 3 ---
  const listDiv = document.createElement("div");
  listDiv.className = "player-list";

  const sortedRows = rows.slice(1).sort((a, b) => b[3] - a[3]);

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

  // --- KARTY GRACZY (HEKSAGONY) ---
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
      const hex = document.createElement("div");

      let type = "";
      if (header.includes("rare")) type = "rare";
      else if (header.includes("Crypt")) type = "crypt";
      else if (header.includes("Vault")) type = "vault";
      else if (header.includes("Hermes")) type = "hermes";
      else if (header.includes("Ancients")) type = "ancients";

      hex.className = "hex " + type;
      hex.textContent = value;
      hex.title = header;

      grid.appendChild(hex);
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
