<template>
  <div>
    <div class="window">
      <div class="window-header">
        <div class="window-dots">
          <span class="dot dot-red"></span>
          <span class="dot dot-yellow"></span>
          <span class="dot dot-green"></span>
        </div>
        <h2 class="window-title">projects.js</h2>
        <div class="view-controls">
          <button @click="viewMode = 'list'" :class="{ active: viewMode === 'list' }">
            <i class="fas fa-list"></i>
          </button>
          <button @click="viewMode = 'gallery'" :class="{ active: viewMode === 'gallery' }">
            <i class="fas fa-th"></i>
          </button>
        </div>
        <AddButton @click="showModal = true" v-if="userId == CurrUser.uid"/>
      </div>

      <div class="window-body p-4">
        <div class="line-numbers">
          <div v-for="n in 12" :key="`project-line-${n}`" class="line-number">{{ n }}</div>
        </div>
        
        <div class="window-content">
          <div class="code-header">
            <span class="text-primary">export default</span> <span class="text-secondary">class</span> <span class="text-accent">Projects</span> <span class="text-primary">{</span>
          </div>
          
          <div class="projects-container" :class="viewMode">
            <div v-for="project in filteredProjects" 
                 :key="project.id" 
                 class="project-item"
                 :class="{ 'public': project.isPublic }"
                 @click="handleProjectClick(project)">
              <img v-if="project.imageUrl" :src="getImageUrl(project.imageUrl)" class="project-image" :alt="project.name">
              <div class="project-content">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="code-comment">// {{ project.name }}</span>
                  <span class="badge rounded-pill" :class="getStatusClass(project.status)">{{ project.status }}</span>
                </div>
                <div class="mb-2">
                  <span class="text-secondary">description:</span> 
                  <span class="text-accent">"{{ project.description }}"</span>
                </div>
                <div class="mb-2">
                  <span class="text-secondary">technologies:</span> 
                  <span class="text-accent">[</span>
                  <div class="tech-stack">
                    <span v-for="(tech, techIndex) in project.technologies" 
                          :key="techIndex" 
                          class="badge tech-badge">
                      {{ tech }}
                    </span>
                  </div>
                  <span class="text-accent">]</span>
                </div>
                <div v-if="project.githubUrl" class="mb-2">
                  <span class="text-secondary">github:</span>
                  <a :href="project.githubUrl" target="_blank" class="text-accent">
                    <i class="fab fa-github"></i>
                  </a>
                </div>
                <div class="privacy-indicator" :title="project.isPublic ? 'Projet public' : 'Projet privé'">
                  <i :class="project.isPublic ? 'fas fa-globe' : 'fas fa-lock'"></i>
                  <span v-if="project.isPublic" class="view-count">
                    {{ project.viewCount }} vues
                  </span>
                </div>
                <div class="like-indicator" @click="toggleLike(project, $event)" :title="isProjectLiked(project) ? 'Ne plus aimer' : 'Aimer'">
                  <i :class="isProjectLiked(project) ? 'fas fa-heart' : 'far fa-heart'"></i>
                  <span>{{ project.likes?.length || 0 }}</span>
                </div>
              </div>
              <div class="project-footer">
                <div class="project-meta">
                  <span class="project-date">
                    {{ formatDate(project.createdAt) }}
                  </span>
                  <span class="stat-item" v-if="project.isPublic">
                    <i class="fas fa-eye"></i>
                    {{ project.viewCount || 0 }} vues
                  </span>
                </div>
              </div>
            </div>
            
            <div v-if="filteredProjects.length === 0" class="no-projects">
              <i class="fas fa-folder-open"></i>
              <p v-if="props.userId === CurrUser.uid">
                Vous n'avez pas encore de projets
              </p>
              <p v-else>
                Aucun projet public disponible
              </p>
            </div>
          </div>
          
          <div class="code-footer">
            <span class="text-primary">}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Add/Edit Project Modal -->
  <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <h3>{{ isEditing ? 'Modifier' : 'Ajouter' }} un projet</h3>
      <form @submit.prevent="handleSubmit">
        <input v-model="projectData.name" 
               type="text" 
               placeholder="Titre du projet" 
               required>

        <textarea v-model="projectData.description" 
                  placeholder="Description" 
                  required></textarea>

        <div class="tech-selector">
          <label>Technologies:</label>
          <div class="selected-techs">
            <span v-for="tech in projectData.technologies" 
                  :key="tech" 
                  class="tech-tag">
              {{ tech }}
              <button type="button" @click="removeTech(tech)">&times;</button>
            </span>
          </div>
          <div class="tech-input-container">
            <input v-model="newTech" 
                   @keyup.enter.prevent="addTech"
                   @focus="showTechSuggestions = true"
                   @input="showTechSuggestions = true"
                   placeholder="Ajouter une technologie">
            <div v-if="showTechSuggestions && filteredTechnologies.length" 
                 class="tech-suggestions">
              <div v-for="tech in filteredTechnologies" 
                   :key="tech"
                   @click="selectTech(tech)"
                   class="tech-suggestion">
                {{ tech }}
              </div>
            </div>
          </div>
        </div>

        <input v-model="projectData.githubUrl" 
               type="url" 
               placeholder="Lien GitHub">

        <div class="image-upload">
          <label>Image du projet:</label>
          <input type="file" 
                 @change="handleImageSelection" 
                 color="Var(--bg-color)"
                 accept="image/*"
                 >
          <img v-if="projectData.imageUrl" 
               :src="getImageUrl(projectData.imageUrl)" 
               class="preview-image">
        </div>

        <div class="form-group privacy-setting">
          <label class="toggle-container" @click="projectData.isPublic = !projectData.isPublic">
            <span class="toggle-label">
              <i :class="projectData.isPublic ? 'fas fa-globe' : 'fas fa-lock'"></i>
              {{ projectData.isPublic ? 'Public' : 'Privé' }}
              <small>(cliquer pour changer)</small>
            </span>
            <small class="privacy-hint">
              {{ projectData.isPublic 
                 ? 'Ce projet sera visible par les autres utilisateurs' 
                 : 'Ce projet ne sera visible que par vous' }}
            </small>
          </label>
        </div>

        <div class="form-group">
          <label for="status">Statut:</label>
          <select v-model="projectData.status" id="status" required @change="handleStatusChange">
            <option v-for="status in projectStatuses" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </div>

        <div class="modal-actions">
          <button v-if="isEditing" 
                  type="button" 
                  class="btn-danger" 
                  @click="deleteProject">Supprimer</button>
          <button type="button" @click="closeModal">Annuler</button>
          <button type="submit">{{ isEditing ? 'Sauvegarder' : 'Ajouter' }}</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Project Detail Modal -->
  <div v-if="showDetailModal && selectedProject" class="modal-overlay" @click.self="showDetailModal = false">
    <div class="modal-content project-detail-modal">
      <div class="project-detail-header">
        <div class="project-title-section">
          <h2>{{ selectedProject.name }}</h2>
          <span class="badge rounded-pill" :class="getStatusClass(selectedProject.status)">
            {{ selectedProject.status }}
          </span>
        </div>
        <div class="project-meta">
          <span class="project-author">
            <i class="fas fa-user"></i> {{ selectedProject.authorName || 'Utilisateur' }}
          </span>
          <span class="project-date">
            <i class="fas fa-calendar"></i> 
            {{ new Date(selectedProject.createdAt).toLocaleDateString('fr-FR') }}
          </span>
        </div>
      </div>

      <div class="project-detail-body">
        <div v-if="selectedProject.imageUrl" class="project-detail-image">
          <img :src="getImageUrl(selectedProject.imageUrl)" :alt="selectedProject.name">
        </div>

        <div class="project-detail-content">
          <div class="detail-section">
            <h3>Description</h3>
            <p>{{ selectedProject.description }}</p>
          </div>

          <div class="detail-section">
            <h3>Technologies</h3>
            <div class="tech-stack">
              <span v-for="tech in selectedProject.technologies" 
                    :key="tech" 
                    class="tech-badge">
                {{ tech }}
              </span>
            </div>
          </div>

          <div v-if="selectedProject.githubUrl" class="detail-section">
            <h3>Dépôt GitHub</h3>
            <a :href="selectedProject.githubUrl" 
               target="_blank" 
               class="github-link">
              <i class="fab fa-github"></i>
              Voir sur GitHub
            </a>
          </div>

          <div class="project-stats">
            <div class="stat-item">
              <i class="fas fa-eye"></i>
              {{ selectedProject.viewCount || 0 }} vues
            </div>
            <div class="stat-item">
              <i class="fas fa-heart"></i>
              {{ selectedProject.likes?.length || 0 }} j'aime
            </div>
          </div>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="showDetailModal = false">Fermer</button>
        <a v-if="selectedProject.githubUrl" 
           :href="selectedProject.githubUrl" 
           target="_blank" 
           class="btn-primary">
          <i class="fab fa-github"></i>
          Voir le code
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { CurrUser } from '@/firebase';
import { updateUserSection } from '@/Functions';
import { handleImageUpload, getImageUrl } from '@/cloudinary';
import AddButton from './AddButton.vue';
import { 
  trackProjectAddition,
  trackProjectStatusChange,
  trackProjectUpdate,
  trackProjectCompletion,
  trackProjectDeletion 
} from '@/assets/js/activities';

