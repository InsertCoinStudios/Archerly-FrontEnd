$(document).ready(function () {
    $('#myForm').validate({
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
            email: { required: "Bitte E-Mail eingeben", email: "Bitte gültige E-Mail eingeben" },
            password: { required: "Bitte Passwort eingeben", minlength: "Mindestens 8 Zeichen" },
            confirmPassword: { required: "Bitte Passwort bestätigen", equalTo: "Passwörter stimmen nicht überein" }
        },
        errorElement: "span", // Damit ein span statt label verwendet wird
        errorPlacement: function(error, element) {
            error.addClass("error-text");  // Optional: Klasse für Styling
            error.insertAfter(element);    // Platziere den Fehler direkt nach dem Input
        }
    });
});