<template>
  <div class="edit-community-container" v-if="community">
    <div class="terminal-panel">
      <!-- Terminal Header -->
      <div class="terminal-header">
        <div class="terminal-dots">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <div class="terminal-title">editCommunity.js</div>
      </div>

      <!-- Terminal Body -->
      <div class="terminal-body">
        <div class="code-section mb-4">
          <div class="code-line">
            <span class="code-keyword">const</span> <span class="code-variable">community</span> = <span class="code-function">edit</span>({
          </div>
          <div class="code-block">
            <div class="d-flex align-items-center mb-3">
              <span class="code-property">id:</span>
              <span class="code-string ms-2">"{{ community.id }}"</span>
            </div>
            
            <!-- Community Name -->
            <div class="form-group mb-4">
              <label class="code-comment mb-2">// Community Name</label>
              <div class="d-flex">
                <span class="code-property">name:</span>
                <div class="flex-grow-1 ms-2">
                  <input 
                    type="text" 
                    class="form-control code-input" 
                    v-model="formData.name" 
                    placeholder="Community Name"
                  />
                </div>
              </div>
            </div>
            
            <!-- Community Bio -->
            <div class="form-group mb-4">
              <label class="code-comment mb-2">// Community Bio</label>
              <div class="d-flex">
                <span class="code-property">bio:</span>
                <div class="flex-grow-1 ms-2">
                  <textarea 
                    class="form-control code-input" 
                    v-model="formData.bio" 
                    rows="3" 
                    placeholder="Community Bio"
                  ></textarea>
                </div>
              </div>
            </div>

            <!-- Add Community Image -->
            <div class="form-group mb-4">
              <label class="code-comment mb-2">// Community Image</label>
              <div class="d-flex">
                <span class="code-property">image:</span>
                <div class="flex-grow-1 ms-2">
                  <div class="image-upload-container">
                    <img 
                      v-if="formData.photoURL"
                      :src="formData.photoURL" 
                      class="community-image mb-2" 
                      alt="Community"
                    />
                    <input 
                      type="file" 
                      accept="image/*"
                      class="form-control code-input" 
                      @change="handleImageUpload"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Admin Management Section -->
        <div class="section-divider">
          <span class="code-comment">/* Admin Management */</span>
        </div>

        <div class="admins-section mb-4">
          <h3 class="code-section-title">
            <i class="bi bi-shield-lock me-2"></i>
            <span class="code-function">manageAdmins</span>()
          </h3>
          
          <div class="admins-list mb-3">
            <div v-if="admins.length === 0" class="code-comment">// No admins found</div>
            <div v-else class="admin-item" v-for="admin in admins" :key="admin.id">
              <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                  <img 
                    :src="admin.photoURL? admin.photoURL : 'https://res.cloudinary.com/duwrqxvey/image/upload/v1745689776/default-avatar-icon-of-social-media-user-vector_zoyryv.jpg'" 
                    class="admin-avatar" 
                    alt="Admin" 
                  />
                  <div>
                    <div class="admin-name code-font">{{ admin.username || admin.name }}</div>
                    <div class="code-comment">// {{ admin.email }}</div>
                  </div>
                </div>
                
                <button 
                  class="btn btn-terminal-danger btn-sm" 
                  @click="removeAdmin(admin)"
                  v-if="auth.currentUser.uid !== admin.id"
                >
                  <i class="bi bi-person-x me-1"></i>
                  <span class="code-font">removeAdmin()</span>
                </button>
                <span v-else class="owner-badge">
                  <i class="bi bi-star-fill me-1"></i> You
                </span>
              </div>
            </div>
          </div>
          
          <!-- Add Admin Section -->
          <div class="add-admin mt-4">
            <div class="code-comment mb-2">// Add a new admin</div>
            <div class="input-group">
              <input 
                type="text" 
                class="form-control code-input" 
                v-model="adminSearchQuery" 
                placeholder="Search by username..."
                @input="searchAdminUsers"
              />
              <button 
                class="btn btn-terminal" 
                type="button" 
                :disabled="!adminSearchQuery"
                @click="searchAdminUsers"
              >
                <i class="bi bi-search me-1"></i>
                <span class="code-font">search()</span>
              </button>
            </div>
            
            <!-- Search Results -->
            <div v-if="adminSearchResults.length > 0" class="search-results mt-2">
              <div class="code-comment mb-2">// Search results</div>
              <div class="search-results-container">
                <div 
                  v-for="user in adminSearchResults" 
                  :key="user.id" 
                  class="search-result-item"
                  @click="selectAdminUser(user)"
                >
                  <div class="d-flex align-items-center">
                    <img 
                      :src="user.photoURL? user.photoURL : 'https://res.cloudinary.com/duwrqxvey/image/upload/v1745689776/default-avatar-icon-of-social-media-user-vector_zoyryv.jpg'" 
                      class="search-avatar" 
                      alt="User" 
                    />
                    <div>
                      <div class="user-info code-font">{{ user.username || user.name }}</div>
                      <div class="code-comment">// {{ user.email }}</div>
                    </div>
                  </div>

                  <button class="btn btn-sm btn-terminal-accent">
                    <i class="bi bi-plus-circle me-1"></i>
                    <span class="code-font">select()</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div v-if="adminError" class="error-message mt-2">{{ adminError }}</div>
          </div>
        </div>

        <!-- Banned Users Management -->
        <div class="section-divider">
          <span class="code-comment">/* Banned Users */</span>
        </div>

        <div class="banned-users-section mb-4">
          <h3 class="code-section-title">
            <i class="bi bi-person-slash me-2"></i>
            <span class="code-function">manageBannedUsers</span>()
          </h3>
          
          <div class="banned-users-list mb-3">
            <div v-if="bannedUsers.length === 0" class="code-comment">// No banned users</div>
            <div v-else class="banned-user-item" v-for="user in bannedUsers" :key="user.id">
              <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                  <img 
                    :src="user.photoURL? user.photoURL : 'https://res.cloudinary.com/duwrqxvey/image/upload/v1745689776/default-avatar-icon-of-social-media-user-vector_zoyryv.jpg'" 
                    class="user-avatar" 
                    alt="User" 
                  />
                  <div>
                    <div class="user-name code-font">{{ user.username || user.name }}</div>
                    <div class="code-comment">// {{ user.email }}</div>
                  </div>
                </div>
                
                <button 
                  class="btn btn-terminal-accent btn-sm" 
                  @click="unbanUser(user)"
                >
                  <i class="bi bi-person-check me-1"></i>
                  <span class="code-font">unban()</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Ban User Section -->
          <div class="ban-user mt-4">
            <div class="code-comment mb-2">// Ban a user</div>
            <div class="input-group">
              <input 
                type="text" 
                class="form-control code-input" 
                v-model="banSearchQuery" 
                placeholder="Search by username..."
                @input="searchBanUsers"
              />
              <button 
                class="btn btn-terminal" 
                type="button" 
                :disabled="!banSearchQuery"
                @click="searchBanUsers"
              >
                <i class="bi bi-search me-1"></i>
                <span class="code-font">search()</span>
              </button>
            </div>
            
            <!-- Ban Search Results -->
            <div v-if="banSearchResults.length > 0" class="search-results mt-2">
              <div class="code-comment mb-2">// Search results</div>
              <div class="search-results-container">
                <div 
                  v-for="user in banSearchResults" 
                  :key="user.id" 
                  class="search-result-item"
                  @click="selectBanUser(user)"
                >
                  <div class="d-flex align-items-center">
                    <img 
                      :src="user.photoURL? user.photoURL : 'https://res.cloudinary.com/duwrqxvey/image/upload/v1745689776/default-avatar-icon-of-social-media-user-vector_zoyryv.jpg'" 
                      class="search-avatar" 
                      alt="User" 
                    />
                    <div>
                      <div class="user-info code-font">{{ user.username || user.name }}</div>
                      <div class="code-comment">// {{ user.email }}</div>
                    </div>
                  </div>

                  <button class="btn btn-sm btn-terminal-danger">
                    <i class="bi bi-ban me-1"></i>
                    <span class="code-font">select()</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div v-if="banError" class="error-message mt-2">{{ banError }}</div>
          </div>
        </div>
        
        <!-- Danger Zone -->
        <div class="section-divider danger">
          <span class="code-comment">/* DANGER ZONE */</span>
        </div>
        
        <div class="danger-zone">
          <h3 class="code-section-title text-danger">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <span class="code-function">dangerZone</span>()
          </h3>
          
          <div class="danger-actions">
            <div class="code-comment mb-3">// These actions cannot be undone</div>
            
            <button 
              class="btn btn-danger mb-3" 
              @click="showDeleteModal = true"
            >
              <i class="bi bi-trash3 me-2"></i>
              <span class="code-font">deleteCommunity()</span>
            </button>
            
            <div class="code-comment">
              // Deleting this community will permanently remove all posts and data
            </div>
          </div>
        </div>
      </div>
      
      <!-- Terminal Footer -->
      <div class="terminal-footer">
        <button class="btn btn-link code-font" @click="cancel">
          <i class="bi bi-x-circle me-1"></i> cancel()
        </button>
        <button class="btn btn-primary save-btn" @click="saveChanges" :disabled="isSaving">
          <i class="bi bi-save me-1"></i>
          <span class="code-font">{{ isSaving ? 'saving()...' : 'saveChanges()' }}</span>
        </button>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div class="modal" tabindex="-1" :class="{'show d-block': showDeleteModal}">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content terminal-panel">
          <div class="terminal-header">
            <div class="terminal-dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="terminal-title">confirmDelete.js</div>
          </div>
          <div class="modal-body p-4">
            <h4 class="code-font text-danger mb-3">
              <i class="bi bi-exclamation-triangle-fill me-2"></i>
              Delete Community
            </h4>
            <p class="code-font">Are you sure you want to delete <strong>{{ community.name }}</strong>?</p>
            <div class="code-comment mb-4">
              // This action cannot be undone. All posts, comments, and data will be permanently deleted.
            </div>
            
            <div class="confirmation-input mb-3">
              <label class="code-comment mb-2">// Type "{{ community.name }}" to confirm</label>
              <input 
                type="text" 
                class="form-control code-input" 
                v-model="deleteConfirmation" 
                placeholder="Community name"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button 
              type="button" 
              class="btn btn-terminal" 
              @click="showDeleteModal = false"
            >
              <i class="bi bi-x-circle me-1"></i>
              <span class="code-font">cancel()</span>
            </button>
            <button 
              type="button" 
              class="btn btn-danger" 
              :disabled="deleteConfirmation !== community.name || isDeleting"
              @click="deleteCommunity"
            >
              <i class="bi bi-trash3 me-1"></i>
              <span class="code-font">{{ isDeleting ? 'deleting()...' : 'confirm()' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal Backdrop -->
    <div class="modal-backdrop fade show" v-if="showDeleteModal"></div>
  </div>
  
  <div v-else class="loading-container code-font">
    <div class="spinner-border text-accent" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
    <p class="mt-3 code-comment">// Loading community data...</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, auth, CurrUser } from '@/firebase';
import { handleImageUpload as uploadToCloudinary, getImageUrl } from '@/cloudinary';

const emit = defineEmits(['close', 'updated', 'deleted']);

// Router
const router = useRouter();

//Route
const route = useRoute();

// State
const community = ref(null);
const formData = ref({
  name: '',
  bio: '',
  photoURL: '',
  updatedAt: null
});

//Functions
import { getAccountInfo } from '@/Functions';

const currentUser = CurrUser;
const admins = ref([]);
const bannedUsers = ref([]);
const loading = ref(true);
const isSaving = ref(false);
const isDeleting = ref(false);
const showDeleteModal = ref(false);
const unsubscribeHandlers = ref([]);


// Form inputs
const adminSearchQuery = ref('');
const banSearchQuery = ref('');
const adminSearchResults = ref([]);
const banSearchResults = ref([]);
const adminError = ref('');
const banError = ref('');
const deleteConfirmation = ref('');

// Check if current user is an admin of this community




// Fetch community data
async function fetchCommunity() {
  try {
    loading.value = true;
    const communityRef = doc(db, 'communities', route.params.id);
    const communitySnap = await getDoc(communityRef);
    
    if (communitySnap.exists()) {
      community.value = {
        id: communitySnap.id,
        ...communitySnap.data()
      };
      
      // Initialize form data
      formData.value = {
        name: community.value.name || '',
        bio: community.value.bio || '',
        photoURL: community.value.photoURL || ''
      };
      
      // Fetch admin users
      await fetchAdmins();
      
      // Fetch banned users
      await fetchBannedUsers();
    } else {
      console.error('Community not found!');
      emit('close');
    }
  } catch (error) {
    console.error('Error fetching community:', error);
  } finally {
    loading.value = false;
  }
}

// Watch for changes in communityId
watch(() => route.params.id, () => {
  fetchCommunity();
}, { immediate: true });

watch(admins , (newAdmins) =>{
  if (newAdmins.length > 0) {
    console.log("newAdmins : " , newAdmins , "And auth id : " , auth.currentUser.uid)
    const IsPermitted = newAdmins.some(admin => admin.id === auth.currentUser.uid);
    if (!IsPermitted){
      router.push('/explore');
    }    
  }
})

// Fetch admin user details
async function fetchAdmins() {
  if (!community.value || !community.value.admins) return;
  
  try {
    const adminData = [];
    
    for (const adminId of community.value.admins) {
      const userRef = doc(db, 'users', adminId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        adminData.push({
          id: userSnap.id,
          ...userSnap.data()
        });
        
      }
    }
    
    admins.value = adminData;
    if (admins.photoURL)
    console.log('Admins:', admins.value);
  } catch (error) {
    console.error('Error fetching admins:', error);
  }
}

// Fetch banned user details
async function fetchBannedUsers() {
  if (!community.value || !community.value.bannedUsers) return;
  
  try {
    const bannedData = [];
    
    for (const userId of community.value.bannedUsers || []) {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        bannedData.push({
          id: userSnap.id,
          ...userSnap.data()
        });
      }
    }
    
    bannedUsers.value = bannedData;
  } catch (error) {
    console.error('Error fetching banned users:', error);
  }
}

// Save changes
async function saveChanges() {  
  try {
    isSaving.value = true;
    
    // Update timestamp
    formData.value.updatedAt = serverTimestamp();
    
    // Update the community
    const communityRef = doc(db, 'communities', route.params.id);
    await updateDoc(communityRef, formData.value);
    
    alert('It has been updated successfully!')
    // Display success toast or notification here if you have one
  } catch (error) {
    alert('Something went wrong.')
    // Display error toast or notification here if you have one
  } finally {
    isSaving.value = false;
  }
}

// Cancel and close
function cancel() {
  emit('close');
}

// Search for users to add as admin
async function searchAdminUsers() {
  if (!adminSearchQuery.value.trim()) {
    adminSearchResults.value = [];
    return;
  }
  
  try {
    adminError.value = '';
    
    // Query users collection by username
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('username', '>=', adminSearchQuery.value.trim()),
      where('username', '<=', adminSearchQuery.value.trim() + '\uf8ff'),
      limit(5)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      adminError.value = 'No users found with this username';
      adminSearchResults.value = [];
      return;
    }
    
    const results = [];
    querySnapshot.forEach(doc => {
      // Filter out existing admins
      if (!community.value.admins?.includes(doc.id)) {
        results.push({
          id: doc.id,
          ...doc.data()
        });
      }
    });
    
    adminSearchResults.value = results;
    
    if (results.length === 0) {
      adminError.value = 'No eligible users found';
    }
  } catch (error) {
    console.error('Error searching users:', error);
    adminError.value = 'Error searching users';
    adminSearchResults.value = [];
  }
}

// Select a user to add as admin
async function selectAdminUser(user) {
  if (!community.value) return;
  
  try {
    adminError.value = '';
    
    // Check if user is already an admin
    if (community.value.admins?.includes(user.id)) {
      adminError.value = 'This user is already an admin';
      return;
    }
    
    // Add user to admins array
    const communityRef = doc(db, 'communities', route.params.id);
    await updateDoc(communityRef, {
      admins: arrayUnion(user.id)
    });
    
    // Refresh admins list
    community.value.admins = [...(community.value.admins || []), user.id];
    await fetchAdmins();
    
    // Clear search
    adminSearchQuery.value = '';
    adminSearchResults.value = [];
  } catch (error) {
    console.error('Error adding admin:', error);
    adminError.value = 'Failed to add admin. Please try again.';
  }
}

// Remove admin
async function removeAdmin(admin) {
  if (!community.value || admin.id === currentUser.value.uid) return;
  
  try {
    // Remove user from admins array
    const communityRef = doc(db, 'communities', route.params.id);
    await updateDoc(communityRef, {
      admins: arrayRemove(admin.id)
    });
    
    // Refresh admins list
    community.value.admins = community.value.admins.filter(id => id !== admin.id);
    await fetchAdmins();
  } catch (error) {
    console.error('Error removing admin:', error);
    // Display error toast
  }
}

// Search for users to ban
async function searchBanUsers() {
  if (!banSearchQuery.value.trim()) {
    banSearchResults.value = [];
    return;
  }
  
  try {
    banError.value = '';
    
    // Query users collection by username
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('username', '>=', banSearchQuery.value.trim()),
      where('username', '<=', banSearchQuery.value.trim() + '\uf8ff'),
      limit(5)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      banError.value = 'No users found with this username';
      banSearchResults.value = [];
      return;
    }
    
    const results = [];
    querySnapshot.forEach(doc => {
      // Filter out admins and already banned users
      if (!community.value.admins?.includes(doc.id) && 
          !community.value.bannedUsers?.includes(doc.id)) {
        results.push({
          id: doc.id,
          ...doc.data()
        });
      }
    });
    
    banSearchResults.value = results;
    
    if (results.length === 0) {
      banError.value = 'No eligible users found';
    }
  } catch (error) {
    console.error('Error searching users:', error);
    banError.value = 'Error searching users';
    banSearchResults.value = [];
  }
}

// Select a user to ban
async function selectBanUser(user) {
  if (!community.value) return;
  
  try {
    banError.value = '';
    
    // Check if user is an admin
    if (community.value.admins?.includes(user.id)) {
      banError.value = 'Cannot ban an admin user';
      return;
    }
    
    // Check if user is already banned
    if (community.value.bannedUsers?.includes(user.id)) {
      banError.value = 'This user is already banned';
      return;
    }
    
    // Add user to banned array
    const communityRef = doc(db, 'communities', route.params.id);
    await updateDoc(communityRef, {
      bannedUsers: arrayUnion(user.id)
    });
    
    // Refresh banned users list
    community.value.bannedUsers = [...(community.value.bannedUsers || []), user.id];
    await fetchBannedUsers();
    
    // Clear search
    banSearchQuery.value = '';
    banSearchResults.value = [];
  } catch (error) {
    console.error('Error banning user:', error);
    banError.value = 'Failed to ban user. Please try again.';
  }
}

// Unban user
async function unbanUser(user) {
  if (!community.value) return;
  
  try {
    // Remove user from banned array
    const communityRef = doc(db, 'communities', route.params.id);
    await updateDoc(communityRef, {
      bannedUsers: arrayRemove(user.id)
    });
    
    // Refresh banned users list
    community.value.bannedUsers = community.value.bannedUsers.filter(id => id !== user.id);
    await fetchBannedUsers();
  } catch (error) {
    console.error('Error unbanning user:', error);
    // Display error toast
  }
}

// Delete community
async function deleteCommunity() {
  if (deleteConfirmation.value !== community.value.name) return;
  
  try {
    isDeleting.value = true;
    
    // In a real app, you would also need to clean up related data
    // Such as deleting all posts, comments, etc.
    
    // Delete the community document
    await deleteDoc(doc(db, 'communities', route.params.id));
    
    // Close modal and redirect
    showDeleteModal.value = false;
    emit('deleted', route.params.id);
    router.push('/explore');
  } catch (error) {
    console.error('Error deleting community:', error);
    // Display error toast
  } finally {
    isDeleting.value = false;
  }
}

// Handle image upload
async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const publicId = await uploadToCloudinary(file);
    formData.value.photoURL = getImageUrl(publicId);
  } catch (error) {
    console.error('Error uploading image:', error);
    alert('Failed to upload image. Please try again.');
  }
}
</script>