const props = defineProps({
    projects: {
        type: Array,
        required: true,
        default: () => []
    },
    userId: {
      type: String,
      required: true
    }
});

const viewMode = ref('list');
const showModal = ref(false);
const isEditing = ref(false);
const newTech = ref('');
const showTechSuggestions = ref(false);
const showDetailModal = ref(false);
const selectedProject = ref(null);

const availableTechnologies = [
    'Vue.js', 'React', 'Angular', 'Node.js', 'Express', 
    'MongoDB', 'Firebase', 'Bootstrap', 'Tailwind CSS',
    'Python', 'Django', 'Flask', 'Java', 'Spring Boot'
];

const projectStatuses = ['En cours', 'Terminé', 'En attente'];

const projectData = ref({
    name: '',
    description: '',
    technologies: [],
    githubUrl: '',
    imageUrl: '',
    status: 'En cours',
    isPublic: false,
    viewCount: 0,
    likes: [], // Array of user IDs who liked the project
    createdAt: null,
    viewedBy: {} // Object to store user view timestamps
});

const filteredTechnologies = computed(() => {
    if (!newTech.value) return availableTechnologies;
    const input = newTech.value.toLowerCase();
    return availableTechnologies.filter(tech => 
        tech.toLowerCase().includes(input) && 
        !projectData.value.technologies.includes(tech)
    );
});

