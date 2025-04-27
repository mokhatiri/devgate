<template>
    <div class="terminal-panel post-card mb-4">
      <div class="terminal-header">
        <div class="terminal-dots">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <div class="d-flex align-items-center">
          <span class="terminal-title">post_{{ postData.id }}.md</span>
          <span class="ms-2 badge bg-secondary code-font">{{ formatDate(postData.timestamp) }}</span>
        </div>
      </div>
  
      <div class="terminal-body">
        <div class="post-header d-flex align-items-center mb-3">
          <img
            :src="postData.user.photoURL || '/api/placeholder/40/40'"
            alt="Profile"
            class="profile-image me-2"
          />
          <span class="post-user-name code-font">{{ postData.user.name }}</span>
        </div>
  
        <div class="post-content code-font mb-3">
          {{ postData.content }}
        </div>
        
        <!-- Post Image -->
        <div v-if="postData.image && postData.image.url" class="post-image-container mb-3">
          <img 
            :src="postData.image.url" 
            :alt="`Image by ${postData.user.name}`" 
            class="post-image"
            @click="enlargeImage"
          />
        </div>
  
        <!-- Post Stats -->
        <div class="post-stats d-flex align-items-center mb-3">
          <div class="d-flex align-items-center me-3 cursor-pointer" @click="toggleRepliesVisibility">
            <i class="bi bi-chat-left-text me-1"></i>
            <span class="code-font">{{ replyCount }}</span>
          </div>
          <div class="d-flex align-items-center cursor-pointer" @click="toggleLike">
            <i class="bi" :class="isLiked ? 'bi-heart-fill liked' : 'bi-heart'"></i>
            <span class="code-font">{{ likeCount }}</span>
          </div>
        </div>
      </div>
      
      <!-- Post Replies Section -->
      <PostReplies 
        :postId="postData.id" 
        :formatDate="formatDate" 
        :initialVisibility="showReplies"
        @toggle-replies="handleRepliesToggle"
      />
      
      <!-- Image Modal -->
      <div v-if="showImageModal && postData.image" class="image-modal" @click="closeModal">
        <div class="modal-content">
          <img :src="postData.image.url" :alt="`Image by ${postData.user.name}`" class="modal-image" />
          <button class="close-modal-btn" @click.stop="closeModal">×</button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import PostReplies from '@/components/PostReplies.vue';
  import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
  import { db, auth } from '@/firebase';
  
  // Define props
  const props = defineProps({
    post: {
      type: Object,
      required: true
    },
    formatDate: {
      type: Function,
      required: true
    }
  });
  
  // Image modal state
  const showImageModal = ref(false);
  const postData = ref({ ...props.post });
  const showReplies = ref(false);
  
  // Computed properties for post stats
  const replyCount = computed(() => {
    return postData.value.replies ? postData.value.replies.length : 0;
  });
  
  const likeCount = computed(() => {
    return postData.value.likes ? postData.value.likes.length : 0;
  });
  
  const isLiked = computed(() => {
    if (!auth.currentUser || !postData.value.likes) return false;
    return postData.value.likes.includes(auth.currentUser.uid);
  });
  
  // Functions to handle image modal
  function enlargeImage() {
    if (postData.value.image && postData.value.image.url) {
      showImageModal.value = true;
      document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }
  }
  
  function closeModal() {
    showImageModal.value = false;
    document.body.style.overflow = ''; // Restore scrolling
  }
  
  // Toggle replies visibility
  function toggleRepliesVisibility() {
    showReplies.value = !showReplies.value;
  }
  
  function handleRepliesToggle(value) {
    showReplies.value = value;
  }
  
  // Toggle like on post
  async function toggleLike() {
    if (!auth.currentUser) return;
    
    const userId = auth.currentUser.uid;
    const postRef = doc(db, "posts", postData.value.id);
    
    try {
      if (isLiked.value) {
        // Remove like
        await updateDoc(postRef, {
          likes: arrayRemove(userId)
        });
      } else {
        // Add like
        await updateDoc(postRef, {
          likes: arrayUnion(userId)
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  }
  
  // Listen for real-time updates to the post
  onMounted(() => {
    const unsubscribe = onSnapshot(doc(db, "posts", postData.value.id), (doc) => {
      if (doc.exists()) {
        postData.value = {
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        };
      }
    });
  
    // Clean up listener on component unmount
    return () => {
      unsubscribe();
    };
  });
  
  // Watch for changes in the post prop
  watch(() => props.post, (newPost) => {
    postData.value = { ...newPost };
  }, { deep: true });
  </script>
  
  <style scoped>
  /* Import a monospace font for code */
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap');
  
  /* Terminal panels */
  .terminal-panel {
    background-color: var(--card-bg);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    position: relative;
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
  
  /* Post card specific styles */
  .post-card {
    margin-bottom: 20px;
  }
  
  .post-content {
    white-space: pre-wrap;
    word-break: break-word;
  }
  
  .post-user-name {
    font-weight: 500;
  }
  
  /* Post stats */
  .post-stats {
    padding: 6px 0;
    border-top: 1px solid var(--border-color);
    color: var(--text-secondary);
    font-size: 14px;
  }
  
  /* Add cursor pointer for clickable elements */
  .cursor-pointer {
    cursor: pointer;
  }
  
  /* Add styling for liked heart icon */
  .liked {
    color: #ff3e66;
  }
  
  /* Profile images */
  .profile-image {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    object-fit: cover;
  }
  
  /* Post images */
  .post-image-container {
    width: 100%;
    border-radius: 6px;
    overflow: hidden;
    cursor: pointer;
  }
  
  .post-image {
    max-width: 100%;
    max-height: 400px;
    object-fit: contain;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 6px;
    transition: opacity 0.2s;
  }
  
  .post-image:hover {
    opacity: 0.95;
  }
  
  /* Image Modal */
  .image-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    cursor: pointer;
  }
  
  .modal-content {
    position: relative;
    max-width: 90%;
    max-height: 90%;
  }
  
  .modal-image {
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 4px;
  }
  
  .close-modal-btn {
    position: absolute;
    top: -40px;
    right: 0;
    background-color: transparent;
    color: white;
    border: none;
    font-size: 30px;
    cursor: pointer;
    padding: 5px 10px;
  }
  </style>