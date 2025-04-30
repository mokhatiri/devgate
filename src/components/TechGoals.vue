<template>
  <div class="col-12"> <!-- Changed to full width -->
    <div class="window">
      <div class="window-header">
        <div class="window-dots">
          <span class="dot dot-red"></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
        </div>
        <h2 class="window-title">goals.md</h2>
        <AddButton @click="showAddGoalModal = true" v-if="CurrUser.uid == userId"/>
      </div>

      <div class="window-body p-4">
        <div class="goals-overview">
          <div class="goals-stats">
            <div class="stat-card">
              <h3>{{ activeGoals }}</h3>
              <p>Active Goals</p>
            </div>
            <div class="stat-card">
              <h3>{{ completedGoals }}</h3>
              <p>Completed Goals</p>
            </div>
            <div class="stat-card">
              <h3>{{ averageProgress }}%</h3>
              <p>Average Progress</p>
            </div>
          </div>

          
          <div class="goals-grid">
            <div v-for="goal in filteredGoals" 
                   :key="goal.id" 
                   class="goal-card"
                   :class="{ 
                     'completed': goal.completed,
                     'public': goal.isPublic 
                   }"
                   @click="navigateToGoalDetails(goal.id)">
              <div class="goal-header">
                <span class="goal-category" :class="getCategoryClass(goal.category)">
                  {{ goal.category }}
                </span>
                <span class="goal-status" :class="getStatusClass(goal.status)">
                  {{ goal.status }}
                </span>
                <span class="privacy-badge" :title="goal.isPublic ? 'Public Goal' : 'Private Goal'">
                  <i :class="goal.isPublic ? 'fas fa-globe' : 'fas fa-lock'"></i>
                </span>
              </div>

              <h4 class="goal-title">{{ goal.title }}</h4>
              
              <div class="goal-progress">
                <div class="progress">
                  <div class="progress-bar" 
                       :style="{ width: goal.progress + '%' }"
                       :class="getProgressClass(goal.progress)">
                  </div>
                </div>
                <span class="progress-text">{{ goal.progress }}%</span>
              </div>

              <div class="goal-footer">
                <span class="deadline">
                  <i class="fas fa-clock"></i>
                  {{ formatDeadline(goal.deadline) }}
                </span>
                <span class="streak" v-if="goal.streak > 0">
                  <i class="fas fa-fire"></i>
                  {{ goal.streak }} jours
                </span>
              </div>
            </div>
          </div>

          <div v-if="filteredGoals.length === 0" class="no-goals">
            <p v-if="props.userId === CurrUser.uid">
              You don't have any goals yet
            </p>
            <p v-else>
              No public goals available
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Goal Modal -->
    <div v-if="showAddGoalModal" class="modal-overlay" @click.self="showAddGoalModal = false">
      <div class="modal-content">
        <h3>{{ isEditing ? 'Edit' : 'Add' }} Goal</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Title</label>
            <input v-model="newGoal.title" type="text" required>
          </div>

          <div class="form-group">
            <label>Category</label>
            <select v-model="newGoal.category" required>
              <option value="learning">Learning</option>
              <option value="project">Project</option>
              <option value="certification">Certification</option>
              <option value="skill">Skill</option>
            </select>
          </div>

          <div class="form-group">
            <label>Deadline</label>
            <div class="deadline-input">
              <label class="checkbox-container">
                <input type="checkbox" v-model="hasDeadline">
                <span class="checkbox-label">Set a deadline</span>
              </label>
              <input v-if="hasDeadline" 
                     v-model="newGoal.deadline" 
                     type="date" 
                     required>
            </div>
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea v-model="newGoal.description" rows="3"></textarea>
          </div>

          <div class="form-group privacy-setting">
            <label class="toggle-container" @click="newGoal.isPublic = !newGoal.isPublic">
              <span class="toggle-label">
                <i :class="newGoal.isPublic ? 'fas fa-globe' : 'fas fa-lock'"></i>
                {{ newGoal.isPublic ? 'Public' : 'Private' }}
                <span style="font-size:x-small;">(click to change)</span>
              </span>
              <small class="privacy-hint">
                {{ newGoal.isPublic 
                   ? 'This goal will be visible to other users' 
                   : 'This goal will only be visible to you' }}
              </small>
            </label>
          </div>

          <div class="form-group">
            <label>Specific Milestones</label>
            <div class="milestones-container">
              <div v-for="(milestone, index) in newGoal.milestones" 
                   :key="index" 
                   class="milestone-item">
                <input v-model="milestone.title" placeholder="Milestone">
                <button type="button" @click="removeMilestone(index)">&times;</button>
              </div>
              <button type="button" @click="addMilestone" class="add-milestone">
                + Add Milestone
              </button>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showAddGoalModal = false">Cancel</button>
            <button type="submit">{{ isEditing ? 'Save' : 'Add' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { CurrUser } from '@/firebase';
import { updateUserSection } from '@/Functions';
import { trackGoalAddition } from '@/assets/js/activities.js';
import AddButton from './AddButton.vue';

const router = useRouter();
const props = defineProps({
  technicalGoals: {
    type: Array,
    required: true,
    default: () => []
  },
  userId: {
    type: String,
    required: true
  }
});

const showAddGoalModal = ref(false);
const isEditing = ref(false);
const hasDeadline = ref(false);
const newGoal = ref({
  title: '',
  category: 'learning',
  deadline: '',
  description: '',
  progress: 0,
  status: 'In Progress',
  streak: 0,
  milestones: [],
  notes: [],
  resources: [],
  isPublic: false,  // Add this line
});

// Computed stats
const activeGoals = computed(() => 
  props.technicalGoals.filter(goal => !goal.completed).length
);

const completedGoals = computed(() => 
  props.technicalGoals.filter(goal => goal.completed).length
);

const averageProgress = computed(() => {
  if (!props.technicalGoals.length) return 0;
  const total = props.technicalGoals.reduce((sum, goal) => sum + goal.progress, 0);
  return Math.round(total / props.technicalGoals.length);
});

const filteredGoals = computed(() => {
  return props.technicalGoals.filter(goal => {
    // Show all goals if user is viewing their own profile
    if (props.userId === CurrUser.value?.uid) return true;
    // Only show public goals for other users
    return goal.isPublic;
  });
});

// Methods
const handleSubmit = async () => {
  try {
    const goalData = {
      ...newGoal.value,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    await updateUserSection(
      CurrUser.value.uid,
      'technicalGoals',
      goalData,
      isEditing.value ? 'update' : 'add'
    );

    showAddGoalModal.value = false;
    trackGoalAddition(goalData);
    resetForm();
  } catch (error) {
    console.error('Error saving goal:', error);
  }
};

const resetForm = () => {
  newGoal.value = {
    title: '',
    category: 'learning',
    deadline: '',
    description: '',
    progress: 0,
    status: 'In Progress',
    streak: 0,
    milestones: [],
    notes: [],
    resources: [],
    isPublic: false,
  };
  hasDeadline.value = false;
  isEditing.value = false;
};

const addMilestone = () => {
  newGoal.value.milestones.push({ title: '', completed: false });
};

const removeMilestone = (index) => {
  newGoal.value.milestones.splice(index, 1);
};

const navigateToGoalDetails = (goalId) => {
  router.push({ name: 'goal-details', params: { id: goalId }});
};

// Utility functions
const formatDeadline = (deadline) => {
  if (!deadline) return 'No deadline set';
  return new Date(deadline).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const getCategoryClass = (category) => `category-${category}`;
const getStatusClass = (status) => `status-${status.toLowerCase().replace(' ', '-')}`;
const getProgressClass = (progress) => {
  if (progress >= 100) return 'bg-success';
  if (progress >= 50) return 'bg-info';
  return 'bg-primary';
};
</script>

<style scoped src="@/assets/css/windows.css"></style>
<style scoped>
.goals-overview {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.goals-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: var(--dark-bg);
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-card h3 {
  font-size: 2rem;
  color: var(--accent-color);
  margin: 0;
}

.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.goal-card {
  background: var(--dark-bg);
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.goal-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.goal-category {
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.875rem;
}

.goal-indicators {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.privacy-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: 15px;
  background: var(--dark-bg);
}

.privacy-badge i {
  font-size: 0.875rem;
}

.view-count {
  font-size: 0.75rem;
  opacity: 0.8;
}

.goal-card.public {
  position: relative;
  border: 1px solid var(--accent-color);
}

.goal-card.public::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  border-width: 0 25px 25px 0;
  border-style: solid;
  border-color: var(--accent-color) transparent;
}

.goal-status {
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.875rem;
}

.goal-title {
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: var(--text-color);
}

.goal-progress {
  margin-bottom: 1rem;
}

.goal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Category colors */
.category-learning { background: #ff38b820; color: #ff38b8; }
.category-project { background: #6464ff20; color: #6464ff; }
.category-certification { background: #38b8ff20; color: #38b8ff; }
.category-skill { background: #b8ff3820; color: #b8ff38; }

/* Status colors */
.status-en-cours { background: #ffb83820; color: #ffb838; }
.status-termine { background: #38ff7f20; color: #38ff7f; }

/* Form styling */
.form-group {
  margin-bottom: 1rem;
}

.milestones-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.milestone-item {
  display: flex;
  gap: 0.5rem;
}

.add-milestone {
  margin-top: 0.5rem;
  color: var(--accent-color);
  background: none;
  border: 1px dashed var(--accent-color);
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}

select {
  width: 100%;
  padding: 0.5rem;
  background: var(--dark-bg);
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  appearance: none;
  padding-right: 2rem;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.7rem center;
  background-size: 1em;
}

select:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 2px var(--accent-color-20);
}

select:hover {
  border-color: var(--accent-color);
}

select option {
  background: var(--dark-bg);
  color: var(--text-color);
  padding: 0.5rem;
}

.deadline-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-container input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.checkbox-label {
  color: var(--text-color);
  font-size: 0.9rem;
}

/* Update goal-footer for goals without deadline */
.goal-footer .deadline {
  color: var(--text-secondary);
  font-style: italic;
}


.privacy-setting {
  margin: 1.5rem 0;
}

.toggle-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
}

.toggle-label i {
  width: 1.2rem;
}

.privacy-hint {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-left: 2rem;
}

/* Add a visual indicator for public goals in the grid */
.goal-card.public {
  border: 1px solid var(--accent-color);
}

.goal-card .visibility-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  font-size: 0.875rem;
  opacity: 0.7;
}
</style>