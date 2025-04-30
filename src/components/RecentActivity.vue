<template>
  <div class="col-md-6">
    <div class="window">
      <div class="window-header">
        <div class="window-dots">
          <span class="dot dot-red"></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
        </div>
        <h2 class="window-title">activity.log</h2>
        
        <!-- Activity Filters -->
        <div class="activity-filters">
          <div class="filter-select">
            <button 
              class="filter-toggle" 
              @click="showFilters = !showFilters"
              :class="{ active: selectedTypes.length < availableTypes.length }"
            >
              <i class="bi bi-funnel"></i>
              <span>{{ getFilterLabel() }}</span>
              <i class="bi bi-chevron-down"></i>
            </button>
            
            <div v-if="showFilters" class="filter-dropdown">
              <div class="filter-header">
                <span>Filtrer par type</span>
                <button class="reset-btn" @click="resetFilters">
                  <i class="bi bi-arrow-counterclockwise"></i>
                </button>
                <button class="reset-btn" @click="setfiltersTonone">
                  <i class="bi bi-x"></i>
                </button>
              </div>
              
              <div class="filter-options">
                <label v-for="type in availableTypes" 
                       :key="type" 
                       class="filter-option">
                  <input 
                    type="checkbox" 
                    :checked="selectedTypes.includes(type)"
                    @change="toggleFilter(type)"
                  >
                  <i :class="ActivityIcons[type]"></i>
                  <span>{{ formatFilterLabel(type) }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="window-body p-4">
        <div class="line-numbers">
          <div v-for="n in 10" :key="`activity-line-${n}`" class="line-number">{{ n }}</div>
        </div>
        
        <div class="window-content">
          <div class="terminal-header mb-3">
            <span class="text-primary">~/user/activities</span> 
            <span class="text-secondary">$</span> 
            <span class="text-primary">tail -f activity.log</span>
          </div>
          
          <div class="activity-container">
            <div v-for="(activity, index) in filteredActivities" 
                 :key="index" 
                 class="activity-item mb-3"
                 :class="activity.type">
              <div class="d-flex align-items-start">
                <div class="activity-timestamp text-secondary me-2">
                  [{{ formatTimestamp(activity.timestamp) }}]
                </div>
                <div class="activity-icon me-2">
                  <i :class="ActivityIcons[activity.type]"></i>
                </div>
                <div class="activity-content">
                  <div class="activity-description">{{ activity.description }}</div>
                  
                  <!-- Progress Bar for progress-type activities -->
                  <div v-if="hasProgress(activity)" class="progress-container mt-2">
                    <div class="progress">
                      <div class="progress-bar" 
                           :style="{ width: `${activity.progress}%` }"
                           :class="getProgressClass(activity)">
                        {{ activity.progress }}%
                      </div>
                    </div>
                  </div>

                  <!-- Special Achievement Display -->
                  <div v-if="isAchievement(activity)" class="achievement-badge mt-2">
                    <i class="bi bi-stars"></i>
                    {{ activity.achievementText }}
                  </div>
                </div>
              </div>
            </div>

            <div v-if="filteredActivities.length === 0" class="no-activities">
              <i class="bi bi-inbox"></i>
              <p>No activities match your filters</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ActivityType, ActivityIcons } from '@/assets/js/activities';

const props = defineProps({
  recentActivity: {
    type: Array,
    required: true,
    default: () => []
  }
});

const selectedTypes = ref(Object.values(ActivityType));
const availableTypes = Object.values(ActivityType);
const showFilters = ref(false);

const toggleFilter = (type) => {
  if (selectedTypes.value.includes(type)) {
    selectedTypes.value = selectedTypes.value.filter(t => t !== type);
  } else {
    selectedTypes.value.push(type);
  }
};

const resetFilters = () => {
  selectedTypes.value = [...availableTypes];
};

const setfiltersTonone = () => {
  selectedTypes.value = [];
};

const getFilterLabel = () => {
  if (selectedTypes.value.length === availableTypes.length) {
    return 'Tous les types';
  }
  if (selectedTypes.value.length === 0) {
    return 'Aucun filtre';
  }
  return `${selectedTypes.value.length} filtres`;
};

