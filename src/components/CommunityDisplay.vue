<template>
  <div class="posts-section custom-scrollbar">
    <div v-if="!community" class="select-community-message">
      <div class="code-snippet-container">
        <div class="code-snippet-header">
          <div class="terminal-dots">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <div class="snippet-title">welcome.js</div>
        </div>
        <div class="code-snippet-body code-font">
          <pre><span class="code-keyword">const</span> <span class="code-function">welcome</span> = () => {
    <span class="code-comment">// Please select a community to continue</span>
    <span class="code-keyword">return</span> (
      <span class="code-string">"Choose A Community!"</span>
    );
  };
  
  <span class="code-comment">/**
   * Select a community from the list
   * to see posts and start interacting
   * with other developers.
   */</span>
  
  <span class="code-function">welcome</span>();</pre>
        </div>
      </div>
    </div>

    <template v-else>
      <div class="community-header code-font">
        <div class="d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center">
            <i class="bi bi-braces me-2"></i>
            <h2>{{ community.name }}</h2>
          </div>
          
          <!-- New Action Buttons -->
          <div class="community-actions">
            <button class="btn btn-terminal me-2" @click="$router.push({name : 'communitydetails' , params: { id: community.id }})">
              <i class="bi bi-info-circle me-1"></i>
              <span class="code-font">viewDetails()</span>
            </button>
            <button 
              v-if="isAdmin" 
              class="btn btn-terminal-accent" 
              @click="$router.push({name : 'editcommunity' , params: { id: community.id }})"
            >
              <i class="bi bi-gear me-1"></i>
              <span class="code-font">settings()</span>
            </button>
          </div>
        </div>
        <p class="code-comment">// {{ community.bio }}</p>
      </div>

      <!-- New Post Creation -->
      <div class="terminal-panel create-post-container mb-4">
        <div class="terminal-header">
          <div class="terminal-dots">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <div class="terminal-title">newPost.js</div>
        </div>

        <div class="terminal-body">
          <div class="create-post-header d-flex align-items-center mb-3">
            <img
              :src="currentUser.photoURL || '/api/placeholder/40/40'"
              alt="Profile"
              class="profile-image me-2"
            />
            <span class="user-name code-font">{{ currentUser.name }}</span>
            <span class="ms-2 code-comment">// Share your code and ideas</span>
          </div>

          <div class="create-post-body">
            <textarea
              class="form-control post-textarea code-font"
              placeholder="console.log('What are you working on?');"
              v-model="newPostContent"
              rows="4"
            ></textarea>
            
            <!-- Image Preview (if uploaded) -->
            <div v-if="imagePreview" class="image-preview-container mt-3">
              <img :src="imagePreview" alt="Preview" class="image-preview" />
              <button @click="removeImage" class="btn btn-sm btn-danger remove-image-btn">
                <i class="bi bi-x"></i>
              </button>
              <div class="code-comment mt-1">// Image attached</div>
            </div>

            <!-- Upload Progress Bar -->
            <div v-if="uploadProgress > 0 && uploadProgress < 100" class="progress mt-3">
              <div class="progress-bar" 
                   role="progressbar" 
                   :style="{width: `${uploadProgress}%`}" 
                   :aria-valuenow="uploadProgress" 
                   aria-valuemin="0" 
                   aria-valuemax="100">{{ uploadProgress }}%</div>
            </div>
          </div>

          <div class="create-post-footer d-flex justify-content-between mt-3">
            <label class="btn btn-outline-secondary attachment-btn">
              <i class="bi bi-image me-2"></i>
              <span class="code-font">attach()</span>
              <input 
                type="file" 
                accept="image/*" 
                class="d-none" 
                @change="handleFileSelect"
                ref="fileInput"
              />
            </label>
            <button
              class="btn post-btn"
              :disabled="!isPostValid || isUploading"
              @click="createPost"
            >
              <i class="bi bi-arrow-right-circle me-2"></i>
              <span class="code-font">commit()</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Posts List -->
      <div class="posts-list">
        <div v-if="loading" class="loading-posts code-font text-center p-4">
          <div class="spinner-border text-accent" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2 code-comment">// Fetching posts...</p>
        </div>

        <div v-else-if="posts.length === 0" class="no-posts-message code-font">
          <i class="bi bi-file-earmark-code fs-1"></i>
          <p><span class="code-comment">// This repository is empty. Push your first commit!</span></p>
        </div>

        <!-- Post Component -->
        <Post
          v-for="post in posts"
          :key="post.id"
          :post="post"
          :formatDate="formatDate"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/firebase";
