<template>
  <div class="replies-container">
    <!-- Toggle button to show/hide replies -->
    <div 
      v-if="replies.length > 0 || showReplyForm" 
      class="replies-header code-font" 
      @click="toggleReplies"
    >
      <div class="d-flex align-items-center">
        <i :class="repliesVisible ? 'bi bi-chevron-down' : 'bi bi-chevron-right'" class="me-2"></i>
        <span>{{ replies.length }} {{ replies.length === 1 ? 'Reply' : 'Replies' }}</span>
        <span class="code-comment ms-2">// Click to {{ repliesVisible ? 'collapse' : 'expand' }}</span>
      </div>
    </div>

    <!-- Replies List -->
    <div v-if="repliesVisible" class="replies-list">
      <!-- Individual replies -->
      <div 
        v-for="reply in sortedReplies" 
        :key="reply.id" 
        class="reply-item"
        :class="{ 'nested-reply': reply.parentReplyId }"
      >
        <div class="terminal-panel reply-card mb-3">
          <div class="terminal-header">
            <div class="terminal-dots">
              <span class="dot red"></span>
              <span class="dot yellow"></span>
              <span class="dot green"></span>
            </div>
            <div class="d-flex align-items-center">
              <span class="terminal-title">reply_{{ reply.id.substring(0, 8) }}.js</span>
              <span class="ms-2 badge bg-secondary code-font">{{ formatDate(reply.timestamp) }}</span>
            </div>
          </div>

          <div class="terminal-body">
            <div class="reply-header d-flex align-items-center mb-2">
              <img
                :src="reply.user.photoURL || '/api/placeholder/32/32'"
                alt="Profile"
                class="profile-image me-2"
              />
              <span class="reply-user-name code-font">{{ reply.user.name }}</span>
              <span v-if="reply.parentReplyId" class="ms-2 code-comment">
                // replying to {{ getParentUserName(reply.parentReplyId) }}
              </span>
            </div>

            <div class="reply-content code-font mb-2">
              {{ reply.content }}
            </div>

            <div class="reply-actions d-flex align-items-center">
              <!-- Like button -->
              <button 
                class="btn btn-sm action-btn like-btn" 
                @click="toggleLike(reply)"
                :class="{ 'liked': isReplyLiked(reply) }"
              >
                <i class="bi" :class="isReplyLiked(reply) ? 'bi-heart-fill' : 'bi-heart'"></i>
                <span class="ms-1">{{ reply.likes?.length || 0 }}</span>
              </button>

              <!-- Reply to reply button -->
              <button 
                class="btn btn-sm action-btn reply-btn ms-2" 
                @click="showReplyToReply(reply)"
              >
                <i class="bi bi-reply"></i>
                <span class="ms-1">Reply</span>
              </button>
            </div>

            <!-- Reply form for replying to this specific reply -->
            <div v-if="activeReplyId === reply.id" class="reply-to-reply-form mt-3">
              <textarea
                class="form-control reply-textarea code-font"
                placeholder="// Your reply here..."
                v-model="replyToReplyContent"
                rows="2"
              ></textarea>
              <div class="d-flex justify-content-end mt-2">
                <button 
                  class="btn btn-sm btn-outline-secondary me-2"
                  @click="cancelReplyToReply"
                >
                  <span class="code-font">cancel()</span>
                </button>
                <button
                  class="btn btn-sm reply-submit-btn"
                  :disabled="!replyToReplyContent.trim()"
                  @click="submitReplyToReply(reply)"
                >
                  <span class="code-font">send()</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Show more replies button (if needed) -->
      <div v-if="hasMoreReplies" class="text-center mb-3">
        <button 
          class="btn btn-sm btn-outline-secondary load-more-btn"
          @click="loadMoreReplies"
        >
          <i class="bi bi-three-dots"></i>
          <span class="code-font ms-1">load_more()</span>
        </button>
      </div>
    </div>

    <!-- Reply form -->
    <div class="reply-form-container" v-if="showReplyForm">
      <div class="terminal-panel reply-form mb-3">
        <div class="terminal-header">
          <div class="terminal-dots">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <div class="terminal-title">new_reply.js</div>
        </div>

        <div class="terminal-body">
          <div class="d-flex align-items-center mb-2">
            <img
              :src="currentUserPhoto || '/api/placeholder/32/32'"
              alt="Profile"
              class="profile-image me-2"
            />
            <span class="code-font">{{ currentUserName }}</span>
            <span class="ms-2 code-comment">// Add your thoughts</span>
          </div>

          <textarea
            class="form-control reply-textarea code-font"
            placeholder="console.log('Your reply here...');"
            v-model="newReplyContent"
            rows="3"
          ></textarea>

          <div class="d-flex justify-content-end mt-3">
            <button 
              class="btn btn-sm btn-outline-secondary me-2"
              @click="cancelReply"
            >
              <span class="code-font">cancel()</span>
            </button>
            <button
              class="btn btn-sm reply-submit-btn"
              :disabled="!newReplyContent.trim()"
              @click="submitReply"
            >
              <span class="code-font">submit()</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Reply Button -->
    <div v-if="!showReplyForm" class="text-center mb-3">
      <button 
        class="btn btn-sm add-reply-btn"
        @click="showReplyForm = true"
      >
        <i class="bi bi-chat-left-text me-1"></i>
        <span class="code-font">add_reply()</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  orderBy,
  limit,
  startAfter
} from "firebase/firestore";
import { db, auth , CurrUser } from "@/firebase";

