const baseURL = 'https://your-backend-url/';

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Request ans Backend für Statistikdaten des angemeldeten Users
        const response = await fetch(baseURL + "api/userstats", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                // optional: Token / Auth falls nötig
                "Authorization": "Bearer " + localStorage.getItem("token")
            }
        });

        if (!response.ok) throw new Error("Fehler beim Laden der Statistik");

        const data = await response.json();

        /* Erwartetes Backend-JSON:
        {
            totalRounds: 12,
            totalShots: 150,
            totalScore: 1200,
            favoriteRatingType: "Gold"
        }
        */

        // Chart.js Setup
        const ctx = document.getElementById("userStatsChart").getContext("2d");

        const chartData = {
            labels: [
                "Gesamtanzahl gespielter Runden",
                "Gesamtanzahl an Schüssen",
                "Gesamtpunkteanzahl",
                `Bevorzugte Pfeilbewertung: ${data.favoriteRatingType}`
            ],
            datasets: [{
                data: [data.totalRounds, data.totalShots, data.totalScore, 1], // 1 für Lieblingsbewertung, nur um Slice anzuzeigen
                backgroundColor: ["#36A2EB", "#FF6384", "#FFCE56", "#8BC34A"]
            }]
        };

        const userStatsChart = new Chart(ctx, {
            type: 'pie',
            data: chartData,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

    } catch (err) {
        console.error(err);
        alert("Fehler beim Laden der Statistikdaten");
    }
});