import { auth, CurrUser } from "@/firebase";
import Post from "@/components/Post.vue";
import { handleImageUpload, getImageUrl } from "@/cloudinary";
import router from "@/router";

const props = defineProps({
  communityId: {
    type: [String, Number],
    default: null,
  },
});

const emit = defineEmits(['viewDetails', 'openSettings']);

const community = ref(null);
const posts = ref([]);
const newPostContent = ref("");
const currentUser = CurrUser;
const loading = ref(false);
const fileInput = ref(null);
const selectedFile = ref(null);
const imagePreview = ref(null);
const uploadedImageId = ref(null);
const uploadProgress = ref(0);
const isUploading = ref(false);

// Check if the current user is an admin of this community
const isAdmin = computed(() => {
  if (!community.value || !currentUser.value) return false;
  return community.value.admins?.includes(auth.currentUser.uid);
});

const isPostValid = computed(() => {
  // Post is valid if there's content or an image
  return newPostContent.value.trim() || uploadedImageId.value;
});

let unsubscribeCommunity = null;

// Functions for new buttons
function viewCommunityDetails() {
  emit('viewDetails', community.value);
}

function openSettings() {
  if (isAdmin.value) {
    emit('openSettings', community.value);
  }
}

// Watch for changes in communityId prop
watch(
  () => props.communityId,
  async (newId) => {
    if (unsubscribeCommunity) {
      unsubscribeCommunity();
      unsubscribeCommunity = null;
    }

    posts.value = [];

    if (newId) {
      loading.value = true;
      await fetchCommunityData(newId);
      loading.value = false;
    } else {
      community.value = null;
    }
  },
  { immediate: true }
);



// Handle file selection
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  selectedFile.value = file;
  
  // Create a preview of the selected image
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target.result;
  };
  reader.readAsDataURL(file);
  
  // Upload the image immediately
  uploadImage(file);
}

// Upload image to Cloudinary
async function uploadImage(file) {
  try {
    isUploading.value = true;
    uploadProgress.value = 10; // Start progress
    
    // Simulated progress updates during compression
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10;
      }
    }, 300);
    
    // Upload the image
    const publicId = await handleImageUpload(file);
    uploadedImageId.value = publicId;
    
    // Complete the progress bar
    clearInterval(progressInterval);
    uploadProgress.value = 100;
    
    // Reset progress after a delay
    setTimeout(() => {
      uploadProgress.value = 0;
      isUploading.value = false;
    }, 500);
    
    console.log("Image uploaded successfully, public ID:", publicId);
  } catch (error) {
    console.error("Failed to upload image:", error);
    uploadProgress.value = 0;
    isUploading.value = false;
    alert("Failed to upload image. Please try again.");
  }
}

// Remove the uploaded image
function removeImage() {
  selectedFile.value = null;
  imagePreview.value = null;
  uploadedImageId.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

// Fetch community data and listen for changes
async function fetchCommunityData(communityId) {
  const communityRef = doc(db, "communities", communityId.toString());

  unsubscribeCommunity = onSnapshot(communityRef, async (snapshot) => {
    if (snapshot.exists()) {
      community.value = {
        id: snapshot.id,
        ...snapshot.data(),
      };

      
      // Fetch posts based on the posts array in the community document
      if (community.value.posts && community.value.posts.length > 0) {
        await fetchPosts(community.value.posts);
      } else {
        posts.value = [];
      }
    } else {
      console.error("Community not found!");
      community.value = null;
    }
  });
}

// Fetch posts based on an array of post IDs
async function fetchPosts(postIds) {
  const postsRef = collection(db, "posts");
  const postsQuery = query(postsRef, where("__name__", "in", postIds));

  const snapshot = await getDocs(postsQuery);
  posts.value = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate() || new Date(),
  }));
  console.log("Fetched posts:", posts.value);
}