const props = defineProps({
  postId: {
    type: String,
    required: true
  },
  formatDate: {
    type: Function,
    required: true
  },
  initialVisibility: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle-replies']);

// State variables
const replies = ref([]);
const repliesVisible = ref(props.initialVisibility);
const showReplyForm = ref(false);
const newReplyContent = ref('');
const activeReplyId = ref(null);
const replyToReplyContent = ref('');
const lastVisible = ref(null);
const hasMoreReplies = ref(false);
const repliesPerPage = 5;
const userData = CurrUser;

// Current user info
const currentUserName = computed(() => {
  return CurrUser.value.name
});

const currentUserPhoto = computed(() => {
  return CurrUser.value.photoURL || null;
});

// Sort replies with direct replies first, then nested replies
const sortedReplies = computed(() => {
  return [...replies.value].sort((a, b) => {
    // First sort by parent/child status
    if (!a.parentReplyId && b.parentReplyId) return -1;
    if (a.parentReplyId && !b.parentReplyId) return 1;
    
    // Then sort by timestamp (newest first)
    return b.timestamp - a.timestamp;
  });
});

// Check if the current user has liked a reply
function isReplyLiked(reply) {
  if (!reply.likes || !auth.currentUser) return false;
  return reply.likes.includes(auth.currentUser.uid);
}

// Toggle reply visibility
function toggleReplies() {
  repliesVisible.value = !repliesVisible.value;
  emit('toggle-replies', repliesVisible.value);
  if (repliesVisible.value && replies.value.length === 0) {
    fetchReplies();
  }
}

// Show reply form for replying to a specific reply
function showReplyToReply(reply) {
  activeReplyId.value = reply.id;
  replyToReplyContent.value = '';
}

// Cancel reply to reply
function cancelReplyToReply() {
  activeReplyId.value = null;
  replyToReplyContent.value = '';
}

// Cancel main reply
function cancelReply() {
  showReplyForm.value = false;
  newReplyContent.value = '';
}

// Get the username of a parent reply
function getParentUserName(parentReplyId) {
  const parentReply = replies.value.find(r => r.id === parentReplyId);
  return parentReply ? parentReply.user.name : 'unknown';
}

// Fetch replies for the post
async function fetchReplies(nextBatch = false) {
  try {
    const repliesRef = collection(db, "postReplies");
    let repliesQuery;
    
    if (nextBatch && lastVisible.value) {
      repliesQuery = query(
        repliesRef,
        where("postId", "==", props.postId),
        orderBy("timestamp", "desc"),
        startAfter(lastVisible.value),
        limit(repliesPerPage)
      );
    } else {
      repliesQuery = query(
        repliesRef,
        where("postId", "==", props.postId),
        orderBy("timestamp", "desc"),
        limit(repliesPerPage)
      );
    }

    const snapshot = await getDocs(repliesQuery);
    
    // Check if there are more replies to load
    if (snapshot.docs.length === repliesPerPage) {
      lastVisible.value = snapshot.docs[snapshot.docs.length - 1];
      hasMoreReplies.value = true;
    } else {
      hasMoreReplies.value = false;
    }

    const newReplies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    }));

    if (nextBatch) {
      replies.value = [...replies.value, ...newReplies];
    } else {
      replies.value = newReplies;
    }
  } catch (error) {
    console.error("Error fetching replies:", error);
  }
}

// Load more replies
function loadMoreReplies() {
  fetchReplies(true);
}

// Submit a new reply
async function submitReply() {
  if (!newReplyContent.value.trim() || !auth.currentUser) return;

  try {
    const replyData = {
      postId: props.postId,
      content: newReplyContent.value,
      user: {
        id: auth.currentUser.uid,
        name: currentUserName.value,
        photoURL: currentUserPhoto.value,
      },
      timestamp: serverTimestamp(),
      likes: []
    };

    // Add the reply to the postReplies collection
    const replyRef = await addDoc(collection(db, "postReplies"), replyData);

    // Update the post's replies array with the new reply ID
    await updateDoc(doc(db, "posts", props.postId), {
      replies: arrayUnion(replyRef.id)
    });

    // Reset form and add the new reply to the local state
    newReplyContent.value = '';
    showReplyForm.value = false;

    // Refresh replies to include the new one
    fetchReplies();
  } catch (error) {
    console.error("Error submitting reply:", error);
  }
}