<style scoped>
/* Import monospace font for code */
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap');

.edit-community-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - var(--navbar-height));
  width: 100%;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

/* Terminal panel styling */
.terminal-panel {
  background-color: var(--card-bg);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  width: 100%;
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

.terminal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--navbar-bg);
}

/* Code styling */
.code-font {
  font-family: 'Fira Code', monospace !important;
  font-size: 14px;
}

.code-keyword {
  color: #ff79c6;
  font-family: 'Fira Code', monospace;
}

.code-variable {
  color: #8be9fd;
  font-family: 'Fira Code', monospace;
}

.code-function {
  color: #50fa7b;
  font-family: 'Fira Code', monospace;
}

.code-string {
  color: #f1fa8c;
  font-family: 'Fira Code', monospace;
}

.code-property {
  color: #bd93f9;
  font-family: 'Fira Code', monospace;
}

.code-comment {
  color: var(--code-comment);
  font-family: 'Fira Code', monospace;
  font-size: 12px;
}

.code-section {
  border-radius: 6px;
  padding: 16px;
  background-color: var(--input-bg);
  border: 1px solid var(--border-color);
}

.code-line {
  margin-bottom: 10px;
}

.code-block {
  padding-left: 20px;
  border-left: 2px solid var(--border-color);
}

