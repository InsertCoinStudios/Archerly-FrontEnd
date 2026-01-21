document.addEventListener("DOMContentLoaded", () => {
  const sessionIdEl = document.getElementById("s-id");
  const queueContainer = document.querySelector(".table_users_queue");
  const returnBtn = document.getElementById("returnBtn");
  const overlay = document.getElementById("leaveOverlay");
  const yesBtn = document.getElementById("leaveYes");
  const noBtn = document.getElementById("leaveNo");
  const baseURL = "http://localhost:5000";

  const jwt = localStorage.getItem("jwt");
  if (!jwt) alert("Nicht eingeloggt");

  // =========================
  // Hunt-Daten aus localStorage
  // =========================
  let huntData = JSON.parse(localStorage.getItem("currentHunt") || "{}");

  if (huntData.sessionId) {
    sessionIdEl.innerHTML = `#${huntData.sessionId} <img src="../img/copy.svg" onclick="copySessionID()">`;
  }

  // =========================
  // Spieler rendern
  // =========================
  function renderPlayers(players = []) {
    queueContainer.innerHTML = "";
    players.forEach((player, idx) => {
      const div = document.createElement("div");

      if (idx === 0) div.className = "non-collapse-top_queue";
      else if (idx === players.length - 1) div.className = "non-collapse-bottom_queue";
      else div.className = "non-collapse_queue";

      div.innerHTML = `<p>${player.nickname || player.firstName}</p>`;

      if (player.id === huntData.owner?.id) {
        div.style.backgroundColor = "#fbd279";
        div.style.fontStyle = "italic";
      }

      queueContainer.appendChild(div);
    });
  }

  // =========================
  // Session-ID kopieren
  // =========================
  window.copySessionID = function() {
    const sessionId = huntData.sessionId;
    navigator.clipboard.writeText(sessionId)
      .then(() => alert("Session-ID kopiert!"))
      .catch(() => alert("Fehler beim Kopieren der Session-ID"));
  };

  // =========================
  // Live-Update Spielerliste
  // =========================
  async function updatePlayers() {
    if (!huntData.sessionId) return;
    try {
      const res = await fetch(`${baseURL}/hunts/${huntData.sessionId}`, {
        headers: { "Authorization": `Bearer ${jwt}` }
      });
      if (!res.ok) throw new Error("Fehler beim Abrufen der Spieler");

      const data = await res.json();
      if (JSON.stringify(huntData.players) !== JSON.stringify(data.value.players)) {
        huntData.players = data.value.players;
        renderPlayers(huntData.players);
      }
    } catch (err) {
      console.error("Live-Update Fehler:", err);
    }
  }

  const liveInterval = setInterval(updatePlayers, 3000);

  // =========================
  // Overlay & Rückkehr
  // =========================
  returnBtn.addEventListener("click", () => overlay.style.display = "flex");

  yesBtn.addEventListener("click", async () => {
    // Owner löscht die Hunt
    try {
      const response = await fetch(`${baseURL}/hunts/${huntData.sessionId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${jwt}` }
      });
      if (!response.ok) throw new Error("Fehler beim Auflösen der Jagd");

      clearInterval(liveInterval);
      localStorage.removeItem("currentHunt");
      window.location.href = "index.html";
    } catch (err) {
      console.error(err);
      alert("Fehler beim Auflösen der Jagd.");
    }
  });

  noBtn.addEventListener("click", () => overlay.style.display = "none");
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.style.display = "none"; });

  // =========================
  // Leave Hunt beim Tab-/Fenster-Schließen
  // =========================
  async function leaveHunt() {
    console.log("WIR RUFEN GERADE LEAVE AUF!!! hunt_create.js");
    if (!huntData.sessionId) return;
    try {
      await fetch(`${baseURL}/hunts/${huntData.sessionId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${jwt}` }
      });
    } catch (err) {
      console.error("Fehler beim Verlassen der Hunt:", err);
    }
  }

  window.addEventListener("beforeunload", leaveHunt);
  // Optional: auch bei Back-Button
  window.addEventListener("pagehide", leaveHunt);

  // =========================
  // Initial Spieler rendern
  // =========================
  renderPlayers(huntData.players || []);
});
