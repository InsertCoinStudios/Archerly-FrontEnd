const baseURL = "http://localhost:5000";
document.addEventListener("DOMContentLoaded", async () => {
  // Token aus LocalStorage holen
  const jwt = localStorage.getItem("jwt");
  if (!jwt) {
    alert("Nicht angemeldet!");
    window.location.href = "login.html";
    return;
  }

  try {
    // 1. Daten vom Backend holen
    const response = await fetch(`${baseURL}/allTimeStats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`
      }
    });

    if (!response.ok) {
      throw new Error(`Fehler beim Laden der Statistik: ${response.status}`);
    }

    const data = await response.json();

    // 2. Daten extrahieren
    const totalShots = data.shots.length;
    const misses = data.miss; // assuming miss ist eine Zahl oder Array
    const kills = data.kill;  // assuming kill ist eine Zahl

    // Falls miss ein Array ist, Länge nehmen
    const totalMisses = Array.isArray(misses) ? misses.length : misses;
    const totalKills = Array.isArray(kills) ? kills.length : kills;

    // 3. Daten in die HTML-Elemente einfügen
    const scoreElements = document.querySelectorAll(".user-score");
    if (scoreElements.length >= 3) {
      scoreElements[0].textContent = totalShots;    // Gesamtanzahl Schüsse
      scoreElements[1].textContent = totalMisses;   // Verfehlte Schüsse
      scoreElements[2].textContent = totalKills;    // Volltreffer
    }

    // 4. Chart aktualisieren
    const chartDom = document.getElementById('performanceChart');
    const myChart = echarts.init(chartDom);

    const option = {
      tooltip: { show: false },
      color: ['#f399ac', '#ed2633', '#ef5a66'],
      series: [
        {
          type: 'pie',
          radius: '60%',
          label: { show: true, position: 'inside', formatter: '{c}' },
          labelLine: { show: false },
          data: [
            { value: totalShots, name: 'Gesamt', label: { show: totalShots > 0 } },
            { value: totalKills, name: 'Volltreffer', label: { show: totalKills > 0 } },
            { value: totalMisses, name: 'Verfehlt', label: { show: totalMisses > 0 } }
          ],
          emphasis: {
            itemStyle: { shadowBlur: 0, shadowOffsetX: 0, shadowColor: 'transparent' }
          }
        }
      ]
    };

    myChart.setOption(option);

    window.addEventListener('resize', () => {
      myChart.resize();
    });

  } catch (error) {
    console.error(error);
    alert("Fehler beim Laden der Statistik!");
  }
});
