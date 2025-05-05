<template>
  <div class="window">
    <div class="window-header">
      <div class="window-dots">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
      </div>
      <h2 class="window-title">progress.js</h2>
      <div class="header-spacer"></div>
    </div>

    <div class="window-body p-4">
      <div class="stats-overview">
        <div class="chart-container">
          <h3 class="chart-title code-font">Skills Progress by Month</h3>
          <div class="chart-wrapper">
            <canvas ref="skillProgressChart"></canvas>
          </div>
          <div class="chart-info">
            <div class="info-item">
              <div class="info-label">Total Skills Added:</div>
              <div class="info-value">{{ totalSkillsAdded }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Most Active Month:</div>
              <div class="info-value">{{ mostActiveMonth }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { Chart, BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { ActivityType } from '@/assets/js/activities';

// Register Chart.js components
Chart.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const props = defineProps({
  recentActivity: {
    type: Array,
    required: true,
    default: () => []
  }
});

const skillProgressChart = ref(null);
let chartInstance = null;

// Process activity data to get skills added by month
const skillsByMonth = computed(() => {
  const months = {};
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Filter activities for skill additions
  const skillActivities = props.recentActivity.filter(activity => 
    activity.type === ActivityType.SKILL_ADD || activity.type === ActivityType.SKILL_PROGRESS
  );
  
  // Group by month
  skillActivities.forEach(activity => {
    const date = new Date(activity.timestamp);
    const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    
    if (!months[monthYear]) {
      months[monthYear] = 0;
    }
    months[monthYear]++;
  });
  
  // Sort months chronologically
  const sortedMonths = Object.entries(months)
    .map(([monthYear, count]) => {
      const [month, year] = monthYear.split(' ');
      return { monthYear, count, month, year: parseInt(year), monthIndex: monthNames.indexOf(month) };
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthIndex - b.monthIndex;
    });
    
  return {
    labels: sortedMonths.map(item => item.monthYear),
    data: sortedMonths.map(item => item.count),
    months: sortedMonths
  };
});

// Statistics
const totalSkillsAdded = computed(() => {
  if (!skillsByMonth.value.data.length) return 0;
  return skillsByMonth.value.data.reduce((sum, count) => sum + count, 0);
});

const mostActiveMonth = computed(() => {
  if (!skillsByMonth.value.months.length) return 'None';
  
  const maxIndex = skillsByMonth.value.data.indexOf(Math.max(...skillsByMonth.value.data));
  return skillsByMonth.value.labels[maxIndex] || 'None';
});

// Initialize and render the skills progress chart
const renderSkillsProgressChart = () => {
  if (chartInstance) {
    chartInstance.destroy();
  }
  
  if (!skillProgressChart.value) return;
  
  const ctx = skillProgressChart.value.getContext('2d');
  const { labels, data } = skillsByMonth.value;
  
  // Generate gradient for bars
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(100, 100, 255, 0.8)');
  gradient.addColorStop(1, 'rgba(255, 56, 184, 0.6)');
  
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Skills Added',
        data,
        backgroundColor: gradient,
        borderColor: 'rgba(100, 100, 255, 0.8)',
        borderWidth: 1,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(255, 56, 184, 0.8)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(30, 30, 40, 0.9)',
          titleFont: {
            family: "'Fira Code', monospace",
            size: 14
          },
          bodyFont: {
            family: "'Fira Code', monospace",
            size: 13
          },
          padding: 12,
          borderColor: 'rgba(100, 100, 255, 0.8)',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              const value = context.raw;
              return `Skills: ${value}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            font: {
              family: "'Fira Code', monospace"
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          }
        },
        x: {
          ticks: {
            font: {
              family: "'Fira Code', monospace"
            },
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
};

// Watch for changes in activity data
watch(() => props.recentActivity, () => {
  renderSkillsProgressChart();
}, { deep: true });

// Initialize chart when component is mounted
onMounted(() => {
  renderSkillsProgressChart();
});
</script>

<style scoped>
.window {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.window:hover {
  transform: translateY(-5px);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.3);
}

.window-header {
  display: flex;
  align-items: center;
  padding: 0.8rem 1.2rem;
  background: linear-gradient(to right, var(--dark-bg), var(--card-bg));
  border-bottom: 1px solid var(--border-color);
}

.window-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.dot:hover {
  transform: scale(1.2);
  filter: brightness(1.2);
}

.dot-red {
  background-color: #ff5f57;
  box-shadow: 0 0 0 1px #ec4c48;
}

.dot-yellow {
  background-color: #febc2e;
  box-shadow: 0 0 0 1px #e0a631;
}

.dot-green {
  background-color: #28c840;
  box-shadow: 0 0 0 1px #24b33c;
}

.window-title {
  flex: 1;
  text-align: center;
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  background: linear-gradient(45deg, var(--accent-color), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.header-spacer {
  width: 42px; /* To balance the window dots */
}

.window-body {
  background-color: var(--dark-bg);
  position: relative;
}

.window-body::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}

.stats-overview {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.chart-container {
  background: linear-gradient(145deg, var(--dark-bg), var(--card-bg));
  border-radius: 12px;
  padding: 1.8rem;
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.chart-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.chart-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent-color), var(--accent-secondary));
  border-radius: 2px;
}

.chart-title {
  text-align: center;
  margin-bottom: 1.8rem;
  color: var(--text-color);
  font-size: 1.25rem;
  position: relative;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.chart-title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  width: 80px;
  height: 3px;
  background: linear-gradient(90deg, var(--accent-color), var(--accent-secondary));
  transform: translateX(-50%);
  border-radius: 3px;
  box-shadow: 0 2px 10px rgba(100, 100, 255, 0.3);
}

.chart-wrapper {
  height: 250px;
  position: relative;
  margin-bottom: 2rem;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.1));
}

.chart-info {
  display: flex;
  justify-content: space-around;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
  padding-top: 1.5rem;
  margin-top: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem;
  background: rgba(30, 30, 40, 0.4);
  border-radius: 8px;
  min-width: 30%;
}

.info-label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-family: 'Fira Code', monospace;
}

.info-value {
  font-weight: bold;
  font-size: 1.2rem;
  color: var(--accent-color);
}

.code-font {
  font-family: 'Fira Code', monospace;
}

@media (max-width: 768px) {
  .window-title {
    font-size: 1.2rem;
  }
  
  .chart-container {
    padding: 1.2rem;
  }
  
  .chart-wrapper {
    height: 200px;
  }
  
  .chart-info {
    flex-direction: column;
    gap: 1rem;
  }
  
  .info-item {
    width: 100%;
  }
}
</style>