const filteredProjects = computed(() => {
  return props.projects.filter(project => {
    // Show all projects if user is viewing their own profile
    if (props.userId === CurrUser.value?.uid) return true;
    // Only show public projects for other users
    return project.isPublic;
  });
});

const isValidGitHubUrl = (url) => {
    if (!url) return true; // Empty URL is valid (optional field)
    try {
        const gitUrl = new URL(url);
        return gitUrl.hostname === 'github.com' && gitUrl.pathname.split('/').length >= 3;
    } catch {
        return false;
    }
};

const handleImageSelection = async (event) => {
    const file = event.target.files[0];
    if (file) {
        try {
            // Add loading state
            const input = event.target;
            input.disabled = true;
            const oldValue = input.value;
            
            const publicId = await handleImageUpload(file);
            projectData.value.imageUrl = publicId;
            
            // Reset loading state
            input.disabled = false;
            input.value = oldValue;
        } catch (error) {
            console.error('Error uploading image:', error);
            alert("Erreur lors du téléchargement de l'image. Veuillez réessayer.");
        }
    }
};

const addTech = () => {
    if (newTech.value && !projectData.value.technologies.includes(newTech.value)) {
        projectData.value.technologies.push(newTech.value);
        newTech.value = '';
        showTechSuggestions.value = false;
    }
};

const removeTech = (tech) => {
    projectData.value.technologies = projectData.value.technologies.filter(t => t !== tech);
};

const selectTech = (tech) => {
    projectData.value.technologies.push(tech);
    newTech.value = '';
    showTechSuggestions.value = false;
};

const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validate GitHub URL if provided
    if (projectData.value.githubUrl && !isValidGitHubUrl(projectData.value.githubUrl)) {
        alert('Le lien GitHub n\'est pas valide. Format attendu: https://github.com/username/repository');
        return;
    }
    
    try {
        const oldStatus = isEditing.value ? 
            props.projects.find(p => p.id === projectData.value.id)?.status : 
            null;

        // Add image handling code
        const imageInput = document.querySelector('input[type="file"]');
        if (imageInput && imageInput.files[0]) {
            const publicId = await handleImageUpload(imageInput.files[0]);
            projectData.value.imageUrl = publicId;
        }

        const projectWithMetadata = {
            ...projectData.value,
            userId: CurrUser.value.uid,
            createdAt: isEditing.value ? projectData.value.createdAt : new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            id: isEditing.value ? projectData.value.id : Date.now().toString()
        };

        await updateUserSection(
            CurrUser.value.uid, 
            'projects', 
            projectWithMetadata, 
            isEditing.value ? 'update' : 'add'
        );

        // Track project addition or update
        if (isEditing.value) {
            const changedFields = ['name', 'description', 'technologies', 'githubUrl', 'status']
                .filter(field => projectWithMetadata[field] !== props.projects
                    .find(p => p.id === projectData.value.id)?.[field]);
            
            if (changedFields.length > 0) {
                await trackProjectUpdate(projectWithMetadata, changedFields);
            }
        } else {
            await trackProjectAddition(projectWithMetadata);
        }

        // Track status change if applicable
        if (oldStatus && oldStatus !== projectData.value.status) {
            await trackProjectStatusChange(projectWithMetadata, oldStatus);
            
            // Track completion if new status is "Completed"
            if (projectData.value.status === 'Terminé') {
                await trackProjectCompletion(projectWithMetadata);
            }
        }
        
        closeModal();
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement du projet:', error);
        alert('Erreur lors de l\'enregistrement du projet. Veuillez réessayer.');
    }
};

