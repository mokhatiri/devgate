<template>
  <div class="dashboard-container">
    <div class="window">
      <div class="window-header">
        <div class="window-dots">
          <span class="dot dot-red"></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
        </div>
        <h2 class="window-title">{{ goal?.title || 'Goal' }}</h2>
      </div>

      <div class="window-body">
        <div v-if="goal" class="goal-details">
          <!-- Header Section -->
          <div class="goal-header-section">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <span class="goal-category" :class="getCategoryClass(goal.category)">
                  {{ goal.category }}
                </span>
                <div class="title-container">
                  <div v-if="!isEditingTitle" class="title-display">
                    <h1 class="goal-title mt-2">{{ goal.title }}</h1>
                    <button class="edit-title-btn" @click="startEditingTitle">
                      <i class="fas fa-edit"></i>
                    </button>
                  </div>
                  <div v-else class="title-edit">
                    <input
                      type="text"
                      v-model="editedTitle"
                      class="title-input"
                      ref="titleInput"
                      @keyup.enter="saveTitle"
                      @keyup.esc="cancelEditTitle"
                    >
                    <div class="title-actions">
                      <button class="save-title-btn" @click="saveTitle">
                        <i class="fas fa-check"></i>
                      </button>
                      <button class="cancel-title-btn" @click="cancelEditTitle">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="goal-actions">
                <button @click="deleteGoal" class="btn-action">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>

            <!-- Progress Section -->
            <div class="progress-section mt-4">
              <div class="progress-header">
                <h3>Progression</h3>
                <div class="progress-controls">
                  <button @click="decrementProgress" class="progress-btn">-</button>
                  <div class="progress-input-wrapper">
                    <input
                      type="number"
                      v-model.number="progressValue"
                      min="0"
                      max="100"
                      @blur="setExactProgress"
                      class="progress-input"
                    />
                    <span class="progress-symbol">%</span>
                  </div>
                  <button @click="incrementProgress" class="progress-btn">+</button>
                </div>
              </div>
              <div class="progress rounded">
                <div class="progress-bar" 
                     :style="{ width: goal.progress + '%' }"
                     :class="getProgressClass(goal.progress)">
                </div>
              </div>
            </div>
          </div>

          <!-- Main Content -->
          <div class="goal-content mt-4">
            <div class="row">
              <!-- Left Column -->
              <div class="col-md-8">
                <!-- Description -->
                <section class="content-section">
                  <h3 class="section-title">Description</h3>
                  <p class="section-text">{{ goal.description }}</p>
                </section>

                <!-- Milestones -->
                <section class="content-section">
                  <h3 class="section-title">Steps</h3>
                  <div class="milestones-list">
                    <div v-for="(milestone, index) in goal.milestones" 
                         :key="index"
                         class="milestone-item">
                      <div class="milestone-checkbox">
                        <input type="checkbox" 
                               :id="`milestone-${index}`"
                               v-model="milestone.completed"
                               @change="updateMilestone(index)">
                        <label :for="`milestone-${index}`" 
                               :class="{ 'completed': milestone.completed }">
                          {{ milestone.title }}
                        </label>
                      </div>
                      <div class="milestone-date" v-if="milestone.date">
                        {{ formatDate(milestone.date) }}
                      </div>
                    </div>
                    <div class="add-milestone">
                      <form @submit.prevent="addMilestone" class="milestone-form">
                        <input type="text" 
                               v-model="newMilestone" 
                               placeholder="Add a step..."
                               class="milestone-input">
                        <button type="submit" class="add-btn">
                          <i class="fas fa-plus"></i>
                        </button>
                      </form>
                    </div>
                  </div>
                </section>

                <!-- Notes -->
                <section class="content-section">
                  <h3 class="section-title">Notes</h3>
                  <div class="notes-container">
                    <div v-for="(note, index) in goal.notes" 
                         :key="index"
                         class="note-item">
                      <div class="note-header">
                        <span class="note-date">{{ formatDate(note.date) }}</span>
                        <button @click="deleteNote(index)" class="btn-delete-note">
                          <i class="fas fa-times"></i>
                        </button>
                      </div>
                      <p class="note-content">{{ note.content }}</p>
                    </div>
                    
                    <!-- Add Note Form -->
                    <form @submit.prevent="addNote" class="add-note-form">
                      <textarea v-model="newNote" 
                                placeholder="Add a note..."
                                rows="3"
                                class="note-textarea"></textarea>
                      <button type="submit" class="add-btn">Add</button>
                    </form>
                  </div>
                </section>
              </div>

              <!-- Right Column -->
              <div class="col-md-4">
                <!-- Status Card -->
                <div class="info-card">
                  <div class="info-item">
                    <span class="info-label">Status</span>
                    <div class="status-selector">
                      <select 
                        v-model="goal.status"
                        @change="updateStatus($event.target.value)"
                        class="status-select"
                      >
                        <option 
                          v-for="option in statusOptions"
                          :key="option.value"
                          :value="option.value"
                          :class="option.class"
                        >
                          {{ option.value }}
                        </option>
                      </select>
                    </div>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Deadline</span>
                    <span class="deadline">{{ formatDeadline(goal.deadline) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Streak</span>
                    <div class="streak-display">
                      <i class="fas fa-fire streak-icon"></i>
                      <span class="streak-count">{{ goal.streak }}</span>
                      <span class="streak-label">days</span>
                      <div class="streak-info" v-if="goal.streak > 0">
                        <i class="fas fa-info-circle"></i>
                        <span>Last activity: {{ formatDate(goal.lastActivity) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Last activity</span>
                    <span class="last-activity">{{ formatDate(goal.lastActivity || new Date()) }}</span>
                  </div>
                </div>

                <!-- Resources -->
                <div class="content-section mt-4">
                  <h3 class="section-title">Resources</h3>
                  <div class="resources-list">
                    <div v-for="(resource, index) in goal.resources" 
                         :key="index"
                         class="resource-item">
                      <div class="resource-icon">
                        <i :class="getResourceIcon(resource.type)"></i>
                      </div>
                      <div class="resource-content">
                        <span class="resource-title">{{ resource.title }}</span>
                        <span v-if="resource.url" class="resource-url">
                          <a :href="resource.url" target="_blank">
                            <i class="fas fa-external-link-alt"></i>
                          </a>
                        </span>
                      </div>
                      <button @click="deleteResource(index)" class="btn-delete-resource">
                        <i class="fas fa-times"></i>
                      </button>
                    </div>
                    
                    <!-- Add Resource Form -->
                    <form @submit.prevent="addResource" class="add-resource-form">
                      <div class="form-row">
                        <input v-model="newResource.title" 
                               placeholder="Resource title"
                               class="resource-input"
                               required>
                        <select v-model="newResource.type" class="resource-type-select">
                          <option value="url">URL</option>
                          <option value="book">Book</option>
                          <option value="course">Course</option>
                          <option value="video">Video</option>
                          <option value="document">Document</option>
                          <option value="person">Person</option>
                        </select>
                      </div>
                      <div class="form-row" v-if="newResource.type === 'url'">
                        <input v-model="newResource.url" 
                               placeholder="URL"
                               type="url"
                               class="resource-input">
                      </div>
                      <div class="form-row" v-else-if="newResource.type === 'book'">
                        <input v-model="newResource.author" 
                               placeholder="Author"
                               class="resource-input">
                      </div>
                      <div class="form-row" v-else-if="newResource.type === 'person'">
                        <input v-model="newResource.contact" 
                               placeholder="Contact"
                               class="resource-input">
                      </div>
                      <div class="form-row" v-else>
                        <input v-model="newResource.description" 
                               placeholder="Description"
                               class="resource-input">
                      </div>
                      <button type="submit" class="add-btn">Add</button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CurrUser } from '@/firebase';
import { updateUserSection } from '@/Functions';
import { 
  trackGoalAchievement, 
  trackGoalMilestone, 
  trackStreakAchievement,
  trackGoalUpdate,
  trackGoalDeletion 
} from '@/assets/js/activities';

const route = useRoute();
const router = useRouter();
const goal = ref(null);
const newNote = ref('');
const newMilestone = ref('');
const progressValue = ref(0);
const newResource = ref({ 
  title: '', 
  type: 'url',
  url: '' 
});

const lastManualProgress = ref(0);
const isEditingTitle = ref(false);
const editedTitle = ref('');
const titleInput = ref(null);

const lastCheckDate = ref(null);
const canUpdateStreak = ref(false);

const statusOptions = [
  { value: 'Not Started', class: 'status-not-started' },
  { value: 'In Progress', class: 'status-in-progress' },
  { value: 'On Hold', class: 'status-on-hold' },
  { value: 'Completed', class: 'status-completed' }
];

const updateStatus = async (newStatus) => {
  const oldStatus = goal.value.status;
  if (newStatus === 'Completed') {
    goal.value.completedAt = new Date().toISOString();
    goal.value.progress = 100;
    progressValue.value = 100;
    
    if (goal.value.milestones?.length > 0) {
      goal.value.milestones = goal.value.milestones.map(m => ({
        ...m,
        completed: true
      }));
    }
    
    // Track goal achievement when completed
    await trackGoalAchievement(goal.value);
  }
  
  goal.value.status = newStatus;
  await updateGoal();
  
  // Track status change
  await trackGoalUpdate(goal.value, ['status']);
};

onMounted(() => {
  const goalId = route.params.id;
  const foundGoal = CurrUser.value.technicalGoals?.find(g => g.id === goalId);
  if (foundGoal) {
    goal.value = foundGoal;
    
    // Initialize with default values if they don't exist
    if (!goal.value.streak) goal.value.streak = 0;
    if (!goal.value.lastActivity) goal.value.lastActivity = new Date().toISOString();
    if (!goal.value.notes) goal.value.notes = [];
    if (!goal.value.resources) goal.value.resources = [];
    if (!goal.value.milestones) goal.value.milestones = [];
    
    // Set initial progress values
    progressValue.value = goal.value.progress;
    lastManualProgress.value = goal.value.progress;
    
    // Check if all milestones are completed to show 100% without saving
    if (goal.value.milestones.length > 0 && 
        goal.value.milestones.every(m => m.completed)) {
      progressValue.value = 100;
    }
    
    // Check streak
    checkStreak();
  } else {
    router.push('/'); // Could add a toast/alert: 'Goal not found'
  }
});

// Streak handling
const checkStreak = () => {
  if (!goal.value.lastActivity) return;
  
  const lastActivity = new Date(goal.value.lastActivity);
  const today = new Date();
  
  // Reset hours to compare dates only
  lastActivity.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today - lastActivity;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // If more than 1 day has passed, reset streak
  if (diffDays > 1) {
    goal.value.streak = 0;
    goal.value.streakBrokenAt = today.toISOString();
    updateGoal();
  } else if (diffDays === 1) {
    // Allow streak update if exactly 1 day has passed
    canUpdateStreak.value = true;
  }
  
  lastCheckDate.value = today;
};

const updateStreakOnActivity = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (!lastCheckDate.value || !canUpdateStreak.value) return;
  
  if (canUpdateStreak.value) {
    goal.value.streak++;
    goal.value.lastActivity = today.toISOString();
    canUpdateStreak.value = false;
    await updateGoal();
    
    // Track streak achievements
    await trackStreakAchievement(goal.value);
  }
};

// Progress methods
const incrementProgress = async () => {
  if (goal.value.progress < 100) {
    goal.value.progress += 5;
    progressValue.value = goal.value.progress;
    await updateGoal();
  }
};

const decrementProgress = async () => {
  if (goal.value.progress > 0) {
    goal.value.progress -= 5;
    progressValue.value = goal.value.progress;
    await updateGoal();
  }
};

const setExactProgress = async () => {
  if (progressValue.value < 0) progressValue.value = 0;
  if (progressValue.value > 100) progressValue.value = 100;
  
  const oldProgress = goal.value.progress;
  goal.value.progress = progressValue.value;
  await updateGoal();
  
  // Track significant progress changes
  if (Math.abs(oldProgress - goal.value.progress) >= 10) {
    await trackGoalUpdate(goal.value, ['progress']);
  }
  
  // Check if completed
  if (goal.value.progress === 100) {
    await updateStatus('Completed');
  }
};

// Keep progressValue in sync with goal.progress
watch(() => goal.value?.progress, (newVal) => {
  if (newVal !== undefined) {
    progressValue.value = newVal;
  }
});

// Milestones methods
const addMilestone = async () => {
  if (!newMilestone.value.trim()) return;
  
  goal.value.milestones = goal.value.milestones || [];
  goal.value.milestones.push({
    title: newMilestone.value,
    completed: false,
    date: new Date().toISOString()
  });
  
  await updateGoal();
  newMilestone.value = '';
};

const updateMilestone = async (index) => {
  const milestone = goal.value.milestones[index];
  await updateGoal();
  
  if (milestone.completed) {
    await trackGoalMilestone(goal.value, milestone);
    
    // Check if all milestones are completed
    const allCompleted = goal.value.milestones.every(m => m.completed);
    if (allCompleted) {
      await updateStatus('Completed');
    }
  }
};

// Notes methods
const addNote = async () => {
  if (!newNote.value.trim()) return;
  
  goal.value.notes = goal.value.notes || [];
  goal.value.notes.unshift({
    content: newNote.value,
    date: new Date().toISOString()
  });
  
  // Update last activity
  goal.value.lastActivity = new Date().toISOString();
  
  await updateGoal();
  newNote.value = '';
};

const deleteNote = async (index) => {
  goal.value.notes.splice(index, 1);
  await updateGoal();
};

// Resources methods
const addResource = async () => {
  if (!newResource.value.title) return;
  
  goal.value.resources = goal.value.resources || [];
  goal.value.resources.push({...newResource.value});
  
  await updateGoal();
  newResource.value = { title: '', type: 'url', url: '' };
};

const deleteResource = async (index) => {
  goal.value.resources.splice(index, 1);
  await updateGoal();
};

// Update methods
const updateGoal = async () => {
  try {
    // Update last activity timestamp
    goal.value.lastActivity = new Date().toISOString();
    
    await updateUserSection(
      CurrUser.value.uid,
      'technicalGoals',
      goal.value,
      'update'
    );
  } catch (error) {
    console.error('Error updating goal:', error);
  }
};

// Edit and Delete
const editGoal = () => {
  alert('Goal editing to be implemented');
};

const deleteGoal = async () => {
  if (confirm('Are you sure you want to delete this goal?')) {
    try {
      // Track goal deletion before removing
      await trackGoalDeletion(goal.value);
      
      await updateUserSection(
        CurrUser.value.uid,
        'technicalGoals',
        goal.value.id,
        'remove',
        'id'
      );
      router.push('/');
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  }
};

// Title editing methods
const startEditingTitle = () => {
  editedTitle.value = goal.value.title;
  isEditingTitle.value = true;
  // Focus the input after render
  nextTick(() => {
    titleInput.value?.focus();
  });
};

const saveTitle = async () => {
  if (editedTitle.value.trim()) {
    const oldTitle = goal.value.title;
    goal.value.title = editedTitle.value.trim();
    await updateGoal();
    
    // Track title update
    await trackGoalUpdate(goal.value, ['title']);
    isEditingTitle.value = false;
  }
};

const cancelEditTitle = () => {
  isEditingTitle.value = false;
};

// Utility methods
const formatDate = (date) => {
  if (!date) return 'Unknown date';
  return new Date(date).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDeadline = (deadline) => {
  if (!deadline) return 'No deadline set';
  
  const deadlineDate = new Date(deadline);
  const today = new Date();
  
  const diffTime = deadlineDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let remainingText = '';
  if (diffDays < 0) {
    remainingText = ` (${Math.abs(diffDays)} days overdue)`;
  } else if (diffDays === 0) {
    remainingText = ' (today)';
  } else if (diffDays === 1) {
    remainingText = ' (tomorrow)';
  } else {
    remainingText = ` (in ${diffDays} days)`;
  }
  
  return new Date(deadline).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) + remainingText;
};

const getCategoryClass = (category) => {
  if (!category) return 'category-default';
  return `category-${category.toLowerCase().replace(/\s+/g, '-')}`;
};

const getStatusClass = (status) => {
  if (!status) return 'status-default';
  return `status-${status.toLowerCase().replace(/\s+/g, '-')}`;
};

const getProgressClass = (progress) => {
  if (progress >= 100) return 'bg-success';
  if (progress >= 50) return 'bg-info';
  return 'bg-primary';
};

const getResourceIcon = (type) => {
  switch(type) {
    case 'url': return 'fas fa-link';
    case 'book': return 'fas fa-book';
    case 'course': return 'fas fa-graduation-cap';
    case 'video': return 'fas fa-video';
    case 'document': return 'fas fa-file-alt';
    case 'person': return 'fas fa-user';
    default: return 'fas fa-link';
  }
};

// Add these new methods
const calculateProgress = () => {
  if (goal.value.milestones?.length > 0) {
    const completedCount = goal.value.milestones.filter(m => m.completed).length;
    return Math.round((completedCount / goal.value.milestones.length) * 100);
  }
  return goal.value.progress;
};

const checkCompletion = async () => {
  const isComplete = goal.value.progress === 100 && 
    (!goal.value.milestones?.length || 
     goal.value.milestones.every(m => m.completed));
  
  if (isComplete && goal.value.status !== 'Completed') {
    await updateStatus('Completed');
  }
};

// Add watchers for automatic updates
watch(() => goal.value?.milestones, async () => {
  if (goal.value) {
    const progress = calculateProgress();
    if (progress !== goal.value.progress) {
      goal.value.progress = progress;
      progressValue.value = progress;
      await updateGoal();
    }
    await checkCompletion();
  }
}, { deep: true });

// Add watchers for automatic streak updates
watch(
  [
    () => goal.value?.progress,
    () => goal.value?.milestones,
    () => goal.value?.notes
  ],
  async () => {
    if (goal.value) {
      await updateStreakOnActivity();
    }
  },
  { deep: true }
);
</script>

<style scoped src="@/assets/css/windows.css"></style>
<style scoped>
.goal-details {
  max-width: 1200px;
  margin: 0 auto;
}

.window-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.goal-header-section {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
}

.content-section {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
}

.goal-title {
  font-size: 1.75rem;
  margin: 0;
  color: var(--text-color);
  font-weight: 600;
}

.section-title {
  color: var(--text-color);
  font-size: 1.25rem;
  margin-bottom: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-text {
  color: var(--text-secondary);
  line-height: 1.6;
}

/* Category styles */
.goal-category {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  background: var(--accent-color);
  color: white;
}

.category-technical { background: var(--accent-color); }
.category-personal { background: var(--accent-secondary); }
.category-professional { background: #50C878; }
.category-learning { background: #FF8C00; }
.category-default { background: var(--button-bg); }

/* Progress section styling */
.progress-section {
  margin-top: 1.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.progress-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: var(--accent-color);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.progress-btn:hover {
  transform: scale(1.1);
  background: var(--accent-secondary);
}

.progress-input-wrapper {
  position: relative;
  width: 60px;
}

.progress-input {
  width: 100%;
  text-align: center;
  padding: 0.25rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--dark-bg);
  color: var(--text-color);
}

.progress-symbol {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.progress {
  height: 10px;
  border-radius: 5px;
  background-color: var(--strength-meter-bg);
  margin-top: 0.5rem;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  transition: width 0.3s ease;
}

/* Status styles */
.goal-status {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  background: var(--dark-bg);
}

.status-completed { 
  background: #50C878; 
  color: white;
}

.status-in-progress { 
  background: var(--accent-color); 
  color: white;
}

.status-on-hold { 
  background: #FF8C00; 
  color: white;
}

.status-not-started { 
  background: var(--text-secondary); 
  color: white;
}

.status-default { 
  background: var(--button-bg); 
  color: var(--text-color);
}

.status-select {
  width: 100%;
  padding: 0.5rem;
  border-radius: 4px;
  background: var(--dark-bg);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  cursor: pointer;
}

.status-select option {
  padding: 0.5rem;
}

.status-select option.status-completed {
  color: #50C878;
}

.status-select option.status-in-progress {
  color: var(--accent-color);
}

.status-select option.status-on-hold {
  color: #FF8C00;
}

.status-select option.status-not-started {
  color: var(--text-secondary);
}

.completion-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #50C878;
  color: white;
  border-radius: 20px;
  font-size: 0.9rem;
  margin-top: 1rem;
}

.completion-badge i {
  font-size: 1.1rem;
}

/* Info card styling */
.info-card {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.deadline {
  color: var(--text-color);
}

/* Streak styling */
.streak-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.streak-icon {
  color: #FF8C00;
}

.streak-count {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.streak-label {
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.streak-info {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.streak-info i {
  color: var(--accent-color);
}

/* Milestone styling */
.milestones-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.milestone-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-radius: 4px;
  background: var(--dark-bg);
  transition: all 0.2s ease;
}

.milestone-item:hover {
  background: var(--card-hover-bg);
}

.milestone-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.milestone-checkbox input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
  background-color: var(--dark-bg);
  border: 1px solid var(--accent-color);
  border-radius: 3px;
}

.milestone-checkbox input[type="checkbox"]:checked {
  background-color: var(--accent-color);
  border-color: var(--accent-color);
}

.milestone-checkbox label {
  cursor: pointer;
  color: var(--text-color);
  margin: 0;
}

.milestone-checkbox label.completed {
  text-decoration: line-through;
  color: var(--text-secondary);
}

.milestone-date {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.add-milestone {
  margin-top: 0.5rem;
}

.milestone-form {
  display: flex;
  gap: 0.5rem;
}

.milestone-input {
  flex: 1;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--dark-bg);
  color: var(--text-color);
}

/* Notes styling */
.notes-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.note-item {
  background: var(--dark-bg);
  padding: 1rem;
  border-radius: 4px;
  border-left: 3px solid var(--accent-color);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.note-date {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.note-content {
  color: var(--text-color);
  line-height: 1.5;
  white-space: pre-line;
}

.btn-delete-note {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.85rem;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-delete-note:hover {
  background: var(--error-color);
  color: white;
}

.add-note-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.note-textarea {
  width: 100%;
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--dark-bg);
  color: var(--text-color);
  resize: vertical;
}

/* Resources styling */
.resources-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--dark-bg);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.resource-item:hover {
  background: var(--card-hover-bg);
}

.resource-icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--accent-secondary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.resource-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.resource-title {
  color: var(--text-color);
  font-size: 0.9rem;
  font-weight: 500;
}

.resource-url {
  color: var(--accent-color);
}

.resource-url a {
  color: inherit;
  text-decoration: none;
}

.btn-delete-resource {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.85rem;
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

/* Title styling */
.title-container {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.title-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.edit-title-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.2s ease;
}

.title-display:hover .edit-title-btn {
  opacity: 1;
}

.title-edit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.title-input {
  font-size: 1.75rem;
  font-weight: 600;
  background: var(--dark-bg);
  border: 2px solid var(--accent-color);
  border-radius: 4px;
  color: var(--text-color);
  padding: 0.25rem 0.5rem;
  width: 100%;
}

.title-actions {
  display: flex;
  gap: 0.25rem;
}

.save-title-btn,
.cancel-title-btn {
  background: none;
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-title-btn {
  background: var(--accent-color);
  color: white;
}

.save-title-btn:hover {
  background: var(--accent-secondary);
}

.cancel-title-btn {
  background: var(--dark-bg);
  color: var(--text-secondary);
}

.cancel-title-btn:hover {
  background: var(--error-color);
  color: white;
}

.streak-info {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.streak-info i {
  color: var(--accent-color);
}

</style>