.code-section-title {
  font-family: 'Fira Code', monospace;
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--text-color);
  display: flex;
  align-items: center;
}

/* Form controls */
.code-input {
  background-color: var(--chat-input-bg);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  font-family: 'Fira Code', monospace;
  transition: all 0.2s;
}

.code-input:focus {
  background-color: var(--input-focus-bg);
  border-color: var(--accent-color);
  box-shadow: 0 0 0 0.2rem var(--input-focus-shadow);
  color: var(--text-color);
}

/* Section dividers */
.section-divider {
  margin: 30px 0;
  text-align: center;
  position: relative;
  overflow: hidden;
  color: var(--text-secondary);
}

.section-divider::before,
.section-divider::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background-color: var(--border-color);
}

.section-divider::before {
  left: 0;
}

.section-divider::after {
  right: 0;
}

.section-divider.danger::before,
.section-divider.danger::after {
  background-color: var(--danger-color);
}

/* Admin sections */
.admins-section,
.banned-users-section,
.danger-zone {
  background-color: var(--input-bg);
  border-radius: 6px;
  padding: 20px;
  border: 1px solid var(--border-color);
  margin-bottom: 24px;
}

.admin-item,
.banned-user-item {
  background-color: var(--chat-input-bg);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.admin-item:hover,
.banned-user-item:hover {
  background-color: var(--input-focus-bg);
}

.admin-avatar,
.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
  border: 2px solid var(--accent-color);
}

