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
  console.log("check huntData (stringified):", JSON.stringify(huntData, null, 2));

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

async function loadHunt(huntId) {
  const res = await fetch(`${baseURL}/hunts/${huntId}`, {
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${jwt}` }
  });

  const text = await res.text();
  console.log("Backend RAW text:", text);
   // zuerst als Text holen
  if (!text) { // leerer Body
    console.error("Backend hat keine Hunt-Daten zurückgegeben");
    throw new Error("Hunt konnte nicht geladen werden (leerer Response-Body)");
  }

  try {
    const data = JSON.parse(text);
    console.log("Backend PARSED data:", data); // jetzt sicher parsen
    if (!res.ok) {
      console.error("Backend Fehler:", res.status, res.statusText, data);
      throw new Error(`Hunt konnte nicht geladen werden (HTTP ${res.status})`);
    }
    return data;
  } catch (e) {
    console.error("Ungültiges JSON vom Backend:", text);
    throw e;
  }
}

  const parcourId = localStorage.getItem("selectedParcour");


async function loadParcour(parcourId) {
  const res = await fetch(`${baseURL}/courses/${parcourId}`, {
    headers: { Authorization: `Bearer ${jwt}` }
  });

  const text = await res.text();
  if (!text) {
    console.error("Backend hat keine Parcour-Daten zurückgegeben");
    throw new Error("Parcour konnte nicht geladen werden (leerer Response-Body)");
  }

  try {
    const data = JSON.parse(text);
    if (!res.ok) {
      console.error("Backend Fehler:", res.status, res.statusText, data);
      throw new Error(`Parcour konnte nicht geladen werden (HTTP ${res.status})`);
    }
    return data;
  } catch (e) {
    console.error("Ungültiges JSON vom Backend:", text);
    throw e;
  }
}

  const hunt = await loadHunt(huntId);
  const courseData = await loadParcour(parcourId);

  /* =====================
     DATEN ÜBERNEHMEN
  ===================== */

  const variant = Number(hunt.shotVariant);

if (variant === 2) ratingMode = "Zweipfeil";
else if (variant === 3) ratingMode = "Dreipfeil";
else {
  console.error("Ungültiger shotVariant vom Backend:", hunt.shotVariant);
  ratingMode = localStorage.getItem("ratingMode") || "Zweipfeil";
}

  TOTAL_ANIMALS = courseData.course?.animals.length;
  ANIMALS = courseData.course?.animals;

  parcourNameEl.textContent = courseData.course.name;
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
    renderPoints();
    updateFooter();
  }

  /* =====================
     KLICKS
  ===================== */

async function registerShot(animalId, shotCount, points) {
  try {
    const res = await fetch(
      `${baseURL}/hunts/${huntId}/animals/${animalId}/shot/${shotCount}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`
        },
        body: JSON.stringify({ pointsScored: points })
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("SHOT ERROR:", res.status, text);
      throw new Error("Shot konnte nicht gespeichert werden");
    }

    console.log(`SHOT OK → Animal ${animalId}, Shot ${shotCount}, Points ${points}`);
  } catch (err) {
    console.error("REGISTER SHOT FAILED:", err);
  }
}


async function updateRank() {
  try {
    const res = await fetch(`${baseURL}/hunts/${huntId}/userstats`, {
      headers: { Authorization: `Bearer ${jwt}` }
    });

    if (!res.ok) {
      console.error("Fehler beim Laden der User-Stats:", res.status, res.statusText);
      return;
    }
    const text = await res.clone().text(); // clone() weil res nur einmal gelesen werden kann
    console.log("updateRank Response Text:", text);

    const data = await res.json();

    console.log("updateRank Data (stringified):", JSON.stringify(data, null, 2));

    // Rang dynamisch setzen
    console.log(data.stats?.rank + "current Rank");
    rankEl.textContent = data.stats?.rank ?? "-";
    // Gesamtanzahl der Spieler aus localStorage
    console.log("hunt (stringified):", JSON.stringify(hunt, null, 2));

    totalPlayersEl.textContent = hunt.playerCount ?? "-";

  } catch (err) {
    console.error("Fehler beim Abrufen der User-Stats:", err);
  }
}


pointBoxes.forEach(box => {
  box.addEventListener("click", async () => {
    if (shotLocked) return;
    shotLocked = true;

    const value = box.dataset.value;
    const points = value === "MISS" ? 0 : Number(value);

    const animal = ANIMALS[currentAnimal - 1];
    const animalId = animal.id;

    const shotCount = currentShot + 1; // Backend ist 1-basiert

    // 🔥 BACKEND
    await registerShot(animalId, shotCount, points);

    if (!results[currentAnimal - 1]) {
      results[currentAnimal - 1] = { animal: currentAnimal, shots: [] };
    }

    results[currentAnimal - 1].shots.push(value);
    if (points > 0) totalScore += points;

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
    await updateRank();

    setTimeout(() => (shotLocked = false), 50);
  });
});



  /* =====================
     START
  ===================== */
  updateRank();
  renderAnimal();
  renderPoints();
  updateFooter();
});
