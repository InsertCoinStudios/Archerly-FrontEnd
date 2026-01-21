document.addEventListener("DOMContentLoaded", async () => {
  const returnBtn = document.getElementById("returnBtn");
  const overlay = document.getElementById("leaveOverlay");
  const yesBtn = document.getElementById("leaveYes");
  const noBtn = document.getElementById("leaveNo");
  const sessionIdDisplay = document.getElementById("sessionIdDisplay");
  const usersQueue = document.getElementById("usersQueue");
  const participantCountEl = document.getElementById("participantCount");

  const baseURL = "http://localhost:5000"; // Backend-URL
  const jwt = localStorage.getItem("jwt");
  const sessionId = localStorage.getItem("joinedSessionId");

  if (!jwt || !sessionId) return;

  // =========================
  // Funktion: Hunt verlassen
  // =========================
  async function leaveHunt() {
    try {
      await fetch(`${baseURL}/hunts/${sessionId}/leave`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`
        }
      });
      console.log("Hunt verlassen");
      localStorage.removeItem("joinedSessionId");
    } catch (err) {
      console.error("Fehler beim Verlassen der Hunt:", err);
    }
  }

  // =========================
  // Overlay Steuerung
  // =========================
  returnBtn.addEventListener("click", () => overlay.style.display = "flex");

  yesBtn.addEventListener("click", async () => {
    await leaveHunt();
    window.location.href = "index.html";
  });

  noBtn.addEventListener("click", () => overlay.style.display = "none");
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.style.display = "none"; });

  // =========================
  // Hunt verlassen bei Tab/Browser schließen
  // =========================
  window.addEventListener("beforeunload", leaveHunt);
  window.addEventListener("pagehide", leaveHunt);

  // =========================
  // Spielerliste laden & anzeigen
  // =========================
  async function loadSession() {
    try {
      const res = await fetch(`${baseURL}/hunts/${sessionId}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`
        }
      });
      if (!res.ok) throw new Error("Fehler beim Laden der Session");

      const data = await res.json();

      // Session-ID anzeigen
      sessionIdDisplay.innerHTML = `SESSION-ID:<br><br>#${data.sessionId}`;

      // Teilnehmer anzeigen
      usersQueue.innerHTML = "";
      data.participants.forEach((user, idx) => {
        const row = document.createElement("div");
        if (idx === 0) row.className = "non-collapse-top_queue";
        else if (idx === data.participants.length - 1) row.className = "non-collapse-bottom_queue";
        else row.className = "non-collapse_queue";

        row.innerHTML = `<p>${user.username}</p>`;

        // Highlight für Creator
        if (user.username === data.creator.username) {
          row.style.backgroundColor = "#fbd279";
        }

        usersQueue.appendChild(row);
      });

      participantCountEl.textContent = data.participants.length;

    } catch (err) {
      console.error(err);
      alert("Fehler beim Laden der Session. Bitte erneut versuchen.");
    }
  }

  // =========================
  // Live-Update der Spielerliste (Polling alle 3s)
  // =========================
  loadSession();
  const liveInterval = setInterval(loadSession, 3000);
});