const editProject = (project) => {
    projectData.value = { ...project };
    isEditing.value = true;
    showModal.value = true;
};

const deleteProject = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;
    
    try {
        // Track project deletion before removing
        await trackProjectDeletion(projectData.value);
        
        await updateUserSection(
            CurrUser.value.uid, 
            'projects', 
            projectData.value, 
            'remove'
        );
        closeModal();
    } catch (error) {
        console.error('Erreur lors de la suppression du projet:', error);
        alert('Erreur lors de la suppression du projet. Veuillez réessayer.');
    }
};

const closeModal = () => {
    showModal.value = false;
    isEditing.value = false;
    projectData.value = {
        name: '',
        description: '',
        technologies: [],
        githubUrl: '',
        imageUrl: '',
        status: 'En cours',
        isPublic: false,
        viewCount: 0,
        likes: [],
        viewedBy: {}
    };
    newTech.value = '';
    showTechSuggestions.value = false;
};

const getStatusClass = (status) => {
    switch(status) {
        case 'En cours': return 'bg-primary';
        case 'Terminé': return 'bg-success';
        case 'En attente': return 'bg-warning';
        default: return 'bg-secondary';
    }
};

const handleProjectClick = async (project) => {
  // if the userId is not passed, show nothing !
  if (props.userId === CurrUser.value?.uid) {
    editProject(project);
  } else {
    await incrementViewCount(project);
    selectedProject.value = project;
    showDetailModal.value = true;
  }
};

const incrementViewCount = async (project) => {
    if (!CurrUser.value?.uid || CurrUser.value.uid === project.userId) return;

    const userId = CurrUser.value.uid;
    const now = Date.now();
    const viewCooldown = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    // Initialize viewedBy if it doesn't exist
    const viewedBy = project.viewedBy || {};
    
    // Check if user has viewed before and if enough time has passed
    const lastViewTime = viewedBy[userId] || 0;
    if (now - lastViewTime < viewCooldown) {
        return; // Too soon to count another view
    }

    // Update the viewedBy object with current timestamp
    const updatedProject = {
        ...project,
        viewedBy: {
            ...viewedBy,
            [userId]: now
        },
        viewCount: Object.keys(viewedBy).length + (viewedBy[userId] ? 0 : 1)
    };

    await updateUserSection(project.userId, 'projects', updatedProject, 'update');
};

const toggleLike = async (project, event) => {
  event.stopPropagation(); // Prevent project card click
  if (!CurrUser.value) return;

  const userId = CurrUser.value.uid;
  const likes = project.likes || [];
  const isLiked = likes.includes(userId);

  const updatedProject = {
    ...project,
    likes: isLiked 
      ? likes.filter(id => id !== userId)
      : [...likes, userId]
  };

  await updateUserSection(project.userId, 'projects', updatedProject, 'update');
};

const isProjectLiked = (project) => {
  return project.likes?.includes(CurrUser.value?.uid) || false;
};

const handleClickOutside = (event) => {
  const inputContainer = document.querySelector('.tech-input-container');
  const suggestionBox = document.querySelector('.tech-suggestions');
  if (
    inputContainer && !inputContainer.contains(event.target) &&
    (!suggestionBox || !suggestionBox.contains(event.target))
  ) {
    showTechSuggestions.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const handleStatusChange = async (event) => {
    const newStatus = event.target.value;
    const oldStatus = props.projects.find(p => p.id === projectData.value.id)?.status;
    
    if (oldStatus && oldStatus !== newStatus) {
        projectData.value.status = newStatus;
        
        if (newStatus === 'Terminé') {
            await trackProjectCompletion(projectData.value);
        }
        
        await trackProjectStatusChange(projectData.value, oldStatus);
    }
};

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped src="@/assets/css/windows.css"></style>
<style scoped>
.projects-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
    padding: 1rem;
}

.projects-container.gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    padding: 1rem;
}

.project-item {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
    cursor: pointer;
    background: var(--dark-bg);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    position: relative;  /* Add this for absolute positioning of privacy indicator */
}

