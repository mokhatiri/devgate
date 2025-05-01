<template>
  <div class="community-details-container">
    <div class="terminal-panel">
      <div class="terminal-header">
        <div class="terminal-dots">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <div class="terminal-title">community_details.json</div>
      </div>

      <div class="terminal-body">
        <div v-if="loading" class="loading-state">
          <div class="spinner-border text-accent" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2 code-comment">// Fetching community data...</p>
        </div>

        <template v-else-if="community">
          <!-- Community Image -->
          <div class="section text-center" v-if="community.photoURL">
            <img 
              :src="community.photoURL" 
              :alt="community.name"
              class="community-image mb-3"
            />
          </div>

          <!-- Community Name Section -->
          <div class="section">
            <h1 class="code-font d-flex align-items-center">
              <i class="bi bi-braces me-2"></i>
              {{ community.name }}
            </h1>
            <pre class="code-preview"><span class="code-comment">// Community Information</span>
<span class="code-keyword">const</span> community = {
  name: <span class="code-string">"{{ community.name }}"</span>,
  bio: <span class="code-string">`{{ community.bio }}`</span>,
  createdAt: <span class="code-string">"{{ formatDate(community.createdAt) }}"</span>,
  admins: {{ community.admins?.length || 0 }},
  posts: {{ community.posts?.length || 0 }}
}</pre>
          </div>

          <!-- Admins Section -->
          <div class="section">
            <h3 class="section-title code-font">
              <i class="bi bi-shield-lock me-2"></i>
              Community Admins
            </h3>
            <div class="users-grid">
              <div v-for="admin in admins" :key="admin.id" class="user-card">
                <img :src="admin.photoURL? admin.photoURL : 'https://res.cloudinary.com/duwrqxvey/image/upload/v1745689776/default-avatar-icon-of-social-media-user-vector_zoyryv.jpg'" :alt="admin.name" class="user-avatar">
                <div class="user-info">
                  <div class="user-name code-font">{{ admin.name }}</div>
                  <div class="user-handle code-comment">@{{ admin.username }}</div>
                </div>
                <div class="admin-badge">
                  <i class="bi bi-shield-fill"></i>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div v-else class="error-state code-font">
          <i class="bi bi-exclamation-triangle fs-1"></i>
          <p class="code-comment">// Community not found</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useRoute } from 'vue-router';

const loading = ref(true);
const community = ref(null);
const admins = ref([]);
const route = useRoute();

onMounted(async () => {
  try {
    const communityRef = doc(db, 'communities', route.params.id);
    const communitySnap = await getDoc(communityRef);

    if (communitySnap.exists()) {
      community.value = {
        id: communitySnap.id,
        ...communitySnap.data(),
      };

      // Fetch admins info
    for (const adminId of community.value.admins) {
        const InfoRef = await getDoc(doc(db, 'users', adminId));
        const adminData = InfoRef.data();
        if (adminData){
            admins.value.push(adminData);
        }
    }
    }
  } catch (error) {
    console.error('Error fetching community details:', error);
  } finally {
    loading.value = false;
    console.log('Admins: ', admins.value);
  }
});

function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate();
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap');

.community-details-container {
  max-width: 800px;
  width: 100%;
  height: calc(100vh - 60px);
  margin: 0 auto;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
}

.terminal-panel {
  background-color: var(--card-bg);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.terminal-header {
  background-color: var(--navbar-bg);
  padding: 8px 12px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.terminal-dots {
  display: flex;
  gap: 6px;
  margin-right: 12px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.red { background-color: #ff5f57; }
.yellow { background-color: #febc2e; }
.green { background-color: #28c840; }

.terminal-title {
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  color: var(--text-secondary);
}

.terminal-body {
  padding: 24px;
}

.section {
  margin-bottom: 32px;
}

.section-title {
  margin-bottom: 16px;
  color: var(--accent-color);
}

.code-preview {
  background-color: var(--chat-input-bg);
  padding: 16px;
  border-radius: 6px;
  font-family: 'Fira Code', monospace;
  font-size: 14px;
  margin: 16px 0;
  white-space: pre-wrap;
}

.code-keyword { color: var(--code-keyword); }
.code-string { color: var(--code-string); }
.code-comment { color: var(--code-comment); }

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.user-card {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: var(--chat-input-bg);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  position: relative;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  margin-right: 12px;
  object-fit: cover;
}

.user-info {
  flex: 1;
}

.user-name {
  font-weight: 500;
  font-size: 14px;
}

.user-handle {
  font-size: 12px;
}

.admin-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--button-gradient-bg);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
}

.community-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid var(--accent-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>