// Create a new post
async function createPost() {
  if (!isPostValid.value || !props.communityId || !auth.currentUser) return;

  try {
    // Prepare post data
    const postData = {
      communityId: props.communityId.toString(),
      content: newPostContent.value,
      user: {
        id: auth.currentUser.uid,
        name: currentUser.value.name,
        photoURL: currentUser.value.photoURL,
      },
      timestamp: serverTimestamp(),
    };

    // Add image data if an image was uploaded
    if (uploadedImageId.value) {
      postData.image = {
        publicId: uploadedImageId.value,
        url: getImageUrl(uploadedImageId.value, { w: 800, c: 'fill', q: 'auto' })
      };
    }

    // Add the new post to the "posts" collection
    const PostRef = await addDoc(collection(db, "posts"), postData);

    // Update the "posts" array in the community document with the new post ID
    await updateDoc(doc(db, "communities", props.communityId.toString()), {
      posts: arrayUnion(PostRef.id),
    });

    // Clear the input field and image after successful post creation
    newPostContent.value = "";
    removeImage();
    
    console.log("Post created successfully with ID:", PostRef.id);
  } catch (error) {
    console.error("Error creating post:", error);
    alert("Failed to create post. Please try again.");
  }
}

function formatDate(timestamp) {
  if (!timestamp) return "";

  // Check if timestamp is a Date object
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

  return date.toISOString().split("T")[0];
}
</script>

<style scoped>
/* Import a monospace font for code */
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap');

.posts-section {
  overflow-y: auto;
  padding: 10px;
  height: 100%;
}

.select-community-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary);
}

.code-snippet-container {
  width: 100%;
  max-width: 600px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.code-snippet-header {
  background-color: var(--navbar-bg);
  padding: 8px 12px;
  display: flex;
  align-items: center;
}

.snippet-title {
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  color: var(--text-secondary);
  margin-left: 12px;
}

.code-snippet-body {
  background-color: var(--card-bg);
  padding: 16px;
  color: var(--text-color);
}

.code-snippet-body pre {
  margin: 0;
  font-family: 'Fira Code', monospace;
  line-height: 1.5;
  white-space: pre-wrap;
}

.community-header {
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 16px;
}

.community-header h2 {
  margin: 0;
  font-weight: 600;
}

/* New styles for action buttons */
.community-actions {
  display: flex;
  gap: 8px;
}

.btn-terminal {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  color: var(--text-color);
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}

.btn-terminal:hover {
  background-color: var(--input-focus-bg);
  border-color: var(--accent-secondary);
}

.btn-terminal-accent {
  background-color: var(--accent-dimmed);
  border: 1px solid var(--accent-secondary);
  color: var(--text-color);
  font-family: 'Fira Code', monospace;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
}

.btn-terminal-accent:hover {
  background-color: var(--accent-secondary);
  color: white;
}

/* Terminal panels */
.terminal-panel {
  background-color: var(--card-bg);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
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
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
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

/* Create post container */
.create-post-container {
  margin-bottom: 20px;
}

.post-textarea {
  background-color: var(--chat-input-bg);
  border: 1px solid var(--border-color);
  resize: none;
  font-family: 'Fira Code', monospace;
}

.post-textarea:focus {
  background-color: var(--input-focus-bg);
  box-shadow: 0 0 0 0.25rem var(--input-focus-shadow);
}

.post-btn {
  background: var(--button-gradient-bg);
  color: white;
  font-weight: 500;
}

.post-btn:hover {
  color: white;
  opacity: 0.9;
}

/* Image upload and preview */
.image-preview-container {
  position: relative;
  display: inline-block;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.image-preview {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
}

.remove-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.remove-image-btn:hover {
  opacity: 1;
}

/* Posts list */
.posts-list {
  display: flex;
  flex-direction: column;
}

.no-posts-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px;
  text-align: center;
}

/* Custom scrollbar */
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--accent-secondary) var(--dark-bg);
  overflow-y: auto;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: var(--dark-bg);
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--accent-secondary);
  border-radius: 20px;
}

/* Profile images */
.profile-image {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: cover;
}

.loading-posts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}
</style>