.admin-name,
.user-name {
  font-weight: 500;
  color: var(--text-color);
}

.owner-badge {
  background-color: rgba(255, 188, 46, 0.2);
  color: #febc2e;
  padding: 4px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  font-size: 12px;
  font-family: 'Fira Code', monospace;
}

/* Search results */
.search-results-container {
  max-height: 250px;
  overflow-y: auto;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.search-result-item {
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background-color: var(--input-focus-bg);
}

.search-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.user-info {
  font-size: 13px;
  color: var(--text-color);
}

.error-message {
  color: var(--danger-color);
  font-size: 12px;
  font-family: 'Fira Code', monospace;
}

/* Danger zone */
.danger-zone {
  border-color: rgba(255, 95, 87, 0.3);
  background-color: rgba(255, 95, 87, 0.05);
}

/* Button styles */
.btn-terminal {
  background-color: var(--button-bg);
  border-color: var(--border-color);
  color: var(--text-color);
  transition: all 0.2s;
}

.btn-terminal:hover {
  background-color: var(--button-hover-bg);
  color: var(--text-color);
}

.btn-terminal-accent {
  background-color: var(--accent-color);
  border-color: var(--accent-color);
  color: var(--button-text);
}

.btn-terminal-accent:hover {
  background-color: var(--accent-hover-color);
  border-color: var(--accent-hover-color);
  color: var(--button-text);
}

.btn-terminal-danger {
  background-color: rgba(255, 95, 87, 0.2);
  border-color: rgba(255, 95, 87, 0.3);
  color: #ff5f57;
}

.btn-terminal-danger:hover {
  background-color: rgba(255, 95, 87, 0.3);
  border-color: rgba(255, 95, 87, 0.4);
  color: #ff5f57;
}

.save-btn {
  background-color: var(--accent-color);
  border-color: var(--accent-color);
  color: var(--button-text);
}

.save-btn:hover {
  background-color: var(--accent-hover-color);
  border-color: var(--accent-hover-color);
}

/* Modal styling */
.modal-content {
  border: none;
}

.confirmation-input {
  margin-top: 20px;
}

/* Loading container */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  width: 100%;
}

