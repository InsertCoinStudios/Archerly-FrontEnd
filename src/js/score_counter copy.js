document.addEventListener("DOMContentLoaded", async () => {

  const baseURL = "http://localhost:5000";
  const jwt = localStorage.getItem("jwt");
  const raw = localStorage.getItem("currentHunt");


if (!raw) {
  console.error("currentHunt ist leer oder noch nicht gesetzt");
  alert("Hunt-Daten fehlen – bitte neu starten");
  return;
}

  console.log("TYPE:", typeof raw);
  console.log("LENGTH:", raw?.length);
  console.log("RAW STRING:", raw);
  console.log("CHARS:", [...raw].map(c => c.charCodeAt(0)));

  const huntData = JSON.parse(raw);

  const huntId = huntData.sessionId;

  if (!huntId || !jwt) {
    alert("Keine Hunt-Daten vorhanden");
    return;
  }

  const parcourNameEl = document.getElementById("score_counter-parcour-name");
  const rankEl = document.getElementById("current-rank");
  const totalPlayersEl = document.getElementById("total-players");
  const animalImg = document.getElementById("animal-image");
  const footer = document.getElementById("score-footer");
  const pointBoxes = document.querySelectorAll(".points-box");

  let TOTAL_ANIMALS = 0;
  let ANIMALS = [];
  let ratingMode = "Zweipfeil";

  let currentAnimal = 1;
  let currentShot = 0;
  let totalScore = 0;
  let results = [];
  let shotLocked = false;

  /* =====================
     BACKEND LADEN
  ===================== */

  async function loadHunt() {
    const res = await fetch(`${baseURL}/hunts/${huntId}`, {
      headers: { Authorization: `Bearer ${jwt}` }
    });
    if (!res.ok) throw new Error("Hunt konnte nicht geladen werden");
    return res.json();
  }

  const parcourId = localStorage.getItem("selectedParcour");


  async function loadParcour(parcourId) {
    const res = await fetch(`${baseURL}/parcours/${parcourId}`, {
      headers: { Authorization: `Bearer ${jwt}` }
    });
    //if (!res.ok) throw new Error("Parcour konnte nicht geladen werden");
    //return res.json();
    if (!res.ok) {
  const text = await res.json(); // oder res.json(), wenn dein Backend JSON-Errors schickt
  console.error("HTTP STATUS:", res.status);
  console.error("STATUS TEXT:", res.statusText);
  console.error("BACKEND RESPONSE:", text);
  throw new Error(`Backend-Fehler: ${res.status}`);
    }
    return res.json();

  }

  const hunt = await loadHunt();
  const parcour = await loadParcour(parcourId);

  /* =====================
     DATEN ÜBERNEHMEN
  ===================== */

  ratingMode = hunt.shotVariant === 2 ? "Zweipfeil" : "Dreipfeil";
  TOTAL_ANIMALS = parcour.animals.length;
  ANIMALS = parcour.animals;

  parcourNameEl.textContent = parcour.name;
  totalPlayersEl.textContent = hunt.playerCount;

  /* =====================
     RATING KONFIG
  ===================== */

  const RATING_CONFIG = {
    Zweipfeil: {
      shotsPerAnimal: 2,
      pointsPerShot: [
        [20, 18, 16, "MISS"],
        [20, 18, 16, "MISS"]
      ]
    },
    Dreipfeil: {
      shotsPerAnimal: 3,
      pointsPerShot: [
        [20, 18, 16, "MISS"],
        [16, 14, 12, "MISS"],
        [10, 8, 6, "MISS"]
      ]
    }
  };

  const config = RATING_CONFIG[ratingMode];

  /* =====================
     UI
  ===================== */

  function renderAnimal() {
    animalImg.src = ANIMALS[currentAnimal - 1].imageUrl;
  }

  function renderPoints() {
    const points = config.pointsPerShot[currentShot];
    pointBoxes.forEach((box, i) => {
      box.textContent = points[i];
      box.dataset.value = points[i];
    });
  }

  function updateFooter() {
    footer.innerHTML = `
      <h4>
        Punkte: ${totalScore}<br>
        Tier: ${currentAnimal} von ${TOTAL_ANIMALS}<br>
        ${currentShot + 1}. Schuss
      </h4>
    `;
  }

  function nextAnimal() {
    if (currentAnimal >= TOTAL_ANIMALS) {
      localStorage.setItem("huntResults", JSON.stringify(results));
      localStorage.setItem("totalScore", totalScore);
      window.location.href = "hunt_finish.html";
      return;
    }
    currentAnimal++;
    currentShot = 0;
    renderAnimal();
  }

  /* =====================
     KLICKS
  ===================== */

  pointBoxes.forEach(box => {
    box.addEventListener("click", () => {
      if (shotLocked) return;
      shotLocked = true;

      const value = box.dataset.value;

      if (!results[currentAnimal - 1]) {
        results[currentAnimal - 1] = { animal: currentAnimal, shots: [] };
      }

      results[currentAnimal - 1].shots.push(value);
      if (value !== "MISS") totalScore += Number(value);

      currentShot++;

      if (ratingMode === "Zweipfeil" && currentShot === config.shotsPerAnimal) {
        nextAnimal();
      }

      if (ratingMode === "Dreipfeil") {
        if (value !== "MISS" || currentShot === config.shotsPerAnimal) {
          nextAnimal();
        }
      }

      renderPoints();
      updateFooter();

      setTimeout(() => (shotLocked = false), 50);
    });
  });

  /* =====================
     START
  ===================== */

  renderAnimal();
  renderPoints();
  updateFooter();
});
