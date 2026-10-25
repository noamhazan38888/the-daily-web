(function () {
    const canvas = document.getElementById('views-chart');
    if (!canvas || typeof Chart === 'undefined') return;
    const stats = JSON.parse(canvas.dataset.stats);
    const events = JSON.parse(canvas.dataset.events);

    const labels = stats.map((s) => new Date(s.date).toLocaleDateString('he-IL'));

    function closestIndex(targetDate) {
      const target = new Date(targetDate).getTime();
      let bestIndex = 0;
      let bestDiff = Infinity;
      stats.forEach((s, index) => {
        const diff = Math.abs(new Date(s.date).getTime() - target);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestIndex = index;
        }
      });
      return bestIndex;
    }

    const markerPoints = events.map((event) => {
      const index = closestIndex(event.date);
      return { x: labels[index], y: stats[index].views, version: event.version, date: event.date };
    });

    new Chart(canvas, {
      data: {
        labels,
        datasets: [
          {
            type: 'line',
            label: 'צפיות ביום',
            data: stats.map((s) => s.views),
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
            tension: 0.25,
            fill: true,
            pointRadius: 2
          },
          {
            type: 'scatter',
            label: 'עדכון ופרסום מחדש',
            data: markerPoints,
            backgroundColor: '#dc2626',
            borderColor: '#dc2626',
            pointStyle: 'triangle',
            pointRadius: 9,
            pointHoverRadius: 11,
            showLine: false
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'nearest', intersect: false },
        plugins: {
          tooltip: {
            callbacks: {
              label(context) {
                if (context.dataset.label === 'עדכון ופרסום מחדש') {
                  const point = markerPoints[context.dataIndex];
                  return `עודכן ופורסם מחדש — גרסה ${point.version} (${new Date(point.date).toLocaleDateString('he-IL')})`;
                }
                return `${context.dataset.label}: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'צפיות' } }
        }
      }
    });
  })();
