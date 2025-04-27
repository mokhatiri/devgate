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
        <!-- Post actions dropdown for owner -->
        <div v-if="isPostOwner" class="ms-auto dropdown">
          <button class="btn btn-sm action-btn" data-bs-toggle="dropdown">
            <i class="bi bi-three-dots-vertical"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li>
              <button class="dropdown-item code-font" @click="toggleEditMode">
                <i class="bi bi-pencil me-2"></i> edit()
              </button>
            </li>
            <li>
              <button class="dropdown-item code-font text-danger" @click="confirmDeletePost">
                <i class="bi bi-trash me-2"></i> delete()
              </button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Post content (editable or display mode) -->
      <div v-if="!isEditing" class="post-content code-font mb-3">
        {{ postData.content }}
      </div>
      <div v-else class="edit-post-form mb-3">
        <textarea
          class="form-control reply-textarea code-font"
          v-model="editedContent"
          rows="4"
        ></textarea>
        <div class="d-flex justify-content-end mt-2">
          <button 
            class="btn btn-sm btn-outline-secondary me-2"
            @click="cancelEdit"
          >
            <span class="code-font">cancel()</span>
          </button>
          <button
            class="btn btn-sm save-btn"
            :disabled="!editedContent.trim()"
            @click="saveEditedPost"
          >
            <span class="code-font">save()</span>
          </button>
        </div>
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

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="delete-modal" @click="cancelDelete">
      <div class="delete-modal-content" @click.stop>
        <div class="terminal-panel">
          <div class="terminal-header">
            <div class="terminal-dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="terminal-title">delete_confirmation.sh</div>
          </div>
          <div class="terminal-body p-3">
            <p class="code-font mb-3">// Are you sure you want to delete this post?</p>
            <p class="code-font text-danger mb-3">// This action cannot be undone.</p>
            <div class="d-flex justify-content-end">
              <button class="btn btn-sm btn-outline-secondary me-2" @click="cancelDelete">
                <span class="code-font">cancel()</span>
              </button>
              <button class="btn btn-sm btn-danger" @click="deletePost">
                <span class="code-font">confirm_delete()</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import PostReplies from '@/components/PostReplies.vue';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
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

// Define emits
const emit = defineEmits(['post-deleted']);

// Image modal state
const showImageModal = ref(false);
const postData = ref({ ...props.post });
const showReplies = ref(false);
const isEditing = ref(false);
const editedContent = ref('');
const showDeleteModal = ref(false);

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

// Check if current user is the post owner
const isPostOwner = computed(() => {
  if (!auth.currentUser || !postData.value.user) return false;
  return postData.value.user.id === auth.currentUser.uid;
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

// Edit post functions
function toggleEditMode() {
  isEditing.value = !isEditing.value;
  editedContent.value = postData.value.content;
}

function cancelEdit() {
  isEditing.value = false;
  editedContent.value = '';
}

async function saveEditedPost() {
  if (!editedContent.value.trim() || !isPostOwner.value) return;
  
  try {
    const postRef = doc(db, "posts", postData.value.id);
    await updateDoc(postRef, {
      content: editedContent.value,
      edited: true,
      lastEdited: new Date()
    });
    
    isEditing.value = false;
  } catch (error) {
    console.error("Error updating post:", error);
  }
}

// Delete post functions
function confirmDeletePost() {
  showDeleteModal.value = true;
}

function cancelDelete() {
  showDeleteModal.value = false;
}

async function deletePost() {
  if (!isPostOwner.value) return;
  
  try {
    // First, delete all replies associated with this post
    const repliesRef = collection(db, "postReplies");
    const repliesQuery = query(repliesRef, where("postId", "==", postData.value.id));
    const repliesSnapshot = await getDocs(repliesQuery);
    
    // Delete each reply document
    const deletePromises = repliesSnapshot.docs.map(replyDoc => 
      deleteDoc(doc(db, "postReplies", replyDoc.id))
    );
    
    await Promise.all(deletePromises);
    
    // Then delete the post itself
    await updateDoc(doc(db, "communities", postData.value.communityId), {
      posts: arrayRemove(postData.value.id)
    });
    await deleteDoc(doc(db, "posts", postData.value.id));
    
    showDeleteModal.value = false;
    emit('post-deleted', postData.value.id);
  } catch (error) {
    console.error("Error deleting post:", error);
    showDeleteModal.value = false;
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

/* Edit post form */
.edit-post-form {
  margin-bottom: 12px;
}

.reply-textarea {
  background-color: var(--chat-input-bg);
  border: 1px solid var(--border-color);
  resize: none;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
}

.save-btn {
  background: var(--button-gradient-bg);
  color: white;
  font-weight: 500;
  font-size: 12px;
}

.save-btn:hover {
  color: white;
  opacity: 0.9;
}

.action-btn {
  background-color: transparent;
  border: none;
  padding: 4px 8px;
  color: var(--text-secondary);
}

.action-btn:hover {
  background-color: var(--navbar-bg);
  color: var(--text-primary);
}

/* Delete Modal */
.delete-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.delete-modal-content {
  max-width: 450px;
  width: 90%;
}
</style>