<template>
  <div>
    <div class="window">
      <div class="window-header">
        <div class="window-dots">
          <span class="dot dot-red"></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
        </div>
        <h2 class="window-title">skills.json</h2>
        <AddButton @click="showAddSkillModal = true" v-if="userId == CurrUser.uid" />
      </div>
      <div class="window-body p-4">
        <div class="line-numbers">
          <div v-for="n in 10" :key="`skill-line-${n}`" class="line-number">{{ n }}</div>
        </div>
        
        <div class="window-content">
          <div class="code-header">
            <span class="text-primary">const</span> <span class="text-secondary">mySkills</span> <span class="text-primary">=</span> <span class="text-accent">[</span>
          </div>
          
          <div class="skills-container">
            <div v-for="(skill, index) in skills" 
                 :key="index" 
                 class="skill-item mb-3"
                 @click="editSkill(skill)">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-medium">
                        <span class="text-accent">{</span> 
                        <span class="text-primary">name:</span> <span class="text-accent">"{{ skill.name }}"</span>,
                        <span class="text-primary">level:</span> <span class="text-secondary">"{{ skill.level }}"</span>,
                        <span class="text-primary">date:</span> <span class="text-secondary">"{{ skill.acquisitionDate }}"</span>
                        <span class="text-accent">}</span>{{ index < skills.length - 1 ? ',' : '' }}
                    </span>
                </div>
                <div class="skill-progress rounded">
                    <div class="skill-progress-bar rounded" :style="{ width: skill.percentage + '%' }"></div>
                </div>
            </div>
          </div>
          
          <div class="code-footer">
            <span class="text-accent">];</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Add Skill Modal -->
  <div v-if="showAddSkillModal" class="modal-overlay" @click.self="showAddSkillModal = false">
    <div class="modal-content">
      <h3>Add Skill</h3>
      <form @submit.prevent="addSkill">
        <input 
          v-model="newSkill.name" 
          type="text" 
          placeholder="Skill name" 
          required
        >
        <select 
          v-model="newSkill.level" 
          class="form-select" 
          required
        >
          <option value="" disabled>Choose level</option>
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
        <div class="modal-actions">
          <button type="button" @click="showAddSkillModal = false">Cancel</button>
          <button type="submit">Add</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Edit Skill Modal -->
  <div v-if="showEditSkillModal" class="modal-overlay" @click.self="showEditSkillModal = false">
    <div class="modal-content">
      <h3>Edit Skill</h3>
      <form @submit.prevent="updateSkill">
        <input 
          v-model="editingSkill.name" 
          type="text" 
          placeholder="Skill name" 
          required
        >
        <select 
          v-model="editingSkill.level" 
          class="form-select" 
          required
        >
          <option value="Beginner">Beginner</option>
          <option value="Intermediate">Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
        <div class="modal-actions">
          <button type="button" class="btn-danger" @click="deleteSkill">Delete</button>
          <button type="button" @click="showEditSkillModal = false">Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { defineProps, ref } from 'vue';
import { CurrUser } from '@/firebase';
import { updateUserSection } from '@/Functions';
import AddButton from './AddButton.vue';
import { 
  trackSkillProgress, 
  trackSkillAddition,
  trackSkillDeletion 
} from '@/assets/js/activities';

const props = defineProps({
    skills: {
        type: Array,
        required: true,
        default: () => []
    },
    userId: {
        type: Array,
        required: true
    }
});

const showAddSkillModal = ref(false);
const showEditSkillModal = ref(false);
const newSkill = ref({ 
    name: '', 
    level: '', 
    acquisitionDate: new Date().toISOString().split('T')[0]
});
const editingSkill = ref(null);

const calculatePercentage = (level) => {
    switch (level) {
        case 'Beginner': return 33;
        case 'Intermediate': return 66;
        case 'Advanced': return 100;
        default: return 0;
    }
};

const addSkill = async () => {
    try {
        const skillData = {
            ...newSkill.value,
            percentage: calculatePercentage(newSkill.value.level),
            id: Date.now().toString()
        };

        await updateUserSection(CurrUser.value.uid, 'skills', skillData, 'add');
        await trackSkillAddition(skillData);

        showAddSkillModal.value = false;
        newSkill.value = { 
            name: '', 
            level: '', 
            acquisitionDate: new Date().toISOString().split('T')[0]
        };
    } catch (error) {
        console.error('Error adding skill:', error);
    }
};

const editSkill = (skill) => {
    editingSkill.value = { ...skill };
    showEditSkillModal.value = true;
};

const updateSkill = async () => {
    try {
        const oldLevel = props.skills.find(s => s.id === editingSkill.value.id)?.level;
        const updatedSkill = {
            ...editingSkill.value,
            percentage: calculatePercentage(editingSkill.value.level)
        };

        await updateUserSection(CurrUser.value.uid, 'skills', updatedSkill, 'update');
        
        // Track skill progress if level changed
        if (oldLevel !== updatedSkill.level) {
            await trackSkillProgress(updatedSkill, oldLevel);
        }
        
        showEditSkillModal.value = false;
    } catch (error) {
        console.error('Error updating skill:', error);
    }
};

const deleteSkill = async () => {
    if (!confirm('Are you sure you want to delete this skill?')) return;
    
    try {
        await trackSkillDeletion(editingSkill.value);
        await updateUserSection(CurrUser.value.uid, 'skills', editingSkill.value, 'remove');
        showEditSkillModal.value = false;
    } catch (error) {
        console.error('Error deleting skill:', error);
    }
};
</script>

<style scoped src="@/assets/css/windows.css"></style>

<style scoped>
.form-select {
    width: 100%;
    padding: 8px;
    margin: 8px 0;
    background: var(--dark-bg);
    border: 1px solid var(--border-color);
    color: var(--text-color);
    border-radius: 4px;
}

.btn-danger {
    background-color: #dc3545;
    color: white;
}

.skill-item {
    cursor: pointer;
    padding: 8px;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.skill-item:hover {
    background-color: var(--dark-bg);
}

.skill-progress {
    height: 6px;
    background-color: var(--dark-bg);
    overflow: hidden;
}

.skill-progress-bar {
    height: 100%;
    background-color: var(--accent-color);
    transition: width 0.3s ease;
}
</style>