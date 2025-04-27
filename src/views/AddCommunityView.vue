<template>
    <div class="add-community-container">
      <div class="terminal-panel">
        <div class="terminal-header">
          <div class="terminal-dots">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <div class="d-flex align-items-center justify-content-between w-100">
            <div class="terminal-title">createCommunity.js</div>
            <div class="d-flex">
              <span class="badge bg-secondary me-2 code-font">unsaved</span>
              <button class="btn-close btn-close-white btn-sm" @click="$router.push('/explore')"></button>
            </div>
          </div>
        </div>
        
        <div class="terminal-body">
          <h2 class="code-font mb-4">
            <span class="text-accent">new</span> Community()
          </h2>
          
          <div class="progress-container mb-4">
            <div class="progress" style="height: 3px;">
              <div class="progress-bar" role="progressbar" :style="`width: ${formProgress}%`"></div>
            </div>
            <div class="step-indicators">
              <div class="step active">
                <div class="step-circle">1</div>
                <div class="step-label code-font">basics</div>
              </div>
              <div class="step" :class="{ active: isStep2Valid }">
                <div class="step-circle">2</div>
                <div class="step-label code-font">details</div>
              </div>
              <div class="step" :class="{ active: isFormValid }">
                <div class="step-circle">3</div>
                <div class="step-label code-font">confirm</div>
              </div>
            </div>
          </div>
          
          <form @submit.prevent="createCommunity">
            <!-- Step 1: Name -->
            <div class="mb-4">
              <label class="form-label code-font d-flex align-items-center">
                <span class="text-accent">const</span> name = 
              </label>
              <div class="input-group">
                <span class="input-group-text code-font">"</span>
                <input 
                  type="text" 
                  class="form-control code-font"
                  v-model="communityName"
                  placeholder="Community name"
                  :class="{ 'is-invalid': nameError }"
                  required
                />
                <span class="input-group-text code-font">"</span>
              </div>
              <div class="form-text code-comment" v-if="!nameError">// Choose a unique name for your community</div>
              <div class="invalid-feedback" v-if="nameError">{{ nameError }}</div>
            </div>
            
            <!-- Step 2: Bio -->
            <div class="mb-4">
              <label class="form-label code-font d-flex align-items-center">
                <span class="text-accent">const</span> bio = 
              </label>
              <div class="input-group">
                <span class="input-group-text code-font">`</span>
                <textarea 
                  class="form-control code-font"
                  v-model="communityBio"
                  placeholder="Community description"
                  rows="3"
                  :class="{ 'is-invalid': bioError }"
                  required
                ></textarea>
                <span class="input-group-text code-font">`</span>
              </div>
              <div class="form-text code-comment" v-if="!bioError">// Describe what your community is about</div>
              <div class="invalid-feedback" v-if="bioError">{{ bioError }}</div>
            </div>
            
            <!-- Step 3: Preview & Confirm -->
            <div class="code-preview-container mb-4">
              <div class="code-preview-header">
                <span class="code-font">Preview</span>
              </div>
              <div class="code-preview code-font">
                <pre v-if="isStep2Valid"><span class="code-keyword">const</span> community = {
    name: <span class="code-string">"{{ communityName || 'Community name' }}"</span>,
    bio: <span class="code-string">`{{ communityBio || 'Community description' }}`</span>,
    admins: [
      <span class="code-string">"{{ currentUser.uid || 'current-user-id' }}"</span> <span class="code-comment">// {{ currentUser.name || 'You' }}</span>
    ],
    bannedUsers: [],
    createdAt: <span class="code-function">new</span> <span class="code-function">Date()</span>,
    posts : [],
  };</pre>
              </div>
            </div>
            
            <div class="alert alert-info code-font mb-4" v-if="isFormValid">
              <i class="bi bi-info-circle me-2"></i>
              You'll be automatically added as the first admin of this community.
            </div>
            
            <div class="d-flex justify-content-between">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="termsCheck" v-model="termsAccepted">
                <label class="form-check-label code-font" for="termsCheck">
                  <span class="code-comment">// I agree to community guidelines</span>
                </label>
              </div>
              
              <button 
                type="submit" 
                class="btn create-btn" 
                :disabled="!isFormValid || isLoading"
              >
                <span v-if="!isLoading">
                  <i class="bi bi-code-slash me-2"></i>
                  <span class="code-font">init()</span>
                </span>
                <span v-else>
                  <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                  <span class="code-font">creating...</span>
                </span>
              </button>
            </div>
          </form>
          
          <div class="code-comment terminal-footer mt-4">
            <i class="bi bi-terminal"></i>
            $ community create --name="{{ communityName || 'name' }}" --admin="{{ currentUser.name || 'you' }}"
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
  import { getAuth } from 'firebase/auth';
  import {CurrUser} from '@/firebase';
  
  // Firebase references
  const db = getFirestore();
  const auth = getAuth();
  
  // Form data
  const communityName = ref('');
  const communityBio = ref('');
  const termsAccepted = ref(false);
  const isLoading = ref(false);
  const nameError = ref('');
  const bioError = ref('');
  
  // Current user data
  const currentUser = CurrUser;
  
  // Form validation
  const isStep1Valid = computed(() => {
    return communityName.value.trim().length >= 3;
  });
  
  const isStep2Valid = computed(() => {
    return isStep1Valid.value && communityBio.value.trim().length >= 10;
  });
  
  const isFormValid = computed(() => {
    return isStep2Valid.value && termsAccepted.value;
  });
  
  const formProgress = computed(() => {
    if (isFormValid.value) return 100;
    if (isStep2Valid.value) return 66;
    if (isStep1Valid.value) return 33;
    return 0;
  });
  
  // Methods
  const validateForm = () => {
    nameError.value = '';
    bioError.value = '';
    
    if (!communityName.value.trim()) {
      nameError.value = 'Community name is required';
      return false;
    } else if (communityName.value.trim().length < 3) {
      nameError.value = 'Name must be at least 3 characters';
      return false;
    }
    
    if (!communityBio.value.trim()) {
      bioError.value = 'Community description is required';
      return false;
    } else if (communityBio.value.trim().length < 10) {
      bioError.value = 'Description must be at least 10 characters';
      return false;
    }
    
    return true;
  };
  
  const createCommunity = async () => {
    if (!validateForm()) return;
    
    isLoading.value = true;
    
    try {
      // Create the community document in Firestore
      const communityData = {
        name: communityName.value.trim(),
        bio: communityBio.value.trim(),
        admins: [currentUser.value.uid], // Current user as admin
        bannedUsers: [], // Initially empty
        createdAt: serverTimestamp(),
        posts: [] // Initially empty
      };
      
      const docRef = await addDoc(collection(db, "communities"), communityData);
      console.log("Community created with ID: ", docRef.id);
      
      // Emit success event with community ID
      setTimeout(() => {
        // Wait a moment for a better UX
        isLoading.value = false;
        
        // You can redirect or show success message here
        alert(`Community "${communityName.value}" created successfully!`);
        
        // Reset form
        communityName.value = '';
        communityBio.value = '';
        termsAccepted.value = false;
      }, 1000);
      
    } catch (error) {
      console.error("Error creating community: ", error);
      isLoading.value = false;
      alert("Error creating community: " + error.message);
    }
  };
  
  // Get current user info on mount
  
  </script>
  
  <style scoped>
  /* Import a monospace font for code */
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap');
  
  .add-community-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  /* Terminal panels */
  .terminal-panel {
    background-color: var(--card-bg);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    height: 100%;
    max-height: 800px;
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
    flex: 1;
    overflow-y: auto;
  }
  
  /* Code styling */
  .code-font {
    font-family: 'Fira Code', monospace !important;
    font-size: 14px;
  }
  
  .code-comment {
    color: var(--code-comment);
    font-family: 'Fira Code', monospace;
    font-size: 12px;
  }
  
  .code-keyword {
    color: var(--code-keyword);
  }
  
  .code-function {
    color: var(--code-function);
  }
  
  .code-string {
    color: #5ca75c;
  }
  
  .text-accent {
    color: var(--accent-color);
  }
  
  /* Progress bar styling */
  .progress-container {
    margin-bottom: 30px;
  }
  
  .progress {
    background-color: var(--progress-line-bg);
    margin-bottom: 15px;
  }
  
  .progress-bar {
    background: var(--progress-bar-active-bg);
    transition: width 0.3s ease;
  }
  
  .step-indicators {
    display: flex;
    justify-content: space-between;
  }
  
  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 33%;
  }
  
  .step-circle {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: var(--step-indicator-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    font-weight: 600;
    font-family: 'Fira Code', monospace;
    margin-bottom: 5px;
    transition: all 0.3s ease;
  }
  
  .step.active .step-circle {
    background: var(--button-gradient-bg);
    color: white;
  }
  
  .step-label {
    color: var(--text-secondary);
    font-size: 12px;
    transition: color 0.3s ease;
  }
  
  .step.active .step-label {
    color: var(--text-color);
    font-weight: 600;
  }
  
  /* Form styling */
  .form-control, .input-group-text {
    background-color: var(--chat-input-bg);
    border-color: var(--border-color);
    color: var(--text-color);
  }
  
  .form-control:focus {
    background-color: var(--input-focus-bg);
    box-shadow: 0 0 0 0.25rem var(--input-focus-shadow);
    color: var(--text-color);
  }
  
  .form-control::placeholder {
    color: var(--input-placeholder-color);
    opacity: 0.7;
  }
  
  .input-group-text {
    background-color: var(--input-group-text-bg);
    border-color: var(--input-group-text-border);
  }
  
  /* Code preview */
  .code-preview-container {
    border: 1px solid var(--border-color);
    border-radius: 6px;
    overflow: hidden;
  }
  
  .code-preview-header {
    background-color: var(--navbar-bg);
    padding: 8px 12px;
    font-size: 12px;
    color: var(--text-secondary);
  }
  
  .code-preview {
    background-color: var(--chat-input-bg);
    padding: 16px;
    max-height: 200px;
    overflow-y: auto;
  }
  
  .code-preview pre {
    margin: 0;
    white-space: pre-wrap;
    line-height: 1.5;
  }
  
  /* Create button */
  .create-btn {
    background: var(--button-gradient-bg);
    color: white;
    border: none;
    padding: 8px 20px;
    transition: all 0.2s ease;
  }
  
  .create-btn:hover:not(:disabled) {
    opacity: 0.9;
    color: white;
  }
  
  .create-btn:disabled {
    opacity: 0.5;
  }
  
  /* Terminal footer */
  .terminal-footer {
    border-top: 1px solid var(--border-color);
    padding-top: 12px;
    font-size: 12px;
  }
  </style>