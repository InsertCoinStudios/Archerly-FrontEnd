document.addEventListener("DOMContentLoaded", async () => {
  // 🔹 URL-Parameter
  const urlParams = new URLSearchParams(window.location.search);
  const context = urlParams.get("context"); // "existing" | "new"
  const parcourId = urlParams.get("parcourId");
  const animalIndex = parseInt(urlParams.get("animalIndex"), 10);
  const baseURL = "http://localhost:5000";

  // 🔹 DOM-Elemente
  const deleteBtn = document.getElementById("deleteBtn");
  const overlay = document.getElementById("leaveOverlay");
  const yesBtn = document.getElementById("leaveYes");
  const noBtn = document.getElementById("leaveNo");
  const nameInput = document.getElementById("animal-name");
  const saveBtn = document.getElementById("saveBtn");
  const grid = document.querySelector(".silhouettes-grid");
  const returnBtn = document.getElementById("returnBtn");

  // 🔹 Variablen
  let selectedBox = null;
  let currentParcour = { animals: [] };
  let animalsFromBackend = [];

  // 🔹 JWT Token
  const jwt = localStorage.getItem("jwt");
  if (!jwt) { alert("Nicht angemeldet!"); window.location.href = "login.html"; return; }

  // ===============================
  // 🐾 0️⃣ Tiere vom Backend holen
  // ===============================
  try {
    const response = await fetch(`${baseURL}/animals`, {
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${jwt}` }
    });
    if (!response.ok) throw new Error("Fehler beim Laden der Tiere");
    animalsFromBackend = await response.json();
  } catch (err) {
    console.error(err);
    alert("Fehler beim Laden der Tiere vom Backend");
  }

  // ===============================
  // 1️⃣ Silhouetten erzeugen (nur Bilder)
  // ===============================
  animalsFromBackend.forEach(animal => {
    const box = document.createElement("div");
    box.classList.add("silhouette-box-admin");
    box.dataset.id = animal.id;
    box.dataset.image = animal.imageUrl;

    // Hintergrundbild auf die Box setzen
    box.style.backgroundImage = `url(${animal.imageUrl})`;
    box.style.backgroundSize = "contain";
    box.style.backgroundRepeat = "no-repeat";
    box.style.backgroundPosition = "center";
    box.title = animal.name; // optional Tooltip

    box.addEventListener("click", () => {
      document.querySelectorAll(".silhouette-box-admin.selected")
        .forEach(b => b.classList.remove("selected"));
      box.classList.add("selected");
      selectedBox = box;
      validateSaveButton();
    });

    grid.appendChild(box);
  });

  // ===============================
  // 2️⃣ Parcour laden
  // ===============================
if (context === "new") {
  currentParcour = JSON.parse(
    localStorage.getItem("draft_newParcour") || '{"animals":[]}'
  );
  loadAnimal();

  if (currentParcour.animals.length <= 1 && deleteBtn) {
    deleteBtn.style.display = "none";
  }

} else if (context === "existing") {
  try {
    const res = await fetch(`${baseURL}/courses/${parcourId}`, {
      headers: {
        "Authorization": `Bearer ${jwt}`
      }
    });

    if (!res.ok) throw new Error("Fehler beim Laden des Parcours");

    const data = await res.json();
    currentParcour = data.course;

    loadAnimal();

  } catch (err) {
    console.error(err);
    alert("Fehler beim Laden des Parcours");
  }
}


  // ===============================
  // 3️⃣ Tierdaten laden
  // ===============================
  function loadAnimal() {
    const animal = currentParcour.animals[animalIndex];
    if (!animal) return;

    nameInput.value = animal.name;

    // Silhouette markieren
    const box = grid.querySelector(`.silhouette-box-admin[data-id="${animal.silhouette}"]`);
    if (box) { box.classList.add("selected"); selectedBox = box; }

    validateSaveButton();
  }

  // ===============================
  // 4️⃣ Save Button validieren
  // ===============================
  function validateSaveButton() {
    const hasValidName = nameInput.value.trim() !== "" && nameInput.value.toLowerCase() !== "tier";
    const hasSelection = selectedBox !== null;
    saveBtn.disabled = !(hasValidName && hasSelection);
    saveBtn.style.opacity = hasValidName && hasSelection ? "1" : "0.5";
    saveBtn.style.pointerEvents = hasValidName && hasSelection ? "auto" : "none";
  }
  nameInput.addEventListener("input", validateSaveButton);

  // ===============================
  // 5️⃣ Tier update ans Backend (PUT)
  // ===============================
  saveBtn.addEventListener("click", async () => {
    if (!selectedBox) { alert("Bitte eine Silhouette auswählen!"); return; }
    const animalData = { name: nameInput.value.trim(), imageUrl: selectedBox.dataset.image };
    try {
      const animalId = selectedBox.dataset.id;
      const res = await fetch(`${baseURL}/animals/${animalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${jwt}` },
        body: JSON.stringify(animalData)
      });
      if (!res.ok) throw new Error("Fehler beim Update");
      alert("Tier erfolgreich aktualisiert!");
      window.history.back();
    } catch (err) {
      console.error(err);
      alert("Fehler beim Aktualisieren des Tiers!");
    }
  });

  // ===============================
  // 6️⃣ Delete Overlay & Tier löschen
  // ===============================
  if (deleteBtn && overlay && yesBtn && noBtn) {
    deleteBtn.addEventListener("click", () => overlay.style.display = "flex");
    yesBtn.addEventListener("click", async () => {
      if (!currentParcour.animals || isNaN(animalIndex)) return window.history.back();
      if (currentParcour.animals.length <= 1) { alert("Mindestens ein Tier muss im Parcour enthalten sein."); overlay.style.display = "none"; return; }
      currentParcour.animals.splice(animalIndex, 1);
      if (context === "new") { localStorage.setItem("draft_newParcour", JSON.stringify(currentParcour)); return window.history.back(); }
      try {
        const res = await fetch(`${baseURL}/courses/${parcourId}/animals`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${jwt}` },
          body: JSON.stringify(currentParcour.animals)
        });
        if (!res.ok) throw new Error("Fehler beim Löschen");
        alert("Tier erfolgreich entfernt");
        window.history.back();
      } catch (err) {
        console.error(err);
        alert("Fehler beim Entfernen des Tiers");
      }
    });
    noBtn.addEventListener("click", () => overlay.style.display = "none");
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.style.display = "none"; });
  }

  // ===============================
  // 7️⃣ Return Button
  // ===============================
  if (returnBtn) {
    returnBtn.addEventListener("click", () => {
      if (window.history.length > 1) window.history.back();
      else window.location.href = "admin_main.html";
    });
  }
});
