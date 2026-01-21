document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("session-id");
  const errorText = document.getElementById("session-error");
  const joinBtn = document.getElementById("joinBtn");
  const baseURL = "http://localhost:5000"; // <-- Backend Basis-URL

  joinBtn.addEventListener("click", async () => {
    // Reset
    errorText.textContent = "";
    input.classList.remove("input-error");

    const sessionId = input.value.trim();

    // Leere Eingabe abfangen
    if (!sessionId) {
      errorText.textContent = "Ungültige ID. Bitte versuchen Sie es nochmal.";
      input.classList.add("input-error");
      return;
    }

    // Button deaktivieren & Loading anzeigen
    joinBtn.disabled = true;
    const originalText = joinBtn.textContent;
    joinBtn.innerHTML = '<span style="font-size: 0.7em;">Bitte warten...</span>';

    try {
      const jwt = localStorage.getItem("jwt");
      if (!jwt) throw new Error("Nicht eingeloggt");

      // =========================
      // JOIN HUNT ENDPOINT
      // =========================
      const response = await fetch(`${baseURL}/hunts/${sessionId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`
        }
      });

      if (!response.ok) {
        let errMsg = "Fehler beim Beitreten zur Jagd.";
        try {
          const errData = await response.json();
          if (errData?.message) errMsg = errData.message;
        } catch {}
        throw new Error(errMsg);
      }

      // Erfolgreich beigetreten → Session-ID speichern und weiterleiten
      localStorage.setItem("joinedSessionId", sessionId);
      window.location.href = "hunt_join_successful.html";

    } catch (err) {
      console.error(err);
      errorText.textContent = err.message || "Serverfehler – bitte später erneut versuchen.";
      input.classList.add("input-error");

    } finally {
      joinBtn.disabled = false;
      joinBtn.textContent = originalText;
    }
  });

  // Fehler entfernen beim Tippen
  input.addEventListener("input", () => {
    if (input.value.trim()) {
      errorText.textContent = "";
      input.classList.remove("input-error");
    }
  });
});