// Submit a reply to another reply
async function submitReplyToReply(parentReply) {
  if (!replyToReplyContent.value.trim() || !auth.currentUser) return;

  try {
    const replyData = {
      postId: props.postId,
      parentReplyId: parentReply.id,
      content: replyToReplyContent.value,
      user: {
        id: auth.currentUser.uid,
        name: auth.currentUser.displayName || 'Anonymous',
        photoURL: auth.currentUser.photoURL,
      },
      timestamp: serverTimestamp(),
      likes: []
    };

    // Add the reply to the postReplies collection
    const replyRef = await addDoc(collection(db, "postReplies"), replyData);

    // Update the post's replies array with the new reply ID
    await updateDoc(doc(db, "posts", props.postId), {
      replies: arrayUnion(replyRef.id)
    });

    // Reset form
    replyToReplyContent.value = '';
    activeReplyId.value = null;

    // Refresh replies to include the new one
    fetchReplies();
  } catch (error) {
    console.error("Error submitting reply to reply:", error);
  }
}

// Toggle like on a reply
async function toggleLike(reply) {
  if (!auth.currentUser) return;
  
  const userId = auth.currentUser.uid;
  const replyRef = doc(db, "postReplies", reply.id);
  
  try {
    if (isReplyLiked(reply)) {
      // Remove like
      await updateDoc(replyRef, {
        likes: arrayRemove(userId)
      });
      
      // Update local state
      const replyIndex = replies.value.findIndex(r => r.id === reply.id);
      if (replyIndex !== -1) {
        replies.value[replyIndex].likes = replies.value[replyIndex].likes.filter(id => id !== userId);
      }
    } else {
      // Add like
      await updateDoc(replyRef, {
        likes: arrayUnion(userId)
      });
      
      // Update local state
      const replyIndex = replies.value.findIndex(r => r.id === reply.id);
      if (replyIndex !== -1) {
        if (!replies.value[replyIndex].likes) {
          replies.value[replyIndex].likes = [];
        }
        replies.value[replyIndex].likes.push(userId);
      }
    }
  } catch (error) {
    console.error("Error toggling like:", error);
  }
}

// Watch for changes in initialVisibility prop
watch(() => props.initialVisibility, (newValue) => {
  repliesVisible.value = newValue;
  if (repliesVisible.value && replies.value.length === 0) {
    fetchReplies();
  }
});

// Load initial data on mount
onMounted(() => {
  // Only fetch replies if the component is mounted with the replies visible by default
  if (repliesVisible.value) {
    fetchReplies();
  }
});
</script>

<style scoped>
/* Import a monospace font for code */
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap');

.replies-container {
  padding-left: 12px;
  margin-top: 16px;
  border-left: 2px dashed var(--border-color);
}

.replies-header {
  padding: 6px 12px;
  margin-bottom: 12px;
  cursor: pointer;
  border-radius: 6px;
  background-color: var(--navbar-bg);
  display: inline-flex;
  font-size: 13px;
  transition: background-color 0.2s;
}

.replies-header:hover {
  background-color: var(--chat-input-bg);
}

.reply-item {
  margin-bottom: 8px;
}

.nested-reply {
  margin-left: 24px;
  position: relative;
}

.nested-reply::before {
  content: '';
  position: absolute;
  left: -24px;
  top: 12px;
  width: 20px;
  height: 2px;
  background-color: var(--border-color);
}

.reply-card {
  margin-bottom: 12px;
}

.reply-textarea {
  background-color: var(--chat-input-bg);
  border: 1px solid var(--border-color);
  resize: none;
  font-family: 'Fira Code', monospace;
  font-size: 13px;
}

.reply-content {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 13px;
}

.reply-textarea:focus {
  background-color: var(--input-focus-bg);
  box-shadow: 0 0 0 0.25rem var(--input-focus-shadow);
}

.terminal-panel {
  background-color: var(--card-bg);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
}

.terminal-header {
  background-color: var(--navbar-bg);
  padding: 6px 10px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.terminal-body {
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.terminal-dots {
  display: flex;
  gap: 4px;
  margin-right: 10px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.red { background-color: #ff5f57; }
.yellow { background-color: #febc2e; }
.green { background-color: #28c840; }

.terminal-title {
  font-family: 'Fira Code', monospace;
  font-size: 12px;
  color: var(--text-secondary);
}

.code-font {
  font-family: 'Fira Code', monospace !important;
  font-size: 13px;
}

.code-comment {
  color: var(--code-comment);
  font-family: 'Fira Code', monospace;
  font-size: 11px;
}

.profile-image {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  object-fit: cover;
}

.reply-user-name {
  font-weight: 500;
}

.action-btn {
  padding: 2px 6px;
  font-size: 12px;
  border-radius: 4px;
  background-color: var(--navbar-bg);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: var(--chat-input-bg);
}

.liked {
  color: #ff3e66;
}

.reply-submit-btn {
  background: var(--button-gradient-bg);
  color: white;
  font-weight: 500;
  font-size: 12px;
}

.reply-submit-btn:hover {
  color: white;
  opacity: 0.9;
}

.add-reply-btn {
  background-color: var(--accent-color);
  color: white;
  padding: 4px 10px;
  font-size: 12px;
  transition: all 0.2s;
}

.add-reply-btn:hover {
  opacity: 0.9;
}

.load-more-btn {
  font-size: 12px;
  padding: 4px 10px;
}
</style>