const formatFilterLabel = (type) => {
  return type
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const filteredActivities = computed(() => {
  return props.recentActivity
    .filter(activity => selectedTypes.value.includes(activity.type))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
});

const hasProgress = (activity) => {
  return activity.type.includes('progress') && typeof activity.progress === 'number';
};

const isAchievement = (activity) => {
  return activity.type === ActivityType.GOAL_REACHED;
};

const getProgressClass = (activity) => {
  if (activity.progress === 100) return 'bg-success';
  if (activity.progress >= 75) return 'bg-info';
  if (activity.progress >= 50) return 'bg-warning';
  return 'bg-primary';
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  });
};

onMounted(() => {
  document.addEventListener('click', (e) => {
    const filterSelect = document.querySelector('.filter-select');
    if (filterSelect && !filterSelect.contains(e.target)) {
      showFilters.value = false;
    }
  });
});

onUnmounted(() => {
  document.removeEventListener('click', () => {});
});
</script>

<style scoped src="@/assets/css/windows.css">
/* Filter styling with !important tags to ensure proper rendering */
.activity-filters {
  margin-left: auto !important;
  position: relative !important;
}

.filter-select {
  position: relative !important;
}

.filter-toggle {
  display: flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
  background: var(--dark-bg) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-color) !important;
  padding: 0.5rem 1rem !important;
  border-radius: 4px !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
}

.filter-toggle.active {
  border-color: var(--accent-color) !important;
  color: var(--accent-color) !important;
}

.filter-dropdown {
  position: absolute !important;
  top: calc(100% + 0.5rem) !important;
  right: 0 !important;
  width: 250px !important;
  background: var(--card-bg) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
  z-index: 1000 !important;
  animation: fadeIn 0.2s ease !important;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.filter-header {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  padding: 0.75rem 1rem !important;
  border-bottom: 1px solid var(--border-color) !important;
  font-weight: 500 !important;
}

.reset-btn {
  background: none !important;
  border: none !important;
  color: var(--text-secondary) !important;
  cursor: pointer !important;
  padding: 0.25rem !important;
  border-radius: 4px !important;
  transition: all 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.reset-btn:hover {
  color: var(--accent-color) !important;
  background-color: rgba(var(--accent-color-rgb), 0.1) !important;
}

.filter-options {
  max-height: 300px !important;
  overflow-y: auto !important;
  padding: 0.5rem !important;
  scrollbar-width: thin !important;
  scrollbar-color: var(--accent-color) var(--dark-bg) !important;
}

.filter-options::-webkit-scrollbar {
  width: 6px !important;
}

.filter-options::-webkit-scrollbar-track {
  background: var(--dark-bg) !important;
}

.filter-options::-webkit-scrollbar-thumb {
  background-color: var(--accent-color) !important;
  border-radius: 6px !important;
}

.filter-option {
  display: flex !important;
  align-items: center !important;
  gap: 0.75rem !important;
  padding: 0.75rem 0.5rem !important;
  cursor: pointer !important;
  border-radius: 4px !important;
  transition: all 0.2s ease !important;
  margin-bottom: 0.25rem !important;
}

.filter-option:hover {
  background: var(--dark-bg) !important;
}

.filter-option input[type="checkbox"] {
  width: 16px !important;
  height: 16px !important;
  accent-color: var(--accent-color) !important;
  cursor: pointer !important;
}

.filter-option i {
  width: 20px !important;
  color: var(--accent-color) !important;
  font-size: 1rem !important;
}

.no-activities {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 2rem !important;
  color: var(--text-secondary) !important;
  text-align: center !important;
}

.no-activities i {
  font-size: 2rem !important;
  margin-bottom: 1rem !important;
  opacity: 0.6 !important;
}

.achievement-badge {
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.5rem !important;
  background: linear-gradient(45deg, var(--accent-color), var(--accent-secondary)) !important;
  padding: 0.25rem 0.75rem !important;
  border-radius: 999px !important;
  font-size: 0.8rem !important;
  color: white !important;
  font-weight: 500 !important;
}
</style>