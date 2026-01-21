document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // URL PARAM
  // =========================
  const urlParams = new URLSearchParams(window.location.search);
  const parcourId = urlParams.get("ParcourId");
  const baseURL = "https://DEIN-BACKEND-URL"; // z.B. https://api.meineseite.ch
  const jwt = localStorage.getItem("jwt"); // oder wo du ihn speicherst


  if (!parcourId) {
    alert("Kein Parcour ausgewählt!");
    window.location.href = "admin_main.html";
    return;
  }

  // =========================
  // BASIS ELEMENTE
  // =========================
  const animalList = document.querySelector(".table_users_admin-editor");
  const animalCounter = document.querySelector(".animal-counter");
  const nameInput = document.getElementById("parcour-name");
  const locInput = document.getElementById("parcour-loc");
  const infoInput = document.getElementById("parcour-info");
  const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
  const saveBtn = document.getElementById("saveBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const leaveOverlay = document.getElementById("leaveOverlay");
  const leaveYes = document.getElementById("leaveYes");
  const leaveNo = document.getElementById("leaveNo");


  // =========================
  // LOAD AUS BACKEND
  // =========================
  async function loadParcourFromBackend() {
    try {
      const res = await fetch(`${baseURL}/courses/${parcourId}`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`
        }
      });

      if (!res.ok) throw new Error("Fehler beim Laden");

      const data = await res.json();
      const course = data.course;

      nameInput.value = course.name;
      locInput.value = course.location;
      infoInput.value = course.info;

      const r = document.querySelector(`input[value="${course.difficulty}"]`);
      if (r) r.checked = true;

      animalList.innerHTML = "";
      course.animals.forEach((a, i) =>
        animalList.appendChild(createAnimalRow(a.name, i, a.id, a.imageUrl))
      );

      refreshRowClasses();
      validateSave();

    } catch (err) {
      console.error(err);
      alert("Parcour konnte nicht geladen werden!");
    }
  }


  if (savedParcour.name) nameInput.value = savedParcour.name;
  if (savedParcour.location) locInput.value = savedParcour.location;
  if (savedParcour.info) infoInput.value = savedParcour.info;
  if (savedParcour.difficulty) {
    const r = document.querySelector(
      `input[name="difficulty"][value="${savedParcour.difficulty}"]`
    );
    if (r) r.checked = true;
  }

  // =========================
  // TIERE
  // =========================
  const animals = savedParcour.animals || [];
  animalList.innerHTML = "";

  animals.length
    ? animals.forEach((a, i) => animalList.appendChild(createAnimalRow(a, i)))
    : animalList.appendChild(createAnimalRow("Tier", 0));

  // =========================
  // COUNTER
  // =========================
  let currentAnimals = animalList.children.length;
  let minAnimals = currentAnimals;

  animalCounter.value = currentAnimals;
  animalCounter.min = minAnimals;

  // =========================
  // FUNKTIONEN
  // =========================
  function createAnimalRow(name = "Tier", index = null, id = null, imageUrl = null) {
    if (index === null) index = animalList.children.length;
    const div = document.createElement("div");
    div.className = "non-collapse-admin";
    div.dataset.id = id || crypto.randomUUID();
    div.dataset.image = imageUrl || "";

    div.innerHTML = `
      <span class="drag-handle">&#x2630;</span>
      <span class="animal-text">${name}</span>
      <a href="admin_animal.html?context=existing&parcourId=${parcourId}&animalIndex=${index}">
        <img class="edit_png" src="../img/edit_square.png" alt="edit">
      </a>
    `;
    return div;
  }

  function refreshRowClasses() {
    const rows = [...animalList.children];
    rows.forEach(r => r.className = "non-collapse-admin");
    if (rows.length) {
      rows[0].classList.add("non-collapse-top-admin");
      rows.at(-1).classList.add("non-collapse-bottom-admin");
    }
  }

  function disableSave() {
    saveBtn.disabled = true;
    saveBtn.style.opacity = "0.5";
    saveBtn.style.pointerEvents = "none";
  }

  function enableSave() {
    saveBtn.disabled = false;
    saveBtn.style.opacity = "1";
    saveBtn.style.pointerEvents = "auto";
  }

  function validateSave() {
    const nameOk = nameInput.value.trim();
    const locOk = locInput.value.trim();
    const diffOk = [...difficultyRadios].some(r => r.checked);

    const animalsArr = [...animalList.querySelectorAll(".animal-text")]
      .map(a => a.innerText.trim());

    const validAnimals =
      animalsArr.length && !animalsArr.some(a => a.toLowerCase() === "tier");

    nameOk && locOk && diffOk && validAnimals ? enableSave() : disableSave();
  }

  // =========================
  // EVENTS
  // =========================
  nameInput.addEventListener("input", validateSave);
  locInput.addEventListener("input", validateSave);
  infoInput.addEventListener("input", validateSave);
  difficultyRadios.forEach(r => r.addEventListener("change", validateSave));

  new MutationObserver(validateSave)
    .observe(animalList, { childList: true, subtree: true, characterData: true });

  animalCounter.addEventListener("input", () => {
    let target = parseInt(animalCounter.value, 10);

    if (target < minAnimals) {
      animalCounter.value = currentAnimals;
      return;
    }

    while (currentAnimals < target) {
      animalList.appendChild(createAnimalRow());
      currentAnimals++;
    }

    minAnimals = currentAnimals;
    animalCounter.min = minAnimals;
    animalCounter.value = currentAnimals;

    refreshRowClasses();
    validateSave();
  });

  Sortable.create(animalList, {
    animation: 150,
    ghostClass: "sortable-ghost",
    handle: ".drag-handle",
    forceFallback: true,
    onEnd: refreshRowClasses
  });

    deleteBtn.addEventListener("click", () => {
    leaveOverlay.style.display = "flex";
    });

    leaveNo.addEventListener("click", () => {
    leaveOverlay.style.display = "none";
    });

  function collectAnimalsForApi() {
    return [...animalList.children].map(row => ({
      Id: row.dataset.id,
      Name: row.querySelector(".animal-text").innerText.trim(),
      ImageUrl: row.dataset.image || ""
    }));
  }

  // =========================
  // SAVE
  // =========================
saveBtn.addEventListener("click", async () => {
  const animals = collectAnimalsForApi();

  if (animals.some(a => a.Name.toLowerCase() === "tier")) {
    alert("Bitte alle Tiere benennen!");
    return;
  }

  const body = {
    Course: {
      Name: nameInput.value.trim(),
      Location: locInput.value.trim(),
      Difficulty: [...difficultyRadios].find(r => r.checked)?.value,
      Info: infoInput.value.trim(),
      Animals: animals
    }
  };

  try {
    const res = await fetch(`${baseURL}/courses/${parcourId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error("Update fehlgeschlagen");

    const newId = await res.text(); // dein Backend gibt eine ID zurück
    console.log("Updated course:", newId);

    alert("✅ Parcour wurde erfolgreich aktualisiert!");

  } catch (err) {
    console.error(err);
    alert("❌ Speichern fehlgeschlagen!");
  }
});

  // =========================
  // DELETE
  // =========================

  leaveYes.addEventListener("click", async () => {
  try {
    const res = await fetch(`${baseURL}/courses/${parcourId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`
      }
    });

    if (!res.ok) {
      throw new Error("Serverfehler beim Löschen");
    }

    // optional: localStorage aufräumen
    localStorage.removeItem("parcours_" + parcourId);

    alert("🗑 Parcour wurde gelöscht!");
    window.location.href = "admin_main.html";

  } catch (err) {
    console.error(err);
    alert("❌ Löschen fehlgeschlagen!");
  }
});


  // =========================
  // INIT
  // =========================
  loadParcourFromBackend();
  refreshRowClasses();
  validateSave();
});
