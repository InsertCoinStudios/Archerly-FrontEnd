// =========================
// AUTO-RESET BEIM VERLASSEN DER SEITE
// =========================
window.addEventListener("beforeunload", () => {
  const destination = document.activeElement?.href || document.referrer || "";
  if (!destination.includes("admin_animal.html")) {
    localStorage.removeItem("draft_newParcour");
  }
});

document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // BASIS-ELEMENTE
  // =========================
  const animalList = document.querySelector('.table_users_admin-editor');
  const animalCounter = document.querySelector('.animal-counter');
  const saveBtn = document.getElementById("saveBtn");
  const nameInput = document.getElementById("parcour-name");
  const locInput = document.getElementById("parcour-loc");
  const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');

  // =========================
  // BUTTON STATE
  // =========================
  function enableSave() {
    saveBtn.disabled = false;
    saveBtn.style.opacity = "1";
    saveBtn.style.pointerEvents = "auto";
  }

  function disableSave() {
    saveBtn.disabled = true;
    saveBtn.style.opacity = "0.5";
    saveBtn.style.pointerEvents = "none";
  }

  disableSave();

  // =========================
  // FUNKTIONEN
  // =========================
  function refreshRowClasses() {
    const rows = animalList.children;
    Array.from(rows).forEach(row => {
      row.classList.remove(
        'non-collapse-top-admin',
        'non-collapse-bottom-admin',
        'non-collapse-admin'
      );
      row.classList.add('non-collapse-admin');
    });

    if (rows.length > 0) {
      rows[0].classList.replace('non-collapse-admin', 'non-collapse-top-admin');
      rows[rows.length - 1].classList.replace('non-collapse-admin', 'non-collapse-bottom-admin');
    }
  }

  function getAnimalOrder() {
    return Array.from(animalList.querySelectorAll('.animal-text'))
      .map(el => el.innerText.trim());
  }

  function createAnimalRow(name = 'Tier', index = null) {
    if (index === null) index = animalList.children.length;

    const div = document.createElement('div');
    div.className = 'non-collapse-admin';
    div.innerHTML = `
      <span class="drag-handle">&#x2630;</span>
      <span class="animal-text">${name}</span>
      <a href="admin_animal.html?context=new&animalIndex=${index}">
        <img class="edit_png" src="../img/edit_square.png" alt="edit">
      </a>
    `;
    return div;
  }

  function syncAnimalsToDraft() {
    const savedParcour = JSON.parse(
      localStorage.getItem("draft_newParcour") || '{"animals":[]}'
    );

    const names = Array.from(animalList.querySelectorAll('.animal-text'))
      .map(el => el.innerText.trim());

    if (names.length === 0) {
      savedParcour.animals = [{ name: "Tier", silhouette: null }];
    } else {
      savedParcour.animals = names.map((name, i) => ({
        name,
        silhouette: savedParcour.animals?.[i]?.silhouette || null
      }));
    }

    localStorage.setItem("draft_newParcour", JSON.stringify(savedParcour));
  }

  function validateSave() {
    const nameOk = nameInput.value.trim() !== "";
    const locOk = locInput.value.trim() !== "";
    const difficultyOk = Array.from(difficultyRadios).some(r => r.checked);

    const animals = Array.from(animalList.querySelectorAll('.animal-text'))
      .map(a => a.innerText.trim());

    const hasAnimals = animals.length > 0;
    const hasInvalidAnimal = animals.some(name => name === "" || name.toLowerCase() === "tier");

    if (nameOk && locOk && difficultyOk && hasAnimals && !hasInvalidAnimal) {
      enableSave();
    } else {
      disableSave();
    }
  }

  // =========================
  // INITIAL TIERE LADEN
  // =========================
  const savedParcour = JSON.parse(
    localStorage.getItem("draft_newParcour") || '{"animals":[]}'
  );

  const animals = savedParcour.animals || [];
  animalList.innerHTML = "";

  if (animals.length > 0) {
    animals.forEach((animal, index) => {
      animalList.appendChild(createAnimalRow(animal.name, index));
    });
  } else {
    animalList.appendChild(createAnimalRow("Tier", 0));
  }

  // =========================
  // COUNTER
  // =========================
  animalCounter.min = 1;
  animalCounter.value = animalList.children.length;

  animalCounter.addEventListener("input", () => {
    const target = parseInt(animalCounter.value, 10);
    const current = animalList.children.length;

    if (target > current) {
      const toAdd = target - current;
      for (let i = 0; i < toAdd; i++) {
        animalList.appendChild(createAnimalRow());
      }
    }

    animalCounter.value = animalList.children.length;
    refreshRowClasses();
    syncAnimalsToDraft();
    validateSave();
  });

  // =========================
  // SORTABLE
  // =========================
  Sortable.create(animalList, {
    animation: 150,
    ghostClass: 'sortable-ghost',
    handle: '.drag-handle',
    forceFallback: true,
    onEnd: () => {
      refreshRowClasses();
      syncAnimalsToDraft();
      validateSave();
    }
  });

  // =========================
  // EVENTS
  // =========================
  nameInput.addEventListener("input", validateSave);
  locInput.addEventListener("input", validateSave);
  difficultyRadios.forEach(r => r.addEventListener("change", validateSave));

  const observer = new MutationObserver(validateSave);
  observer.observe(animalList, { childList: true, subtree: true, characterData: true });

  // =========================
  // SPEICHERN
  // =========================
saveBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const location = locInput.value.trim();
  const difficulty = Array.from(difficultyRadios).find(r => r.checked)?.value;
  const info = document.getElementById("parcour-info").value.trim();

  const animals = Array.from(animalList.querySelectorAll('.animal-text'))
    .map(a => a.innerText.trim());

  if (!name || !location || !difficulty || animals.some(a => a.toLowerCase() === "tier")) {
    alert("Bitte alle Felder korrekt ausfüllen!");
    return;
  }

  try {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("Nicht eingeloggt");

    const BASE_URL = "https://dein-backend-url";

    const response = await fetch(`${BASE_URL}/courses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        Course: {
          Name: name,
          Location: location,
          Difficulty: difficulty,
          Info: info,
          Animals: animals.map(a => ({
            Id: crypto.randomUUID(),
            Name: a,
            ImageUrl: null
          }))
        }
      })
    });

    if (!response.ok) throw new Error("Backend-Fehler");

    const newCourseId = await response.text();
    console.log("Neue Course-ID:", newCourseId);

    alert("✅ Parcour erfolgreich erstellt!");
    localStorage.removeItem("draft_newParcour");

    window.location.href = "admin_main.html";

  } catch (err) {
    console.error(err);
    alert("Fehler beim Erstellen des Parcours.");
  }
});


  // =========================
  // FINAL
  // =========================
  refreshRowClasses();
  validateSave();
  syncAnimalsToDraft();
});