.project-item.public {
    border: 1px solid var(--accent-color);
}

.project-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* List view specific styles */
.projects-container:not(.gallery) .project-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1rem;
  }

.projects-container:not(.gallery) .project-image {    
    width: 200px;
    height: 150px;
    flex-shrink: 0;
    border-radius: 6px;
    object-fit: cover;
}

.projects-container:not(.gallery) .project-content {
    flex: 1;
    padding: 0.5rem;
}

.projects-container.gallery .project-content {
    padding: 1.5rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* Gallery view specific styles */
.projects-container.gallery .project-item {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.projects-container.gallery .project-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

/* View controls styling */
.view-controls button {
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-color);
    background: var(--dark-bg);
    color: var(--text-color);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.view-controls button.active {
    background: var(--accent-color);
    border-color: var(--accent-color);
    color: white;
}

.view-controls button:hover:not(.active) {
    background: var(--border-color);
}

.tech-stack {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.5rem 0;
}

.tech-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--dark-bg);
    color: var(--text-color);
    border: 1px solid var(--accent-color);
    border-radius: 20px;
    font-size: 0.9rem;
    margin: 0.25rem;
    transition: all 0.2s ease;
}

.tech-tag:hover {
    background: var(--accent-color);
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tech-tag button {
    background: none;
    border: none;
    color: inherit;
    font-size: 1.1rem;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
}

.tech-tag button:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
}

.selected-techs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 4px;
    min-height: 45px;
    margin-bottom: 0.5rem;
}

.tech-selector {
    margin: 1rem 0;
}

.tech-input-container {
    position: relative;
}

.tech-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1;
}

.tech-suggestion {
    padding: 0.5rem;
    cursor: pointer;
}

.tech-suggestion:hover {
    background: var(--accent-color);
}

.view-controls {
    display: flex;
    gap: 0.5rem;
    margin-right: 1rem;
}

.preview-image {
    max-width: 200px;
    max-height: 200px;
    object-fit: contain;
    margin-top: 1rem;
}

.privacy-setting {
  margin: 1.5rem 0;
  padding: 1rem;
  background: var(--dark-bg);
  border-radius: 8px;
}

.toggle-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  cursor: pointer;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toggle-label i {
  width: 1.2rem;
  color: var(--accent-color);
}

.toggle-label small {
  color: var(--text-secondary);
  margin-left: 0.5rem;
}

.privacy-hint {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-left: 2rem;
}

.privacy-indicator {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: var(--dark-bg);
  border-radius: 15px;
  font-size: 0.875rem;
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.privacy-indicator:hover {
  opacity: 1;
}

.privacy-indicator i {
  color: var(--accent-color);
}

.view-count {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

.like-indicator {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: var(--dark-bg);
  border-radius: 15px;
  font-size: 0.875rem;
  opacity: 0.8;
  transition: opacity 0.2s ease;
  cursor: pointer;
}

.like-indicator:hover {
  opacity: 1;
}

.like-indicator i {
  color: var(--accent-color);
}

/* Add to your existing styles */
.github-input-container {
    position: relative;
    margin-bottom: 1rem;
}

.github-icon {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
}

.github-error {
    color: var(--error-color);
    font-size: 0.875rem;
    margin-top: 0.25rem;
}

input.invalid {
    border-color: var(--error-color);
}

input.invalid + .github-icon {
    color: var(--error-color);
}

.github-input-container input {
    padding-right: 2.5rem;
}

.project-detail-modal {
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.project-detail-header {
  margin-bottom: 2rem;
}

.project-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.project-meta {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.project-meta i {
  margin-right: 0.5rem;
}

.project-detail-image {
  margin: -1.5rem -1.5rem 1.5rem;
  height: 300px;
  overflow: hidden;
}

.project-detail-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.project-detail-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.detail-section {
  background: var(--dark-bg);
  padding: 1.5rem;
  border-radius: 8px;
}

.detail-section h3 {
  margin-bottom: 1rem;
  color: var(--accent-color);
}

.github-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--accent-color);
  text-decoration: none;
  padding: 0.5rem 1rem;
  background: var(--dark-bg);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.github-link:hover {
  background: var(--accent-color);
  color: white;
}

.project-stats {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.tech-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: var(--accent-color-20);
  color: var(--accent-color);
  border-radius: 20px;
  font-size: 0.9rem;
  margin: 0.25rem;
}

.no-projects {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-secondary);
  text-align: center;
}

.no-projects i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.no-projects p {
  font-size: 1.1rem;
}

/* Add to existing styles */
.project-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.project-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}


.project-meta {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.project-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
