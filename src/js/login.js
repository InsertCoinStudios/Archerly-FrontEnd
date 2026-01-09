const baseURL = 'https://your-backend-url/';

document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("loginForm");

    form.addEventListener("submit", async function(e) {
        e.preventDefault();

        // Inputs
        const emailInput = form.querySelector('input[name="email"]');
        const passwordInput = form.querySelector('input[name="password"]');

        // Fehlermeldungen zurücksetzen
        form.querySelectorAll(".error-text").forEach(span => span.textContent = "");

        let hasError = false;

        // Einfache Validierung
        if (!emailInput.value) {
            emailInput.nextElementSibling.textContent = "Bitte E-Mail eingeben";
            hasError = true;
        }
        if (!passwordInput.value) {
            passwordInput.nextElementSibling.textContent = "Bitte Passwort eingeben";
            hasError = true;
        }

        if (hasError) return;

        // Request ans Backend
        try {
            const response = await fetch(baseURL + "api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: emailInput.value,
                    password: passwordInput.value
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert("Login erfolgreich!");
                // Weiterleitung z.B.
                window.location.href = "/dashboard";
            } else {
                // Fehler vom Backend anzeigen
                alert(data.message || "Login fehlgeschlagen");
            }
        } catch (err) {
            console.error(err);
            alert("Serverfehler, bitte später erneut versuchen");
        }
    });
});
