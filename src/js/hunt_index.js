document.addEventListener("DOMContentLoaded", () => {
  const createBtn = document.getElementById("createHuntBtn");
  const baseURL = "http://localhost:5000";

  createBtn.addEventListener("click", async () => {
    try {
      const jwt = localStorage.getItem("jwt");
      if (!jwt) throw new Error("Nicht eingeloggt");

      // === Create Hunt Endpoint ===
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

      // Direkt zu hunt_create.html weiterleiten
      window.location.href = "hunt_create.html";

    } catch (err) {
      console.error(err);
      alert("Fehler beim Erstellen der Jagd. Bitte erneut versuchen.");
    }
  });
});
