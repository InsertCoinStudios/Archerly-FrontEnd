document.addEventListener("DOMContentLoaded", () => {
  const twoBtn = document.getElementById("twoBtn");
  const threeBtn = document.getElementById("threeBtn");
  const overlay = document.getElementById("leaveOverlay");
  const yesBtn = document.getElementById("leaveYes");
  const noBtn = document.getElementById("leaveNo");

  const popupParcourName = document.getElementById("popupParcourName");
  const popupRatingMode = document.getElementById("popupRatingMode");

  const baseURL = "http://localhost:5000"; // Backend-URL
  const jwt = localStorage.getItem("jwt");
  const huntData = JSON.parse(localStorage.getItem("currentHunt") || "{}");
  const huntId = huntData?.sessionId; // Hunt-ID aus LocalStorage

  if (!huntId || !jwt) {
    alert("Fehler: Keine Hunt-Daten oder Auth-Token vorhanden");
    return;
  }

  // Parcour-Name aus LocalStorage
  const selectedParcour = localStorage.getItem("selectedParcour");
  popupParcourName.textContent = selectedParcour || "Unbekannt";

  let selectedMode = null;

  async function setScoringVariant(variant) {
    try {
      const res = await fetch(`${baseURL}/hunts/${huntId}/shotvariant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`
        },
        body: JSON.stringify({ variant })
      });
      if (!res.ok) throw new Error("Fehler beim Setzen der Bewertungsart");
      console.log(`Scoring Variant gesetzt: ${variant}`);
    } catch (err) {
      console.error(err);
      alert("Fehler beim Setzen der Bewertungsart. Bitte erneut versuchen.");
    }
  }

  async function activateHunt() {
    try {
      const res = await fetch(`${baseURL}/hunts/${huntId}/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`
        }
      });
      if (!res.ok) throw new Error("Fehler beim Aktivieren der Jagd");
      console.log("Hunt aktiviert ✅");
    } catch (err) {
      console.error(err);
      alert("Fehler beim Aktivieren der Jagd. Bitte erneut versuchen.");
    }
  }

  twoBtn.addEventListener("click", () => {
    selectedMode = "Zweipfeil";
    popupRatingMode.textContent = selectedMode;
    overlay.style.display = "flex";
  });

  threeBtn.addEventListener("click", () => {
    selectedMode = "Dreipfeil";
    popupRatingMode.textContent = selectedMode;
    overlay.style.display = "flex";
  });

  yesBtn.addEventListener("click", async () => {
    if (!selectedMode) return;

    // Variant: 2 = Zweipfeil, 3 = Dreipfeil
    const variant = selectedMode === "Zweipfeil" ? 2 : 3;
    await setScoringVariant(variant);

    // Speichern für Frontend
    localStorage.setItem("ratingMode", selectedMode);

    // Hunt aktivieren
    await activateHunt();

    // Weiterleitung
    window.location.href = "score_counter.html";
  });

  noBtn.addEventListener("click", () => {
    overlay.style.display = "none";
    selectedMode = null;
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.style.display = "none";
      selectedMode = null;
    }
  });
});
