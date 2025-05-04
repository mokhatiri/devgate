<template>
    <div class="terminal-panel profile-card mb-4">
      <!-- Banner Section -->
      <div class="profile-banner" :style="bannerStyle">
        <button 
          v-if="isCurrentUser" 
          class="settings-btn"
          @click="toggleEditMode"
          title="Profile Settings"
        >
          <i class="bi" :class="editMode ? 'bi-x-lg' : 'bi-gear'"></i>
        </button>
        
        <!-- Banner Upload Button (Only in Edit Mode) -->
        <div v-if="editMode" class="banner-upload-btn" @click="triggerImageUpload('banner')">
          <i class="bi bi-image me-1"></i> Change Banner
        </div>
        
        <!-- Banner Upload Progress Indicator -->
        <div v-if="uploadProgress.banner > 0 && uploadProgress.banner < 100" class="banner-upload-progress">
          <div class="progress">
            <div class="progress-bar" 
                 :style="{ width: `${uploadProgress.banner}%` }" 
                 :class="getUploadProgressClass(uploadProgress.banner)">
              {{ uploadProgress.banner }}%
            </div>
          </div>
        </div>
        
        <!-- Add Friend Button (Only show if not current user and not in edit mode) -->
        <button 
          v-if="Notfriend && !editMode" 
          class="add-friend-btn"
          @click="addFriend"
          title="Add Friend"
        >
          <i class="bi bi-person-plus-fill me-2"></i>
          <span>Add Friend</span>
        </button>
      </div>
  
      <!-- Profile Information -->
      <div class="profile-content">
        <div class="profile-image-container">
          <img :src="userData.photoURL || defaultAvatar" alt="Profile" class="profile-image" />
          <div v-if="editMode" class="image-upload-overlay" @click="triggerImageUpload('profile')">
            <i class="bi bi-camera-fill"></i>
            <span>Change</span>
          </div>
          
          <!-- Profile Image Upload Progress -->
          <div v-if="uploadProgress.profile > 0 && uploadProgress.profile < 100" class="profile-upload-progress">
            <svg class="circular-progress" viewBox="0 0 36 36">
              <path class="circle-bg"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path class="circle"
                :stroke-dasharray="`${uploadProgress.profile}, 100`"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" class="percentage">{{ uploadProgress.profile }}%</text>
            </svg>
          </div>
        </div>
  
        <!-- User Information Section -->
        <div class="user-info">
          <div v-if="!editMode">
            <h2 class="profile-name code-font">{{ userData.name || 'Loading...' }}</h2>
            <div class="profile-username code-comment">@{{ userData.username || 'username' }}</div>
            <div class="profile-bio">{{ userData.bio || 'No bio available' }}</div>
            
            <div class="profile-stats">
              <div class="stat-item">
                <i class="bi bi-calendar3"></i>
                <span>Joined: {{ formatDate(userData.createdAt) }}</span>
              </div>
              <div v-if="userData.location" class="stat-item">
                <i class="bi bi-geo-alt"></i>
                <span>{{ userData.location }}</span>
              </div>
            </div>
          </div>
  
          <!-- Edit Mode Form -->
          <div v-else class="edit-form">
            <div class="form-group">
              <label class="code-comment mb-1">// Name</label>
              <input type="text" class="form-control code-input" v-model="editedUser.name" placeholder="Your name">
            </div>
            
            <div class="form-group">
              <label class="code-comment mb-1">// Bio</label>
              <textarea class="form-control code-input" v-model="editedUser.bio" rows="2" placeholder="Bio"></textarea>
            </div>
            
            <div class="form-group">
              <label class="code-comment mb-1">// Location</label>
              <input type="text" class="form-control code-input" v-model="editedUser.location" placeholder="Your location">
            </div>
  
            <div class="d-flex justify-content-between mt-3">
              <button class="btn btn-sm btn-terminal" @click="toggleEditMode">
                <span class="code-font">cancel()</span>
              </button>
              <button class="btn btn-sm save-btn" @click="saveUserProfile">
                <span class="code-font">save()</span>
              </button>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Hidden File Inputs -->
      <input 
        type="file" 
        ref="profileImageInput" 
        @change="handleImageUpload('profile')" 
        accept="image/*" 
        style="display: none"
      />
      <input 
        type="file" 
        ref="bannerImageInput" 
        @change="handleImageUpload('banner')" 
        accept="image/*" 
        style="display: none"
      />
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import { db, auth } from '@/firebase';
  import { arrayUnion, doc, getDoc, updateDoc} from 'firebase/firestore';
  import { handleImageUpload as uploadToCloudinary, getImageUrl } from "@/cloudinary";
  
  const props = defineProps({
    userId: {
      type: String,
      required: true
    }
  });
  
  // Default profile values
  const defaultAvatar = 'https://res.cloudinary.com/duwrqxvey/image/upload/v1745689776/default-avatar-icon-of-social-media-user-vector_zoyryv.jpg';
  const defaultBanner = '#181818'; // Dark background if no banner
  
  // State variables
  const userData = ref({});
  const editMode = ref(false);
  const editedUser = ref({});
  const isLoading = ref(true);
  
  // Refs for file inputs
  const profileImageInput = ref(null);
  const bannerImageInput = ref(null);
  
  // Upload progress tracking
  const uploadProgress = ref({
    profile: 0,
    banner: 0
  });
  
  // Computed properties
  const isCurrentUser = computed(() => {
    return auth.currentUser && auth.currentUser.uid === props.userId;
  });

  const Notfriend = computed(() =>{
      return !isCurrentUser.value && !userData.value.friends?.includes(auth.currentUser.uid);

  })
  
  const bannerStyle = computed(() => {
    if (userData.value && userData.value.bannerURL) {
      return { backgroundImage: `url(${userData.value.bannerURL})` };
    }
    return { backgroundColor: defaultBanner };
  });
  
  // Watch for changes in userId prop
  watch(() => props.userId, async (newId) => {
    if (newId) {
      await fetchUserData(newId);
    }
  }, { immediate: true });
  
  // Methods
  async function fetchUserData(userId) {
    isLoading.value = true;
    try {
      const userRef = doc(db, "users", userId);
      const userSnapshot = await getDoc(userRef);
      
      if (userSnapshot.exists()) {
        userData.value = {
          id: userSnapshot.id,
          ...userSnapshot.data(),
          photoURL: userSnapshot.data().photoURL || defaultAvatar
        };
      } else {
        console.error("User not found");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      isLoading.value = false;
    }
  }
  
  function toggleEditMode() {
    if (editMode.value) {
      // Closing edit mode - discard changes
      editMode.value = false;
    } else {
      // Entering edit mode - initialize form with current data
      editedUser.value = { ...userData.value };
      editMode.value = true;
    }
  }
  
  async function saveUserProfile() {
    if (!isCurrentUser.value) return;
    
    try {
      const userRef = doc(db, "users", props.userId);
      
      // Only update fields that are in editedUser and different from userData
      const updates = {};
      
      if (editedUser.value.name !== userData.value.name) {
        updates.name = editedUser.value.name;
      }
      
      if (editedUser.value.bio !== userData.value.bio) {
        updates.bio = editedUser.value.bio;
      }
      
      if (editedUser.value.location !== userData.value.location) {
        updates.location = editedUser.value.location;
      }
      
      if (Object.keys(updates).length > 0) {
        await updateDoc(userRef, updates);
        // Update local state
        userData.value = {...userData.value, ...updates};
      }
      
      editMode.value = false;
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  }
  
  function triggerImageUpload(type) {
    if (type === 'profile') {
      profileImageInput.value.click();
    } else if (type === 'banner') {
      bannerImageInput.value.click();
    }
  }
  
  function getUploadProgressClass(progress) {
    if (progress >= 80) return 'bg-success';
    if (progress >= 40) return 'bg-info';
    return 'bg-primary';
  }
  
  function simulateProgressUpdates(type) {
    uploadProgress.value[type] = 5;
    
    const progressInterval = setInterval(() => {
      if (uploadProgress.value[type] < 90) {
        uploadProgress.value[type] += 10;
      } else {
        clearInterval(progressInterval);
      }
    }, 300);
    
    return progressInterval;
  }
  
  async function handleImageUpload(type, event) {
    const file = type === 'profile' ? 
      profileImageInput.value.files[0] : 
      bannerImageInput.value.files[0];
    
    if (!file) return;
    
    try {
      // Show progress indicator
      const progressInterval = simulateProgressUpdates(type);
      
      // Upload image to Cloudinary
      const publicId = await uploadToCloudinary(file);
      const imageUrl = getImageUrl(publicId);
      
      // Update in Firestore
      const userRef = doc(db, "users", props.userId);
      
      if (type === 'profile') {
        await updateDoc(userRef, { photoURL: imageUrl });
        userData.value.photoURL = imageUrl;
      } else if (type === 'banner') {
        await updateDoc(userRef, { bannerURL: imageUrl });
        userData.value.bannerURL = imageUrl;
      }
      
      // Complete the progress bar
      clearInterval(progressInterval);
      uploadProgress.value[type] = 100;
      
      // Reset progress after a delay
      setTimeout(() => {
        uploadProgress.value[type] = 0;
      }, 800);
    } catch (error) {
      console.error(`Error uploading ${type} image:`, error);
      uploadProgress.value[type] = 0;
      alert(`Failed to upload ${type} image. Please try again.`);
    }
  }
  
  function formatDate(timestamp) {
    if (!timestamp) return 'Unknown date';
    
    try {
      // Handle Firestore Timestamp objects
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown date';
    }
  }
  
  // Add Friend Button Functionality
  async function addFriend() {
    const userRef = doc(db , "users" , props.userId);
    const authUserRef = doc(db , "users" , auth.currentUser.uid);
    try{
    await updateDoc(userRef , {friends : arrayUnion(auth.currentUser.uid)})
    await updateDoc(authUserRef , { friends : arrayUnion(props.userId) })
    if (userData.value.friends){
      userData.value.friends.push(auth.currentUser.uid)
    }
    else{
      userData.value.friends = [auth.currentUser.uid]
    }
    }
    catch(e){
      alert("Something went wrong, try again!")
    }
  }
  </script>
  
  <style scoped>
  .profile-card {
  background-color: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  margin-bottom: 2.5rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.profile-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.terminal-panel {
  background-color: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.profile-banner {
  height: 220px; /* Increased height for better presence */
  background-size: cover;
  background-position: center;
  position: relative;
  transition: all 0.3s ease;
  /* Add object-fit properties for better image handling */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.profile-banner::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.4));
  z-index: 1;
}

.settings-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
  backdrop-filter: blur(4px);
}

.settings-btn:hover {
  transform: rotate(30deg) scale(1.1);
  background-color: var(--accent-color);
  box-shadow: 0 0 12px var(--accent-color);
}

.profile-content {
  padding: 25px;
  display: flex;
  position: relative;
  z-index: 2;
}

.profile-image-container {
  position: relative;
  margin-top: -60px;
  margin-right: 25px;
}

.profile-image {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  object-fit: cover;
  border: 4px solid var(--card-bg);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.profile-image:hover {
  transform: scale(1.03);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.image-upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  border-radius: 12px;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.3s ease;
  cursor: pointer;
  backdrop-filter: blur(2px);
}

.image-upload-overlay i {
  font-size: 24px;
  margin-bottom: 6px;
  color: var(--accent-color);
}

.image-upload-overlay span {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.image-upload-overlay:hover {
  opacity: 1;
  transform: scale(1.02);
}

/* Banner upload button */
.banner-upload-btn {
  position: absolute;
  top: 15px;
  left: 15px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(4px);
}

.banner-upload-btn:hover {
  background-color: var(--accent-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Progress bars */
.banner-upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 5;
  backdrop-filter: blur(5px);
}

.banner-upload-progress .progress {
  height: 8px;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  overflow: hidden;
}

.banner-upload-progress .progress-bar {
  height: 100%;
  transition: width 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  font-size: 0;
}

.banner-upload-progress .progress-bar.bg-success {
  background-image: linear-gradient(45deg, var(--accent-color), var(--accent-secondary));
}

.banner-upload-progress .progress-bar.bg-info {
  background-image: linear-gradient(45deg, #0dcaf0, #0d8ef0);
}

.banner-upload-progress .progress-bar.bg-primary {
  background-image: linear-gradient(45deg, #0d6efd, #0dcaf0);
}

/* Circular progress for profile image */
.profile-upload-progress {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 12px;
  z-index: 5;
  backdrop-filter: blur(3px);
}

.circular-progress {
  width: 80px;
  height: 80px;
  transform: rotate(-90deg);
  filter: drop-shadow(0 0 5px rgba(255, 56, 184, 0.5));
}

.circle-bg {
  fill: none;
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 3;
}

.circle {
  fill: none;
  stroke: var(--accent-color);
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
  filter: drop-shadow(0 0 3px var(--accent-color));
}

.percentage {
  fill: white;
  font-size: 9px;
  text-anchor: middle;
  font-family: 'Fira Code', monospace;
  transform: rotate(90deg);
  font-weight: 600;
}

.user-info {
  flex: 1;
}

.profile-name {
  font-size: 1.7rem;
  margin-bottom: 0.35rem;
  color: var(--text-color);
  font-weight: 600;
  letter-spacing: -0.5px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.profile-username {
  font-size: 1rem;
  margin-bottom: 1rem;
  color: var(--code-comment);
  letter-spacing: 0.2px;
}

/* Enhanced bio with animated border */
.profile-bio {
  animation: fadeInUp 0.5s ease backwards;
  animation-delay: 0.2s;
  border-left: 2px solid var(--accent-color);
  padding-left: 15px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.profile-bio::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 2px;
  background: linear-gradient(to bottom, var(--accent-color), var(--accent-secondary));
  transition: all 0.3s ease;
}

.profile-bio:hover {
  transform: translateX(3px);
  padding-left: 18px;
}

.profile-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 1.2rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background-color: rgba(255, 255, 255, 0.04);
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.stat-item:hover {
  background-color: rgba(255, 255, 255, 0.07);
  transform: translateY(-2px);
}

.stat-item i {
  color: var(--accent-color);
  font-size: 14px;
}

/* Edit form styles */
.edit-form {
  width: 100%;
  animation: fadeIn 0.3s ease;
}

.form-group {
  margin-bottom: 1rem;
  position: relative;
}

.code-input {
  background-color: var(--input-focus-bg);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  font-family: 'Fira Code', monospace;
  font-size: 0.95rem;
  padding: 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.code-input:focus {
  background-color: var(--input-focus-bg);
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(255, 56, 184, 0.15);
  transform: translateY(-1px);
}

.code-font {
  font-family: 'Fira Code', monospace;
  font-size: 14px;
}

.code-comment {
  font-family: 'Fira Code', monospace;
  color: var(--code-comment);
  font-size: 13px;
  letter-spacing: 0.2px;
}

.btn-terminal {
  background-color: var(--button-bg);
  border-color: var(--border-color);
  color: var(--text-color);
  transition: all 0.3s ease;
  padding: 8px 16px;
  border-radius: 6px;
  position: relative;
  overflow: hidden;
}

.btn-terminal:hover {
  background-color: var(--button-hover-bg);
  color: var(--text-color);
  transform: translateY(-2px);
}

.btn-terminal::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.btn-terminal:hover::after {
  animation: ripple 1s ease-out;
}

.save-btn {
  background-color: var(--accent-color);
  border-color: var(--accent-color);
  color: var(--button-text);
  padding: 8px 20px;
  border-radius: 6px;
  transition: all 0.3s ease;
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.save-btn:hover {
  background-color: var(--accent-secondary);
  border-color: var(--accent-secondary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 56, 184, 0.3);
}

.save-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.save-btn:hover::after {
  animation: ripple 1s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  20% {
    transform: scale(25, 25);
    opacity: 0.5;
  }
  100% {
    opacity: 0;
    transform: scale(40, 40);
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Small screens adjustments */
@media (max-width: 768px) {
  .profile-content {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .profile-image-container {
    margin-right: 0;
    margin-bottom: 1.5rem;
  }

  .profile-bio {
    text-align: left;
    max-width: 100%;
    margin-left: auto;
    margin-right: auto;
  }

  .profile-stats {
    justify-content: center;
  }
  
  .banner-upload-btn {
    top: 65px;
    left: 15px;
  }
}

/* Tablet adjustments */
@media (min-width: 769px) and (max-width: 1024px) {
  .profile-banner {
    height: 200px;
  }
  
  .profile-image {
    width: 110px;
    height: 110px;
  }
  
  .profile-content {
    padding: 20px;
  }
}

/* Animation for elements */
@keyframes slideInUp {
  from {
    transform: translate3d(0, 20px, 0);
    opacity: 0;
  }
  to {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}

/* Dark mode enhancements */
@media (prefers-color-scheme: dark) {
  .profile-card {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  }
  
  .profile-bio {
    color: rgba(255, 255, 255, 0.9);
  }
  
  .stat-item {
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  .stat-item:hover {
    background-color: rgba(255, 255, 255, 0.08);
  }
}

/* Advanced aesthetic enhancements */
.profile-card {
  position: relative;
  isolation: isolate;
  border: 1px solid rgba(var(--accent-color-rgb), 0.1);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.profile-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(var(--accent-color-rgb), 0.1) 0%, transparent 50%);
  border-radius: 12px;
  z-index: -1;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.profile-card:hover::before {
  opacity: 1;
}

/* Enhanced banner styling */
.profile-banner {
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(2px); 
}

.profile-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, 
    rgba(0, 0, 0, 0.1) 0%,
    rgba(0, 0, 0, 0.3) 100%
  );
  z-index: 1;
}

/* Glowing effect for profile image on hover */
.profile-image {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.profile-image:hover {
  box-shadow: 
    0 0 0 2px var(--card-bg),
    0 0 0 4px var(--accent-color),
    0 8px 20px rgba(0, 0, 0, 0.25);
  transform: translateY(-3px) scale(1.02);
}

/* Animated stats items */
.stat-item {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid rgba(var(--accent-color-rgb), 0.1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  animation: fadeInUp 0.5s ease backwards;
  animation-delay: calc(var(--item-index, 0) * 0.1s);
}

.stat-item:nth-child(1) { --item-index: 1; }
.stat-item:nth-child(2) { --item-index: 2; }
.stat-item:nth-child(3) { --item-index: 3; }

.stat-item:hover {
  background-image: linear-gradient(
    135deg, 
    rgba(var(--accent-color-rgb), 0.08) 0%, 
    rgba(var(--accent-color-rgb), 0.02) 100%
  );
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
}

.stat-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg, 
    transparent, 
    rgba(255, 255, 255, 0.2), 
    transparent
  );
  transition: 0.5s;
}

.stat-item:hover::after {
  left: 100%;
}

/* Enhanced name styling */
.profile-name {
  position: relative;
  display: inline-block;
  transition: all 0.3s ease;
  padding-bottom: 5px;
  animation: fadeInUp 0.5s ease backwards;
}

.profile-name::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent-color) 0%, var(--accent-secondary) 100%);
  transition: width 0.5s ease;
}

.profile-card:hover .profile-name::after {
  width: 100%;
}

.profile-username {
  opacity: 0.9;
  animation: fadeInUp 0.5s ease backwards;
  animation-delay: 0.1s;
  font-style: italic;
}

/* Enhanced bio with animated border */
.profile-bio {
  animation: fadeInUp 0.5s ease backwards;
  animation-delay: 0.2s;
  border-left: 2px solid var(--accent-color);
  padding-left: 15px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.profile-bio::after {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 2px;
  background: linear-gradient(to bottom, var(--accent-color), var(--accent-secondary));
  transition: all 0.3s ease;
}

.profile-bio:hover {
  transform: translateX(3px);
  padding-left: 18px;
}

/* Enhanced form controls */
.code-input {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.code-input:focus {
  transform: translateY(-2px);
  box-shadow: 
    inset 0 1px 3px rgba(0, 0, 0, 0.1),
    0 0 0 3px rgba(var(--accent-color-rgb), 0.2);
}

/* Enhanced buttons with glowing effect */
.save-btn {
  background-image: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-secondary) 100%);
  border: none;
  position: relative;
  z-index: 1;
  overflow: hidden;
  transition: all 0.4s ease;
}

.save-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-color) 100%);
  opacity: 0;
  z-index: -1;
  transition: opacity 0.4s ease;
}

.save-btn:hover::before {
  opacity: 1;
}

.save-btn:hover {
  box-shadow: 
    0 5px 15px rgba(var(--accent-color-rgb), 0.4),
    0 0 0 1px rgba(var(--accent-color-rgb), 0.2);
  transform: translateY(-3px);
}

/* Improved upload progress styling */
.banner-upload-progress .progress {
  height: 10px;
  backdrop-filter: blur(5px);
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.banner-upload-progress .progress-bar {
  background-size: 30px 30px;
  background-image: linear-gradient(
    -45deg,
    rgba(255, 255, 255, 0.2) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.2) 75%,
    transparent 75%,
    transparent
  );
  animation: progress-bar-stripes 1s linear infinite;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.15);
}

/* Profile upload progress enhancement */
.circular-progress {
  filter: drop-shadow(0 0 8px rgba(var(--accent-color-rgb), 0.6));
}

.circle {
  stroke: var(--accent-color);
  filter: url(#glow);
}

/* Add SVG filter for glow effect */
.profile-upload-progress svg {
  filter: drop-shadow(0 0 3px var(--accent-color));
}

/* Enhanced responsive design */
@media (max-width: 768px) {
  .profile-image-container {
    margin-top: -70px;
  }
  
  .profile-image {
    width: 130px;
    height: 130px;
    border-width: 5px;
  }
  
  .profile-bio {
    text-align: center;
    padding-left: 0;
    padding-top: 15px;
    border-left: none;
    border-top: 2px solid var(--accent-color);
  }
  
  .profile-bio:hover {
    transform: translateY(-3px);
    padding-left: 15px;
  }
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes progress-bar-stripes {
  from { background-position: 30px 0; }
  to { background-position: 0 0; }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

/* Add glow effect to edit mode buttons */
.image-upload-overlay i,
.banner-upload-btn i {
  filter: drop-shadow(0 0 3px var(--accent-color));
}

/* Add subtle texture overlay */
.profile-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M0 0h40v40H0V0z'/%3E%3Cpath d='M0 0h20v20H0V0z'/%3E%3C/g%3E%3C/svg%3E");
  z-index: -1;
  pointer-events: none;
  mix-blend-mode: overlay;
  border-radius: 12px;
}

/* Add Friend Button Styling */
.add-friend-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-secondary) 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
  font-family: 'Fira Code', monospace;
  letter-spacing: 0.5px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.add-friend-btn:hover {
  transform: translateY(-3px);
  box-shadow: 
    0 6px 15px rgba(var(--accent-color-rgb), 0.4),
    0 0 0 2px rgba(var(--accent-color-rgb), 0.2);
}

.add-friend-btn:active {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(var(--accent-color-rgb), 0.3);
}

.add-friend-btn i {
  font-size: 1.1rem;
  filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.4));
}

/* Position adjustment when both settings and add friend buttons appear */
@media (max-width: 576px) {
  .add-friend-btn {
    padding: 8px 12px;
    font-size: 0.85rem;
  }
  
  .add-friend-btn i {
    font-size: 1rem;
  }
}

/* Handle specific responsive scenarios */
@media (max-width: 768px) {
  .add-friend-btn {
    bottom: 15px;
    top: auto;
    right: 15px;
  }
}

/* Animation for the button */
@keyframes friendBtnPulse {
  0% { box-shadow: 0 0 0 0 rgba(var(--accent-color-rgb), 0.5); }
  70% { box-shadow: 0 0 0 10px rgba(var(--accent-color-rgb), 0); }
  100% { box-shadow: 0 0 0 0 rgba(var(--accent-color-rgb), 0); }
}

.add-friend-btn:hover {
  animation: friendBtnPulse 1.5s infinite;
}
  </style>