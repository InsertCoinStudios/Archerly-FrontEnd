document.addEventListener("DOMContentLoaded", async () => {
  const table = document.getElementById("parcourTable");
  const baseURL = "http://localhost:5000"; // Backend-URL
  const jwt = localStorage.getItem("jwt");

  if (!jwt) {
    alert("Nicht angemeldet!");
    window.location.href = "login.html";
    return;
  }

  try {
    // Backend aufrufen
    const res = await fetch(`${baseURL}/courses`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`
      }
    });

    if (!res.ok) throw new Error("Fehler beim Laden der Parcours");

    const data = await res.json();
    const parcours = data.courses || [];

    // Tabelle leeren
    table.innerHTML = "";

    parcours.forEach((p, idx) => {
      // Klasse bestimmen: Top, Bottom oder Standard
      let rowClass = "non-collapse-admin";
      if (idx === 0) rowClass = "non-collapse-top-admin";
      if (idx === parcours.length - 1) rowClass = "non-collapse-bottom-admin";

      // Tiere im Parcours auflisten
      const animalNames = p.animals.map(a => a.name).join(", ") || "Keine Tiere";

      // HTML für eine Zeile
      const row = document.createElement("div");
      row.className = rowClass;

      row.innerHTML = `
        <p>
          ${String(idx + 1).padStart(2, "0")} ${p.name}
          <a href="admin_parcour.html?ParcourId=${p.id}">
            <img class="edit_png" src="../img/edit_square.png" alt="edit">
          </a>
        </p>
        <p style="margin-left: 15px; font-size: 14px; color: #555;">Tiere: ${animalNames}</p>
      `;

      table.appendChild(row);
    });

  } catch (err) {
    console.error(err);
    table.innerHTML = "<p>Fehler beim Laden der Parcours</p>";
  }
});
