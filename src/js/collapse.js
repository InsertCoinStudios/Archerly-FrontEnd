document.addEventListener("DOMContentLoaded", async () => {
  const baseURL = "http://localhost:5000"; // Dein Backend
  const jwt = localStorage.getItem("jwt");
  const container = document.querySelector(".table_users_pc");

  if (!jwt) {
    alert("Nicht angemeldet!");
    window.location.href = "login.html";
    return;
  }

  let courses = [];
  try {
    const res = await fetch(`${baseURL}/courses`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`
      }
    });
    if (!res.ok) throw new Error("Fehler beim Laden der Parcours");
    const data = await res.json();
    courses = data.courses || [];
  } catch (err) {
    console.error(err);
    alert("Fehler beim Laden der Parcours vom Backend");
    return;
  }

  // Template erzeugen
  container.innerHTML = ""; // alte Dummy-Daten entfernen
  courses.forEach((course, index) => {
    const animalNames = course.animals.map(a => a.name).join(", ");
    const numberOfAnimals = course.animals.length;

    const courseHTML = `
      <button type="button" class="collapsible">
        <span class="pc-left">
          <span class="pc-dot ${course.difficulty}"></span>
          ${String(index + 1).padStart(2, "0")} ${course.name}
        </span>
        <span class="arrow down"></span>
      </button>
      <div class="col-text">
        <h5 style="margin-top: 5px;">Anzahl Tiere: ${numberOfAnimals}</h5><br>
        <h5>Tierarten: ${animalNames || "Keine Tiere"}</h5><br>
        <h5>Ort: ${course.location}</h5><br>
        <h5>Zusatz: ${course.info || "-"}</h5><br>
        <div style="text-align: right;">
          <button class="blue-parcour-btn select-parcour-btn" data-name="${course.name}" data-id="${course.id}" style="justify-self: right; margin-bottom: 15px;">
            Parkour auswählen
          </button>
        </div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", courseHTML);
  });

  // Collapsible Funktion aktivieren (wie in collapse.js)
  const coll = document.getElementsByClassName("collapsible");
  for (let i = 0; i < coll.length; i++) {
    coll[i].addEventListener("click", function () {
      for (let j = 0; j < coll.length; j++) {
        if (j !== i) {
          coll[j].classList.remove("active");
          coll[j].nextElementSibling.style.maxHeight = null;
        }
      }
      this.classList.toggle("active");
      const content = this.nextElementSibling;
      content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + "px";
    });
  }

  // Auswahl-Button Funktion
// Auswahl-Button Funktion
document.querySelectorAll(".select-parcour-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    const parcourName = btn.getAttribute("data-name");
    const parcourId = btn.getAttribute("data-id");
    
    // Hunt-Daten aus localStorage
    const huntData = JSON.parse(localStorage.getItem("currentHunt") || "{}");
    const huntId = huntData?.sessionId; // oder huntData.id, je nachdem wie dein Backend es erwartet
    const jwt = localStorage.getItem("jwt");
    
    if (!huntId || !jwt) {
      alert("Fehler: Keine Hunt-Daten oder Auth-Token vorhanden");
      return;
    }

    // Suche den CourseId anhand des Namens
    const selectedCourse = courses.find(c => c.id === parcourId);
    if (!selectedCourse) {
      alert("Fehler: Parcours nicht gefunden");
      return;
    }
    const courseId = selectedCourse.id;

    try {
        console.log(courseId);
        console.log(JSON.stringify({ courseId }));

      // === SET COURSE Endpoint ===
      const res = await fetch(`${baseURL}/hunts/${huntId}/course`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`
        },
        body: JSON.stringify({ courseId })
      });
    if (!res.ok) {
      const text = await res.text(); // oder res.json(), wenn dein Backend JSON-Errors schickt
      console.error("HTTP STATUS:", res.status);
      console.error("STATUS TEXT:", res.statusText);
      console.error("BACKEND RESPONSE:", text);
      throw new Error(`Backend-Fehler: ${res.status}`);
}


      // Optional: Bestätigung
      console.log(`Parcours ${parcourName} gesetzt`);

      // Speichern für Frontend
      localStorage.setItem("selectedParcour", parcourId);
      localStorage.setItem("selectedParcourName", parcourName);

      // Weiterleitung
      window.location.href = "rating_choice.html";

    } catch (err) {
      console.error(err);
      alert("Fehler beim Setzen des Parcours. Bitte erneut versuchen.");
    }
  });
});
});