/* Community image styles */
.community-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid var(--border-color);
}

.image-upload-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

/* Light mode specific colors */
@media (prefers-color-scheme: light) {
  :root {
    --card-bg: #ffffff;
    --navbar-bg: #f5f5f5;
    --border-color: #e0e0e0;
    --text-color: #333333;
    --text-secondary: #555555;
    --input-bg: #f9f9f9;
    --input-focus-bg: #ffffff;
    --chat-input-bg: #f5f5f5;
    --button-bg: #f0f0f0;
    --button-hover-bg: #e8e8e8;
    --button-text: #ffffff;
    --accent-color: #6366f1;
    --accent-hover-color: #4f46e5;
    --danger-color: #ef4444;
    --input-focus-shadow: rgba(99, 102, 241, 0.25);
    --code-comment: #6b7280;
  }
  
  /* Code styling for light mode */
  .code-keyword {
    color: #d946ef;
  }
  
  .code-variable {
    color: #0ea5e9;
  }
  
  .code-function {
    color: #10b981;
  }
  
  .code-string {
    color: #ca8a04;
  }
  
  .code-property {
    color: #8b5cf6;
  }
  
  .code-comment {
    color: #64748b;
  }
  
  .section-divider {
    color: #64748b;
  }
  
  .owner-badge {
    background-color: rgba(234, 179, 8, 0.2);
    color: #b45309;
  }
  
  .btn-terminal-danger {
    background-color: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
  
  .danger-zone {
    border-color: rgba(239, 68, 68, 0.3);
    background-color: rgba(239, 68, 68, 0.05);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .edit-community-container {
    padding: 10px;
    min-height: calc(100vh - 80px);
  }
  
  .terminal-body {
    padding: 16px;
  }
  
  .terminal-footer {
    padding: 12px 16px;
  }
  
  .code-block {
    padding-left: 10px;
  }
  
  .admin-item,
  .banned-user-item,
  .search-result-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .admin-item > div:last-child,
  .banned-user-item > div:last-child,
  .search-result-item > button {
    margin-top: 10px;
    align-self: flex-end;
  }
}

/* Dark mode specific adjustments */
@media (prefers-color-scheme: dark) {
  .dot.red { box-shadow: 0 0 5px rgba(255, 95, 87, 0.5); }
  .dot.yellow { box-shadow: 0 0 5px rgba(254, 188, 46, 0.5); }
  .dot.green { box-shadow: 0 0 5px rgba(40, 200, 64, 0.5); }
  
  .code-input {
    background-color: var(--input-bg);
  }
  
  .code-input:focus {
    background-color: var(--input-focus-bg);
  }
}
</style>