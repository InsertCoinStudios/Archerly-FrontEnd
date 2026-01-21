const baseURL = "http://localhost:5000"; // anpassen

document.addEventListener("DOMContentLoaded", () => {
window.addEventListener("pageshow", (event) => {
  localStorage.removeItem("jwt");
  localStorage.removeItem("userId");
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("joinedSessionId");
});


  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = form.email.value.trim();
    const password = form.password.value.trim();

    clearErrors();

    let hasError = false;

    if (!email) {
      showError("email", "Bitte E-Mail eingeben");
      hasError = true;
    }

    if (!password) {
      showError("password", "Bitte Passwort eingeben");
      hasError = true;
    }

    if (hasError) return;

    try {
      const res = await fetch(`${baseURL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login fehlgeschlagen");
        return;
      }

      // =========================
      // JWT + USER SPEICHERN
      // =========================
      localStorage.setItem("jwt", data.jwt);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("isAdmin", data.isAdmin);

      // =========================
      // WEITERLEITUNG
      // =========================
      if (data.isAdmin) {
        window.location.href = "admin_main.html";
      } else {
        window.location.href = "index.html";
      }

    } catch (err) {
      console.error(err);
      alert("Server nicht erreichbar");
    }
  });
});

function showError(fieldName, message) {
  const input = document.querySelector(`[name="${fieldName}"]`);
  const errorSpan = input.parentElement.querySelector(".error-text");
  if (errorSpan) errorSpan.textContent = message;
}

function clearErrors() {
  document.querySelectorAll(".error-text").forEach(span => span.textContent = "");
}
