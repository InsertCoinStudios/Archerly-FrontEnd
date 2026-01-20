document.addEventListener("DOMContentLoaded", () => {
  const logoutLink = document.getElementById("logout-link");

  const baseURL = "http://localhost:5000";

  logoutLink.addEventListener("click", async (event) => {
    event.preventDefault(); // verhindert sofortige Navigation

    const jwt = localStorage.getItem("jwt"); // oder wo immer dein Token gespeichert ist

    try {
      const response = await fetch(`${baseURL}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`
        }
      });

      if (response.ok) {
        // Token im LocalStorage/sessionStorage löschen
        localStorage.removeItem("jwt");
        // Weiterleitung zur Login-Seite
        window.location.href = "login.html";
      } else {
        console.error("Logout fehlgeschlagen:", response.statusText);
        alert("Logout fehlgeschlagen!");
      }
    } catch (error) {
      console.error("Fehler beim Logout:", error);
      alert("Fehler beim Logout!");
    }
  });
});
