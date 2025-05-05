<template>
    <div class="window">
      <div class="window-header">
        <div class="window-dots">
          <span class="dot dot-red"></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
        </div>
        <h2 class="window-title">Stats</h2>
        <div class="header-spacer"></div>
      </div>
      
      <div class="window-body p-4">
        <div class="stats-overview">
          <!-- Project Status Distribution Chart -->
          <div class="chart-container">
            <h3 class="chart-title code-font">Project Status Distribution</h3>
            <div class="chart-wrapper">
              <canvas ref="projectStatusChart"></canvas>
            </div>
            <div class="chart-legend">
              <div v-for="(item, index) in statusLegendItems" :key="index" class="legend-item">
                <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
                <span class="legend-label">{{ item.label }} ({{ item.percentage }}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, computed, watch, defineProps } from 'vue';
  import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
  
  // Register Chart.js components
  Chart.register(DoughnutController, ArcElement, Tooltip, Legend);
  
  const props = defineProps({
    projects: {
      type: Array,
      required: true
    }
  });
  
  const projectStatusChart = ref(null);
  let chartInstance = null;
  
  // Project status colors
  const statusColors = {
    'Completed': '#ff38b8',      // accent-color (completed)
    'In Progress': '#6464ff',     // accent-secondary (in progress)
    'Pending': '#febc2e'    // yellow (pending)
  };
  
  // Process project data to get status counts and percentages
  const projectStatusData = computed(() => {
    const statusCounts = {
      'Completed': 0,      
      'In Progress': 0,     
      'Pending': 0    
    };
  
    // Count projects by status
    if (props.projects && props.projects.length) {
      props.projects.forEach(project => {
        if (project && project.status && statusCounts.hasOwnProperty(project.status)) {
          statusCounts[project.status]++;
        } else if (project) {
          // Handle projects with undefined or missing status
          statusCounts['Pending']++;
        }
      });
    }
  
    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0) || 1; // Avoid division by zero
    
    // Prepare data for chart
    const labels = Object.keys(statusCounts);
    const data = Object.values(statusCounts);
    const colors = labels.map(label => statusColors[label]);
    const percentages = data.map(count => Math.round((count / total) * 100));
    
    return {
      labels,
      data,
      colors,
      percentages
    };
  });
  
  // Legend items with percentages
  const statusLegendItems = computed(() => {
    return projectStatusData.value.labels.map((label, index) => ({
      label: label,
      color: projectStatusData.value.colors[index],
      percentage: projectStatusData.value.percentages[index]
    }));
  });
  
  // Initialize and render the project status chart
  const renderProjectStatusChart = () => {
    if (chartInstance) {
      chartInstance.destroy();
    }
    
    if (!projectStatusChart.value) return;
    
    const ctx = projectStatusChart.value.getContext('2d');
    const { labels, data, colors } = projectStatusData.value;
    
    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderColor: 'var(--card-bg)',
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  };
  
  // Watch for changes in project data
  watch(() => props.projects, () => {
    renderProjectStatusChart();
  }, { deep: true });
  
  // Use nextTick to ensure DOM is updated before rendering chart
  import { nextTick } from 'vue';
  
  onMounted(async () => {
    await nextTick();
    renderProjectStatusChart();
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
  
  .chart-legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1.2rem;
    padding-top: 1rem;
    border-top: 1px dashed rgba(255, 255, 255, 0.1);
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 1rem;
    border-radius: 6px;
    background-color: rgba(30, 30, 40, 0.3);
    transition: all 0.25s ease;
    border: 1px solid transparent;
  }
  
  .legend-item:hover {
    background-color: var(--card-bg);
    border-color: var(--accent-secondary);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
  
  .legend-color {
    width: 14px;
    height: 14px;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }
  
  .legend-label {
    font-size: 0.9rem;
    font-family: 'Fira Code', monospace;
    color: var(--text-color);
    font-weight: 500;
    letter-spacing: 0.5px;
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
    
    .chart-legend {
      flex-direction: column;
      align-items: center;
      gap: 0.8rem;
    }
    
    .legend-item {
      width: 100%;
      justify-content: center;
    }
  }
  </style>