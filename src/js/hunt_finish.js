// ======= Konfiguration =======
const baseURL = "http://localhost:5000"; // Backend-URL anpassen
const huntId = localStorage.getItem("joinedSessionId");
const jwt = localStorage.getItem("jwt");
console.log("huntId:", huntId, "jwt:", jwt);


if (!huntId || !jwt) {
  console.error("Keine Hunt-ID oder kein JWT vorhanden!");
} else {
  initHuntFinish();
}

function initHuntFinish() {
  // ======= Chart initialisieren =======
  const chartDom = document.getElementById('performanceChart');
  const myChart = echarts.init(chartDom, null, {
    renderer: 'canvas',
    width: chartDom.clientWidth,
    height: chartDom.clientHeight
  });

  const chartOption = {
    tooltip: { show: false },
    color: ['#f399ac', '#ed2633', '#ef5a66'],
    series: [
      {
        type: 'pie',
        radius: '60%',
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: { show: true, position: 'inside', formatter: '{c}'},
        labelLine: { show: false },
        data: [
          { value: 0, name: 'Gesamt' },
          { value: 0, name: 'Volltreffer' },
          { value: 0, name: 'Verfehlt' }
        ],
        emphasis: { itemStyle: { shadowBlur: 0, shadowOffsetX: 0, shadowColor: 'transparent' } }
      }
    ]
  };

  myChart.setOption(chartOption);
  window.addEventListener('resize', () => myChart.resize());

async function loadUserStats() {
    try {
        const res = await fetch(`${baseURL}/hunts/${huntId}/userstats`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${jwt}`
            }
        });

        if (!res.ok) {
            const text = await res.text();
            console.error("Fehler beim Laden der User-Stats:", res.status, text);
            return;
        }

        const data = await res.json();
        console.log("User Stats:", data);

        const kill = data.stats.kill ?? 0;
        const hit = data.stats.hit ?? 0;
        const miss = data.stats.miss ?? 0;

    //         const totalShots = kill + hit + miss;
        const totalShots = hit;
        console.log("kill: ", kill, "miss: ", miss, "hits: ", totalShots);

        // Alle Segmente drin lassen, nur Labels für 0-Werte ausblenden
        const chartData = [
            { value: totalShots, name: 'Gesamt', label: { show: totalShots > 0 } },
            { value: kill, name: 'Volltreffer', label: { show: kill > 0 } },
            { value: miss, name: 'Verfehlt', label: { show: miss > 0 } }
        ];

        myChart.setOption({
            series: [
                {
                    data: chartData
                }
            ]
        });

    } catch (err) {
        console.error("Fehler beim Abrufen der User-Stats:", err);
    }
}


  // ======= Hunt Stats laden und Tabelle aktualisieren =======
  async function loadHuntStats() {

    if (!huntId || !jwt) {
      console.error("Keine Hunt-ID oder kein JWT vorhanden!");
      return;
    }

    try {
      const res = await fetch(`${baseURL}/hunts/${huntId}/stats`, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`
        }
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Fehler beim Laden der Hunt-Stats:", res.status, text);
        return;
      }

      const data = await res.json();
      console.log("success loadHuntStats():", data);

      const sortedRanks = data.ranks.sort((a, b) => a.rank - b.rank);
      const rectangles = document.querySelectorAll('#rectangle .rectangle-user');

      sortedRanks.forEach((player, idx) => {
        if (idx >= rectangles.length) return;

        const rect = rectangles[idx];
        const nameEl = rect.querySelector('.user-name');
        const scoreEl = rect.querySelector('.user-score');

        nameEl.textContent = player.userName || "leer";
        scoreEl.textContent = player.score != null ? player.score : "leer"; // wenn noch kein Score

        rect.classList.toggle("winner", player.rank === 1);
      });

    } catch (err) {
      console.error("Fehler beim Abrufen der Hunt Stats:", err);
    }
  }
  loadUserStats();
  loadHuntStats();
  setInterval(loadUserStats, 3000);
  setInterval(loadHuntStats, 3000);
}
