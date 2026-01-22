
const baseURL = "http://localhost:5000"; // Backend-URL

document.addEventListener("DOMContentLoaded", async () => {
  const returnBtn = document.getElementById("returnBtn");
  const overlay = document.getElementById("leaveOverlay");
  const yesBtn = document.getElementById("leaveYes");
  const noBtn = document.getElementById("leaveNo");
  const sessionIdDisplay = document.getElementById("sessionIdDisplay");
  const usersQueue = document.getElementById("usersQueue");
  const participantCountEl = document.getElementById("participantCount");
  const jwt = localStorage.getItem("jwt");
  const sessionId = localStorage.getItem("joinedSessionId");
  console.log("JWT:", jwt);
  console.log("Session ID:", sessionId);


  if (!jwt || !sessionId) return;

// =========================
// Funktion: Prüfen, ob Hunt aktiviert ist
// =========================
// window.location.href = "score_counter.html";

async function checkHuntActivated() {
  try {
    const res = await fetch(`${baseURL}/hunts/${sessionId}/IsActivated`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`
      }
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Fehler beim Prüfen der Aktivierung:", res.status, text);
      return false;
    }

    const activated = await res.json(); // Boolean
    console.log("Hunt aktiviert?", activated);

    return activated === true;

  } catch (err) {
    console.error("Fehler beim Abrufen von IsActivated:", err);
    return false;
  }
}

// =========================
// Polling starten
// =========================

async function waitForHuntActivation() {
  try {
    const response = await fetch(`${baseURL}/hunts/${sessionId}/IsActivated`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`
      }
    });

    if (!response.ok) {
      console.error("Serverfehler:", response.status);
      return;
    }

    const text = await response.text();
    const activated = text.trim() === "true";

    console.log("Query activated:", activated);

    if (activated) {
      const response = await fetch(`${baseURL}/hunts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`
        }
      });

      if (!response.ok) throw new Error("Fehler beim Erstellen der Jagd");

      const data = await response.json();
      // Response enthält:
      // data.value.owner, data.value.players, data.value.sessionId

      // Session-Daten im localStorage speichern für hunt_create.html
      localStorage.setItem("currentHunt", JSON.stringify(data.value));
      window.location.href = `score_counter.html?sessionId=${sessionId}`;
      return;
    }

    // wenn false → einfach beenden
    return;

  } catch (err) {
    console.error("Netzwerkfehler:", err);
    return;
  }
}

async function waitForHuntActivation2() {
  const loadingMsg = document.createElement("div");
  loadingMsg.id = "waitingMessage";
  loadingMsg.textContent = "Bitte warten, bis der Host die Jagd startet...";
  loadingMsg.style.textAlign = "center";
  loadingMsg.style.margin = "20px 0";
  document.body.prepend(loadingMsg);

  const intervalId = setInterval(async () => {
    const activated = await checkHuntActivated();
    console.log("Query activated");
    if (activated) {
      clearInterval(intervalId);
      loadingMsg.textContent = "Die Hunt wurde gestartet! Weiterleitung...";
      // Weiterleitung zur Hunt-Seite
      window.location.href = `score_counter.html?sessionId=${sessionId}`;
    }
  }, checkInterval);
}

// =========================
// Aufrufen beim Laden
// =========================
/*
document.addEventListener("DOMContentLoaded", () => {
  if (jwt && sessionId) {
    waitForHuntActivation();
  }
});
*/

  // =========================
  // Funktion: Hunt verlassen
  // =========================
  async function leaveHunt() {
    console.log("Wir rufen leavehunt aus datei hunt_join_successful.js");
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
  // window.addEventListener("beforeunload", leaveHunt);
  // window.addEventListener("pagehide", leaveHunt);

  // =========================
  // Spielerliste laden & anzeigen
  // =========================
  async function loadSession() {
    waitForHuntActivation();
    try {
      console.log("Fetch URL:", `${baseURL}/hunts/${sessionId}`);
      const res = await fetch(`${baseURL}/hunts/${sessionId}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`
        }
      });
      if (!res.ok) {
  const text = await res.text();
  console.error("Fetch fehlgeschlagen:", res.status, text);
  throw new Error("Fehler beim Laden der Session");
}


      const data = await res.json();

      // Session-ID anzeigen
      sessionIdDisplay.innerHTML = `SESSION-ID:<br><br>#${data.sessionId}`;

      // Teilnehmer anzeigen
      usersQueue.innerHTML = "";
      data.players.forEach((user, idx) => {
        const row = document.createElement("div");
        if (idx === 0) row.className = "non-collapse-top_queue";
        else if (idx === data.players.length - 1) row.className = "non-collapse-bottom_queue";
        else row.className = "non-collapse_queue";

        row.innerHTML = `<p>${user.nickname}</p>`;

        // Highlight für Creator
        if (user.id === data.owner.id) {
          row.style.backgroundColor = "#fbd279";
        }

        usersQueue.appendChild(row);
      });

      participantCountEl.textContent = data.players.length;

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
