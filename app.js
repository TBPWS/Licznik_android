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

  // --- LISTA GRACZY ---
  const headers = rows[0];

  const sortedRows = rows.slice(1).sort((a, b) => Number(b[2]) - Number(a[2]));

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

  // --- KARTY GRACZY ---
  rows.slice(1).forEach(row => {
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
      if (i < 3) return;

      const value = row[i];
      if (!value || Number(value) === 0) return;

      const short = header
        .replace("Crypt__", "C")
        .replace("rare Crypt__", "RC")
        .replace("Vault", "V")
        .replace("Hermes", "H")
        .replace("Ancients", "A");

      const box = document.createElement("div");
      box.className = "box";

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
