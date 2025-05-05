<template>
  <div class="window">
    <div class="window-header">
      <div class="window-dots">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
      </div>
      <h2 class="window-title">Skill Matrix</h2>
      <div class="header-spacer"></div>
    </div>
    
    <div class="window-body p-4">
      <div class="skills-overview">
        <!-- Skills Distribution Chart -->
        <div class="chart-container">
          <h3 class="chart-title code-font">Skills Distribution by Level</h3>
          <div class="chart-wrapper">
            <canvas ref="skillsChart"></canvas>
          </div>
          
          <!-- Legend for the chart -->
          <div class="skill-legend">
            <div v-for="(level, index) in skillLevels" :key="index" class="legend-item">
              <div class="legend-color" :style="{ backgroundColor: levelColors[level] }"></div>
              <span class="legend-label">{{ level }} ({{ skillCounts[level] || 0 }})</span>
            </div>
          </div>
          
          <!-- Skills list by category -->
          <div class="skills-by-level">
            <div v-for="level in skillLevels" :key="level" class="level-group" :class="{ empty: !skillsByLevel[level]?.length }">
              <h4 class="level-title" :style="{ borderColor: levelColors[level] }">
                {{ level }}
              </h4>
              <div class="skill-tags">
                <span v-for="(skill, idx) in skillsByLevel[level]" :key="idx" class="skill-tag"
                      :style="{ backgroundColor: `${levelColors[level]}22`, borderColor: levelColors[level] }">
                  {{ skill.name }}
                </span>
                <span v-if="!skillsByLevel[level]?.length" class="no-skills">No skills yet</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

// Register Chart.js components properly
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const props = defineProps({
  skills: {
    type: Array,
    required: true,
    default: () => []
  }
});

const skillsChart = ref(null);
let chartInstance = null;

// Define skill levels and their colors
const skillLevels = ['Beginner', 'Intermediate', 'Advanced'];
const levelColors = {
  'Beginner': '#6464ff', // accent-secondary
  'Intermediate': '#febc2e', // yellow
  'Advanced': '#ff38b8', // accent-color
};

// Group skills by level
const skillsByLevel = computed(() => {
  const result = {};
  skillLevels.forEach(level => {
    result[level] = props.skills.filter(skill => skill.level === level);
  });
  return result;
});

// Count skills by level
const skillCounts = computed(() => {
  const counts = {};
  skillLevels.forEach(level => {
    counts[level] = skillsByLevel.value[level]?.length || 0;
  });
  return counts;
});

// Initialize and render the skills chart
const renderSkillsChart = () => {
  if (chartInstance) {
    chartInstance.destroy();
  }
  
  if (!skillsChart.value) return;
  
  const ctx = skillsChart.value.getContext('2d');
  const colors = skillLevels.map(level => levelColors[level]);
  const data = skillLevels.map(level => skillCounts.value[level] || 0);
  
  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: skillLevels,
      datasets: [{
        label: 'Number of Skills',
        data: data,
        backgroundColor: colors,
        borderColor: colors.map(color => color + '88'),
        borderWidth: 1,
        borderRadius: 6,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            color: '#a0a0a0'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          }
        },
        x: {
          ticks: {
            color: '#a0a0a0'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw || 0;
              return `${value} skill${value !== 1 ? 's' : ''}`;
            }
          }
        }
      }
    }
  });
};

// Watch for changes in skills data
watch(() => props.skills, () => {
  renderSkillsChart();
}, { deep: true });

onMounted(() => {
  renderSkillsChart();
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

.skills-overview {
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
  height: 200px;
  position: relative;
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.1));
}

.skill-legend {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 0.8rem;
  background-color: rgba(30, 30, 40, 0.3);
  border-radius: 8px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.legend-label {
  font-size: 0.9rem;
  color: var(--text-color);
  letter-spacing: 0.5px;
  font-family: 'Fira Code', monospace;
}

.skills-by-level {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 2rem;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
  padding-top: 1.5rem;
}

.level-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.level-group.empty .level-title {
  opacity: 0.6;
}

.level-title {
  font-size: 1.1rem;
  margin: 0;
  padding-bottom: 0.6rem;
  border-bottom: 2px solid;
  display: inline-block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.skill-tag {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.85rem;
  border: 1px solid;
  font-family: 'Fira Code', monospace;
  transition: all 0.2s ease;
}

.skill-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.no-skills {
  font-style: italic;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .chart-wrapper {
    height: 180px;
  }
  
  .skill-legend {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.6rem;
  }
}
</style>


