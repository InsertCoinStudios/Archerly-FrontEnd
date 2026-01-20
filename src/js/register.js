$(document).ready(function () {


  const baseURL = "http://localhost:3000"; // anpassen
  const form = $('#myForm');

  form.validate({
    rules: {
      firstname: { required: true },
      lastname: { required: true },
      nickname: { required: true },
      email: { required: true, email: true },
      password: { required: true, minlength: 8 },
      confirmPassword: { required: true, equalTo: "#password" }
    },
    messages: {
      firstname: { required: "Bitte Vornamen eingeben" },
      lastname: { required: "Bitte Nachnamen eingeben" },
      nickname: { required: "Bitte Nickname eingeben" },
      email: {
        required: "Bitte E-Mail eingeben",
        email: "Bitte gültige E-Mail eingeben"
      },
      password: {
        required: "Bitte Passwort eingeben",
        minlength: "Mindestens 8 Zeichen"
      },
      confirmPassword: {
        required: "Bitte Passwort bestätigen",
        equalTo: "Passwörter stimmen nicht überein"
      }
    },
    errorElement: "span",
    errorPlacement: function (error, element) {
      error.addClass("error-text");
      error.insertAfter(element);
    },

    // 🔥 HIER PASSIERT DIE REGISTRIERUNG
    submitHandler: function () {

      const payload = {
        firstname: $('#firstname').val(),
        lastname: $('#lastname').val(),
        nickname: $('#nickname').val(),
        email: $('#email').val(),
        password: $('#password').val()
      };

      $.ajax({
        url: `${baseURL}/register`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(payload),

        success: function (res) {
          if (res.success) {
            alert("✅ Registrierung erfolgreich!");
            window.location.href = "login.html";
          } else if (res.code === "EMAIL_EXISTS") {
            showEmailError(res.message);
          } else {
            alert("Registrierung fehlgeschlagen");
          }
        },

        error: function () {
          alert("Serverfehler – bitte später erneut versuchen");
        }
      });
    }
  });

  // 🧩 Backend-Fehler sauber am Input anzeigen
  function showEmailError(message) {
    const emailInput = $('#email');

    // vorhandene Fehler entfernen
    emailInput.next(".error-text").remove();

    const error = $('<span>')
      .addClass('error-text')
      .text(message);

    emailInput.after(error);
  }

});
