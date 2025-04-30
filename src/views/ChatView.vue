<template>
  <div class="hacker-terminal">
    <!-- Terminal Header -->
    <div class="terminal-header">
      <div class="terminal-title">TERMINAL_CHAT - MULTI-WINDOW MODE</div>
      <div class="terminal-actions">
        <button class="terminal-btn-sm" @click="toggleSidebar">
          [ {{ sidebarCollapsed ? "SHOW" : "HIDE" }}_SIDEBAR ]
        </button>
        <button class="terminal-btn-sm" @click="minimizeAllWindows">
          [ MINIMIZE_ALL ]
        </button>
        <button class="terminal-btn-sm" @click="tileWindows">
          [ TILE_WINDOWS ]
        </button>
      </div>
    </div>

    <!-- Main Terminal Content -->
    <div class="terminal-content d-flex">
      <!-- Left Sidebar - Collapsible -->
      <div class="terminal-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="terminal-section">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="terminal-heading">COMMUNICATIONS_</div>
          </div>
          
          <!-- Add search and filter controls -->
          <div class="search-controls mb-3">
            <div class="search-box">
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Search users..."
                class="terminal-input search-input"
              >
            </div>
            <div class="filter-options">
              <button 
                :class="['terminal-btn-sm', { active: userFilter === 'all' }]"
                @click="userFilter = 'all'"
              >
                ALL
              </button>
              <button 
                :class="['terminal-btn-sm', { active: userFilter === 'following' }]"
                @click="userFilter = 'following'"
              >
                FOLLOWING
              </button>
            </div>
          </div>
          
          <button
            class="terminal-btn-sm"
            style="width: 100%"
            @click="showGroupModal = true"
          >
            {{ sidebarCollapsed ? "+" : "[NEW_GROUP]" }}
          </button>

          <div class="terminal-section mt-4">
            <div class="terminal-heading">USERS_</div>
            <ul class="terminal-list">
              <li
                v-for="user in filteredUsers"
                :key="user.id"
                class="terminal-list-item"
                @click="toggleChat(user, false)"
                :class="{
                  active: activeChats.some(
                    (chat) => !chat.isGroup && chat.entity.id === user.id
                  ),
                  'has-unread': hasUnreadMessagesForEntity(user.id, false),
                  'is-following': user.followers?.includes(CurrUser.value?.uid)
                }"
              >
                <div class="d-flex align-items-center">
                  <img
                    v-bind:src="user.photoURL"
                    alt="User Avatar"
                    class="terminal-avatar"
                  />
                  <div class="terminal-user-info">
                    <div class="terminal-username">{{ user.name }}</div>
                    <div class="terminal-user-handle">@{{ user.username }}</div>
                    <OnlineDot :user="user" />
                  </div>
                </div>
                <div class="status-indicators">
                  <div v-if="user.followers?.includes(CurrUser.value?.uid)" 
                       class="following-indicator">
                    ★
                  </div>
                  <div v-if="hasUnreadMessagesForEntity(user.id, false)" 
                       class="unread-indicator">
                    !
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div class="terminal-section mt-4">
            <div class="terminal-heading">GROUPS_</div>
            <ul class="terminal-list">
              <li
                v-for="group in userGroups"
                :key="group.id"
                class="terminal-list-item"
                @click="toggleChat(group, true)"
                :class="{
                  active: activeChats.some(
                    (chat) => chat.isGroup && chat.entity.id === group.id
                  ),
                  'has-unread': hasUnreadMessagesForEntity(group.id, true)
                }"
              >
                <div class="d-flex align-items-center">
                  <img
                    v-bind:src="group.photoURL"
                    alt="Group Avatar"
                    class="terminal-avatar"
                  />
                  <div class="terminal-user-info">
                    <div class="terminal-username">{{ group.name }}</div>
                  </div>
                </div>
                <div v-if="hasUnreadMessagesForEntity(group.id, true)" class="unread-indicator">!</div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Main Chat Area - Multiple Windows -->
      <div class="terminal-workspace flex-grow-1" ref="chatWorkspace">
        <!-- Each chat window -->
        <div
          v-for="(chat, index) in activeChats"
          :key="`${chat.isGroup ? 'group' : 'user'}-${chat.entity.id}`"
          class="chat-window"
          :class="{
            minimized: chat.minimized,
            focused: focusedChatIndex === index,
            'has-new-message': unreadMessages[getUnreadKey(chat)]?.length > 0
          }"
          :style="chat.position"
          @click="setFocusedChat(index)"
        >
          <!-- Chat Window Header -->
          <div
            class="chat-window-header"
            @mousedown="startDragWindow($event, index)"
          >
            <div class="chat-window-info">
              <img
                :src="chat.entity.photoURL || 'default-avatar-url'"
                class="chat-window-avatar"
                @click="chat.isGroup ? openGroupSettings(chat.entity.id) : $router.push('/userprofile/'+chat.entity.id)"
              />
              <div class="chat-window-title">
                {{ chat.isGroup ? chat.entity.name : chat.entity.name }}
                <span v-if="unreadMessages[getUnreadKey(chat)]?.length > 0" class="unread-count">
                  ({{ unreadMessages[getUnreadKey(chat)].length }})
                </span>
              </div>
              <div style="margin-left: 10px">
                <button
                  class="window-control only"
                  @click.stop="keepOnlyThisWindow(index)"
                >
                  [ONLY]
                </button>
              </div>
            </div>
            <div>
              <div class="window-dots">
                <span class="dot dot-green window-control" @click.stop="toggleMinimize(index)"></span>
                <span class="dot dot-yellow window-control" @click.stop="resizeWindow(index)"></span>
                <span class="dot dot-red close window-control" @click.stop="closeChat(index)"></span>
              </div>
            </div>
          </div>
          <!-- Chat Window Content -->
          <div class="chat-window-content" v-show="!chat.minimized">
            <div class="chat-messages"
              :ref="'chatMessages-' + index"
            >
              <div
                v-for="message in chat.messages"
                :key="message.id"
                class="terminal-message"
                :class="{ 'user-message': message.senderId === currUserId }"
              >
                <div class="message-user-info">
                  <img
                    :src="getUserAvatar(message.senderId, chat)"
                    class="message-avatar"
                  />
                  <span class="message-username">{{
                    getUserName(message.senderId, chat)
                  }}</span>
                </div>
                <div class="message-command">
                  <span class="command-prompt">$</span>
                  <span v-if="editingMessageId === message.id">
                    <input
                      v-model="editingMessageText"
                      class="edit-message-input"
                      @keyup.enter="saveEditedMessage(chat, message)"
                      @blur="cancelEditing()"
                    />
                  </span>
                  <span v-else-if="message.imageUrl">
                    <img
                      :src="message.imageUrl"
                      class="message-image"
                      @click.stop="viewImage(message.imageUrl)"
                    />
                  </span>
                  <span v-else class="command-text">{{ message.text }}</span>
                </div>
                <div class="message-timestamp">
                  [{{ formatTimestamp(message.createdAt) }}]
                </div>
                <div v-if="message.senderId === currUserId" class="message-actions">
                  <button class="message-action-btn" @click="startEditingMessage(message)">
                    ✎
                  </button>
                  <button class="message-action-btn" @click="deleteMessage(chat, message)">
                    🗑
                  </button>
                </div>
              </div>
              
              <!-- Unread messages divider -->
              <div v-if="unreadMessages[getUnreadKey(chat)]?.length > 0" class="unread-messages-divider">
                <span>---- NEW MESSAGES ({{ unreadMessages[getUnreadKey(chat)].length }}) ----</span>
              </div>
              
              <!-- Show unread messages after the divider -->
              <div
                v-for="message in unreadMessages[getUnreadKey(chat)]"
                :key="message.id"
                class="terminal-message unread-message"
                :class="{ 'user-message': message.senderId === currUserId }"
              >
                <div class="message-user-info">
                  <img
                    :src="getUserAvatar(message.senderId, chat)"
                    class="message-avatar"
                  />
                  <span class="message-username">{{
                    getUserName(message.senderId, chat)
                  }}</span>
                </div>
                <div class="message-command">
                  <span class="command-prompt">$</span>
                  <span v-if="message.imageUrl">
                    <img
                      :src="message.imageUrl"
                      class="message-image"
                      @click.stop="viewImage(message.imageUrl)"
                    />
                  </span>
                  <span v-else class="command-text">{{ message.text }}</span>
                </div>
                <div class="message-timestamp">
                  [{{ formatTimestamp(message.createdAt) }}]
                </div>
              </div>
            </div>

            <!-- Chat Input -->
            <form @submit.prevent="sendMessage(index)" class="chat-input-form">
              <div class="input-prompt">
                <span>@{{ chat.entity.username || chat.entity.name }}:~$</span>
              </div>
              <input
                v-model="chat.newMessage"
                class="terminal-input"
                placeholder="Type command..."
                @focus="setFocusedChat(index)"
              />
              <button class="terminal-btn-sm" type="submit">[ SEND ]</button>

              <!-- Styled Image Upload Button -->
              <label class="image-upload-button">
                [ UPLOAD IMAGE ]
                <input
                  type="file"
                  accept="image/*"
                  class="image-upload-input"
                  @change="uploadImage($event, index)"
                />
              </label>
            </form>
          </div>

          <!-- Resize Handle -->
          <div
            class="resize-handle"
            @mousedown="startResizeWindow($event, index)"
          ></div>
        </div>

        <!-- Empty state message when no chats are open -->
        <div v-if="activeChats.length === 0" class="no-chats-message">
          <div class="terminal-text">
            <div class="terminal-line">
              [ NO ACTIVE COMMUNICATION CHANNELS ]
            </div>
            <div class="terminal-line">
              SELECT A CONTACT OR GROUP FROM THE SIDEBAR
            </div>
            <div class="terminal-line blink">_</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Group Creation Modal -->
    <div
      class="modal fade"
      id="groupModal"
      tabindex="-1"
      aria-labelledby="groupModalLabel"
      aria-hidden="true"
      ref="groupModal"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content terminal-modal">
          <form @submit.prevent="createGroup">
            <div class="modal-header terminal-modal-header">
              <h5 class="modal-title terminal-modal-title">CREATE_NEW_GROUP</h5>
              <button
                type="button"
                class="terminal-close-btn"
                data-bs-dismiss="modal"
                aria-label="Close"
                @click="showGroupModal = false"
              >
                x
              </button>
            </div>
            <div class="modal-body terminal-modal-body">
              <input
                v-model="groupName"
                class="terminal-modal-input mb-3"
                placeholder="GROUP_NAME"
              />
              <div class="terminal-modal-section">
                <div class="terminal-modal-label">SELECT_MEMBERS:</div>
                <div class="terminal-checkbox-list">
                  <div
                    v-for="user in users"
                    :key="user.id"
                    class="terminal-checkbox-item"
                  >
                    <input
                      class="terminal-checkbox"
                      type="checkbox"
                      :id="'user-' + user.id"
                      :value="user.id"
                      v-model="groupMembers"
                    />
                    <label
                      class="terminal-checkbox-label"
                      :for="'user-' + user.id"
                      >{{ user.name }}</label
                    >
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer terminal-modal-footer">
              <button type="submit" class="terminal-btn">
                [ CREATE_GROUP ]
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Image Viewer Modal -->
    <div v-if="imageViewer.visible" class="image-viewer-overlay" @click="closeImageViewer">
      <img :src="imageViewer.imageUrl" class="image-viewer-image" />
    </div>

    <!-- Group Settings Component -->
    <GroupSettings
      v-if="showGroupSettings"
      :group="selectedGroup"
      :userCache="userCache"
      @close="showGroupSettings = false"
      @group-left="handleGroupLeft"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, nextTick, computed } from "vue";
import { db, auth, notificationService, NotificationType } from "@/firebase";
import { getAccountsInfoBy } from "@/Functions";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  where,
  getDocs,
  writeBatch,
  getDoc,
  setDoc
} from "firebase/firestore";
import { Modal } from "bootstrap";
import OnlineDot from "@/components/OnlineDot.vue";
import { handleImageUpload, getImageUrl } from "@/cloudinary.js";
import GroupSettings from '@/components/GroupSettings.vue';

// States
const users = ref([]);
const userGroups = ref([]);
const currUserId = auth.currentUser.uid;
const groupName = ref("");
const groupMembers = ref([]);
const showGroupModal = ref(false);
const sidebarCollapsed = ref(false);
const chatWorkspace = ref(null);

// Multiple chats management
const activeChats = ref([]);
const focusedChatIndex = ref(-1);
const draggingWindow = ref(false);
const draggedWindowIndex = ref(-1);
const dragOffset = ref({ x: 0, y: 0 });

// Resizing windows
const resizingWindow = ref(false);
const resizedWindowIndex = ref(-1);
const resizeStart = ref({ x: 0, y: 0 });

// User data cache
const userCache = ref({});
const lastReadTimestamps = ref({});

// Image Viewer
const imageViewer = ref({
  visible: false,
  imageUrl: "",
});

// Editing messages
const editingMessageId = ref(null);
const editingMessageText = ref("");

// Unread messages - using an object with chat-specific keys
const unreadMessages = ref({});

// Global message listeners and all unread messages
const globalMessageListeners = ref({});
const allUnreadMessages = ref({});

// Current chat type
const currentChatType = ref({
  isGroup: false,
  chatId: null
});

// Group settings
const showGroupSettings = ref(false);
const selectedGroup = ref(null);

// Search and filter controls
const searchQuery = ref("");
const userFilter = ref("all");

// Get a unique key for each chat for tracking unread messages
function getUnreadKey(chat) {
  return chat.isGroup 
    ? `group-${chat.entity.id}` 
    : `user-${chat.entity.id}`;
}

// Check if there are unread messages for a specific entity
function hasUnreadMessagesForEntity(entityId, isGroup) {
  const key = isGroup ? `group-${entityId}` : `user-${entityId}`;
  return (unreadMessages.value[key]?.length > 0) || 
         (allUnreadMessages.value[key]?.length > 0);
}

// Add this computed property
const filteredUsers = computed(() => {
  return users.value.filter(user => {
    // Search filter
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.value.toLowerCase());

    // Following filter
    const matchesFilter = 
      userFilter.value === 'all' || 
      (userFilter.value === 'following' && user.followers?.includes(CurrUser.value?.uid));

    return matchesSearch && matchesFilter;
  });
});

onMounted(() => {
  // Fetch all users excluding the current user
  const { filteredAccounts, unsubscribe } = getAccountsInfoBy({});

  watch(
    filteredAccounts,
    (newUsers) => {
      users.value = newUsers.filter((u) => u.id !== currUserId);
      // Cache user data
      newUsers.forEach((user) => {
        userCache.value[user.id] = {
          name: user.name,
          photoURL: user.photoURL,
          username: user.username
        };
      });
      // Add current user to cache
      const currentUser = newUsers.find((u) => u.id === currUserId);
      if (currentUser) {
        userCache.value[currUserId] = {
          name: currentUser.name,
          photoURL: currentUser.photoURL,
          username: currentUser.username
        };
      }
    },
    { immediate: true }
  );

  onUnmounted(() => unsubscribe());

  // Fetch user's groups
  const groupsQuery = query(collection(db, "groups"));

  onSnapshot(groupsQuery, (snapshot) => {
    userGroups.value = snapshot.docs
      .map((doc) => {
        const groupData = doc.data();
        return {
          id: doc.id,
          ...groupData,
          photoURL:
            groupData.photoURL ||
            "https://res.cloudinary.com/duwrqxvey/image/upload/v1745712112/people-icon-business-corporate-team-working-together-social-network-group-logo-symbol-crowd-sign-leadership-community-conce-118388147_wpfwke.jpg",
        };
      })
      .filter((group) => group.members.includes(currUserId));
  });

  // Setup modal
  const groupModalElement = document.getElementById("groupModal");
  if (groupModalElement) {
    const groupModal = new Modal(groupModalElement);

    watch(showGroupModal, (newValue) => {
      if (newValue) {
        groupModal.show();
      } else {
        groupModal.hide();
      }
    });
  }

  // Window drag handlers
  document.addEventListener("mousemove", handleWindowDrag);
  document.addEventListener("mouseup", stopWindowDrag);

  // Resize handlers
  document.addEventListener("mousemove", handleWindowResize);
  document.addEventListener("mouseup", stopResizeWindow);

  // Setup global message listeners
  setupGlobalMessageListeners();

  // Watch for changes in users and groups to update listeners
  watch([() => users.value, () => userGroups.value], () => {
    setupGlobalMessageListeners();
  });

  // Clean up event listeners
  onUnmounted(() => {
    document.removeEventListener("mousemove", handleWindowDrag);
    document.removeEventListener("mouseup", stopWindowDrag);
    document.removeEventListener("mousemove", handleWindowResize);
    document.removeEventListener("mouseup", stopResizeWindow);

    // Clean up global message listeners
    Object.values(globalMessageListeners.value).forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
  });

  
  // Load saved timestamps from localStorage
  const savedTimestamps = localStorage.getItem('lastReadTimestamps');
  if (savedTimestamps) {
    lastReadTimestamps.value = JSON.parse(savedTimestamps);
  }

  // Watch for changes to timestamps and save them
  watch(lastReadTimestamps.value, (newVal) => {
    localStorage.setItem('lastReadTimestamps', JSON.stringify(newVal));
  }, { deep: true });

  // Setup group invite listener
  const unsubscribeInvites = setupGroupInviteListener();

  // Update cleanup
  onUnmounted(() => {
    if (unsubscribeInvites) {
      unsubscribeInvites();
    }
  });
});

// Scroll to the last message, including unread messages
function scrollToLastMessage(chatIndex) {
  nextTick(() => {
    // Only scroll if this is the focused chat
    if (focusedChatIndex.value !== chatIndex) return;

    const chatContainer = document.querySelector(`.chat-window:nth-child(${chatIndex + 1}) .chat-messages`);
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });
}

// Handle message notification
async function handleMessageNotification(chat, message) {
  if (message.senderId === currUserId) return;

  const sender = {
    id: message.senderId,
    displayName: getUserName(message.senderId, chat),
    photoURL: getUserAvatar(message.senderId, chat)
  };

  await notificationService.sendMessageNotification(
    chat.entity.id,
    message,
    sender
  );
}

// Fix the clearNotifications function
async function clearNotifications(chat, isGroup) {
  // Early return if chat is undefined
  if (!chat) return;

  const userId = chat.entity?.id;
  // Early return if no valid user/group id
  if (!userId) return;

  const chatId = isGroup ? chat.entity.id : [currUserId, chat.entity.id].sort().join('_');
  const notificationsQuery = query(
    collection(db, "users", currUserId, "notifications"),
    where("type", "==", "message"),
    where("chatId", "==", chatId),
    where("isGroup", "==", isGroup)
  );

  const snapshot = await getDocs(notificationsQuery);
  const batch = writeBatch(db);

  snapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}

// Toggle chat window visibility
function toggleChat(entity, isGroup) {
  // Check if the chat is already open
  const existingIndex = activeChats.value.findIndex(
    (chat) => chat.isGroup === isGroup && chat.entity.id === entity.id
  );

  if (existingIndex !== -1) {
    // Chat is already open, focus it
    setFocusedChat(existingIndex);
    if (activeChats.value[existingIndex].minimized) {
      activeChats.value[existingIndex].minimized = false;
    }
  } else {
    // Open new chat window
    const newChat = {
      entity: entity,
      isGroup: isGroup,
      messages: [],
      newMessage: "",
      minimized: false,
      position: {
        left: `${(activeChats.value.length * 40) % 300}px`,
        top: `${(activeChats.value.length * 30) % 200}px`,
        width: "400px",
        height: "500px",
        zIndex: activeChats.value.length + 1,
      },
      unsubscribe: null,
    };

    // Move any unread messages to the chat
    const key = isGroup ? `group-${entity.id}` : `user-${entity.id}`;
    if (allUnreadMessages.value[key]?.length > 0) {
      unreadMessages.value[key] = allUnreadMessages.value[key];
      allUnreadMessages.value[key] = [];
    }

    activeChats.value.push(newChat);
    const newChatIndex = activeChats.value.length - 1;
    setFocusedChat(newChatIndex);

    // Start listening for messages
    if (isGroup) {
      loadGroupMessages(newChatIndex);
    } else {
      loadUserMessages(newChatIndex);
    }
  }
}

// Handle new messages
function handleNewMessages(chatIndex, messages) {
  const chat = activeChats.value[chatIndex];
  if (!chat) return;

  const chatKey = getUnreadKey(chat);
  const isCurrentlyFocused = focusedChatIndex.value === chatIndex && !chat.minimized;
  const lastReadTime = lastReadTimestamps.value[chatKey] || new Date(0);

  // Split messages into read and unread based on timestamp
  const { readMessages, unreadMessages: newUnread } = messages.reduce(
    (acc, msg) => {
      const messageTime = msg.createdAt.toDate();
      if (messageTime <= lastReadTime || msg.senderId === currUserId) {
        acc.readMessages.push(msg);
      } else {
        acc.unreadMessages.push(msg);
      }
      return acc;
    },
    { readMessages: [], unreadMessages: [] }
  );

  // Update the chat messages
  chat.messages = readMessages;
  
  // Update unread messages for this chat
  if (newUnread.length > 0) {
    unreadMessages.value[chatKey] = newUnread;
  }

  // If chat is focused, mark messages as read
  if (isCurrentlyFocused) {
    markMessagesAsRead(chat);
  }

  // Scroll if focused
  if (isCurrentlyFocused) {
    scrollToLastMessage(chatIndex);
  }
}

async function markMessagesAsRead(chat) {
  const chatKey = getUnreadKey(chat);
  lastReadTimestamps.value[chatKey] = new Date();
  // Move unread messages to read messages
  if (unreadMessages.value[chatKey]?.length > 0) {
    chat.messages = [...chat.messages, ...unreadMessages.value[chatKey]];
    unreadMessages.value[chatKey] = [];
  }
  await updateLastReadTime(chat);
}

// Update loadUserMessages function
function loadUserMessages(chatIndex) {
  const chat = activeChats.value[chatIndex];
  if (!chat || chat.isGroup) return;

  const chatId = [currUserId, chat.entity.id].sort().join("_");

  const lastReadRef = doc(db, "chats", chatId, "lastRead", currUserId);
  getDoc(lastReadRef).then(lastReadDoc => {
    const lastRead = lastReadDoc.exists() 
      ? lastReadDoc.data().timestamp?.toDate() 
      : new Date(0);
    
    lastReadTimestamps.value[getUnreadKey(chat)] = lastRead;
  });

  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    handleNewMessages(chatIndex, messages);
  });

  // Pass the chat object and isGroup flag
  clearNotifications(chat, false);
  activeChats.value[chatIndex].unsubscribe = unsubscribe;
}

// Load messages for a group chat
function loadGroupMessages(chatIndex) {
  const chat = activeChats.value[chatIndex];
  if (!chat || !chat.isGroup) return;

  const groupId = chat.entity.id;

  const lastReadRef = doc(db, "groups", groupId, "lastRead", currUserId);
  getDoc(lastReadRef).then(lastReadDoc => {
    const lastRead = lastReadDoc.exists() 
      ? lastReadDoc.data().timestamp?.toDate() 
      : new Date(0);
    
    lastReadTimestamps.value[getUnreadKey(chat)] = lastRead;
  });

  const q = query(
    collection(db, "groups", groupId, "messages"),
    orderBy("createdAt")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    handleNewMessages(chatIndex, messages);
  });

  clearNotifications(chat.entity.id, true);
  activeChats.value[chatIndex].unsubscribe = unsubscribe;
}

// Send message from specific chat window
async function sendMessage(chatIndex) {
  const chat = activeChats.value[chatIndex];
  if (!chat || !chat.newMessage.trim()) return;

  await markMessagesAsRead(chat);

  const message = {
    text: chat.newMessage,
    senderId: currUserId,
    createdAt: new Date(),
  };

  let messageRef;
  if (!chat.isGroup) {
    const chatId = [currUserId, chat.entity.id].sort().join("_");
    messageRef = await addDoc(collection(db, "chats", chatId, "messages"), message);
  } else {
    const groupId = chat.entity.id;
    messageRef = await addDoc(collection(db, "groups", groupId, "messages"), message);
  }

  message.id = messageRef.id;
  await handleMessageNotification(chat, message);

  activeChats.value[chatIndex].newMessage = "";
  nextTick(() => scrollToLastMessage(chatIndex));
}

// Upload image in chat
async function uploadImage(event, chatIndex) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    // Upload the image to Cloudinary
    const publicId = await handleImageUpload(file);

    // Generate the image URL
    const imageUrl = getImageUrl(publicId);

    // Send the image URL as a message
    const chat = activeChats.value[chatIndex];
    if (!chat) return;

    if (!chat.isGroup) {
      const chatId = [currUserId, chat.entity.id].sort().join("_");
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: "[IMAGE]",
        imageUrl: imageUrl,
        senderId: currUserId,
        receiverId: chat.entity.id,
        createdAt: new Date(),
      });
    } else {
      const groupId = chat.entity.id;
      await addDoc(collection(db, "groups", groupId, "messages"), {
        text: "[IMAGE]",
        imageUrl: imageUrl,
        senderId: currUserId,
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Error uploading image:", error);
  }
}

// Open the image viewer
function viewImage(imageUrl) {
  imageViewer.value = {
    visible: true,
    imageUrl,
  };
}

// Close the image viewer
function closeImageViewer() {
  imageViewer.value = {
    visible: false,
    imageUrl: "",
  };
}

// Close chat window
function closeChat(index) {
  const chat = activeChats.value[index];
  if (!chat) return;
  
  // Clean up listeners
  if (chat.unsubscribe) {
    chat.unsubscribe();
  }

  // Reset current chat type if closing the focused chat
  if (focusedChatIndex.value === index) {
    currentChatType.value = {
      isGroup: false,
      chatId: null
    };
  }

  // Remove the chat
  activeChats.value.splice(index, 1);

  // Update focused chat if needed
  if (focusedChatIndex.value === index) {
    focusedChatIndex.value = activeChats.value.length > 0 ? activeChats.value.length - 1 : -1;
    // Update current chat type for new focused chat
    if (focusedChatIndex.value !== -1) {
      const newFocusedChat = activeChats.value[focusedChatIndex.value];
      currentChatType.value = {
        isGroup: newFocusedChat.isGroup,
        chatId: newFocusedChat.isGroup 
          ? newFocusedChat.entity.id 
          : [currUserId, newFocusedChat.entity.id].sort().join('_')
      };
    }
  } else if (focusedChatIndex.value > index) {
    focusedChatIndex.value--;
  }
}

function keepOnlyThisWindow(index) {
  // Get the chat to keep
  const chatToKeep = activeChats.value[index];

  // Unsubscribe from all other chats
  activeChats.value.forEach((chat, i) => {
    if (i !== index && chat.unsubscribe) {
      chat.unsubscribe();
    }
  });

  // Keep only the selected chat
  activeChats.value = [chatToKeep];

  // Update the focused chat index
  focusedChatIndex.value = 0;

  resizeWindow(0);
}

// Window management functions
function startDragWindow(event, index) {
  draggingWindow.value = true;
  draggedWindowIndex.value = index;

  const windowElement = event.currentTarget;
  const rect = windowElement.getBoundingClientRect();

  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };

  setFocusedChat(index);

  // Prevent text selection during drag
  event.preventDefault();
}

function handleWindowDrag(event) {
  if (!draggingWindow.value || draggedWindowIndex.value === -1) return;

  const workspace = chatWorkspace.value;
  if (!workspace) return;

  const workspaceRect = workspace.getBoundingClientRect();

  // Calculate new position
  let left = event.clientX - workspaceRect.left - dragOffset.value.x;
  let top = event.clientY - workspaceRect.top - dragOffset.value.y;

  // Ensure window stays within workspace
  left = Math.max(0, Math.min(left, workspaceRect.width - 200));
  top = Math.max(0, Math.min(top, workspaceRect.height - 50));

  // Update window position
  activeChats.value[draggedWindowIndex.value].position.left = `${left}px`;
  activeChats.value[draggedWindowIndex.value].position.top = `${top}px`;
}

function stopWindowDrag() {
  draggingWindow.value = false;
  draggedWindowIndex.value = -1;
}

function startResizeWindow(event, index) {
  resizingWindow.value = true;
  resizedWindowIndex.value = index;
  resizeStart.value = { x: event.clientX, y: event.clientY };

  // Prevent text selection during resize
  event.preventDefault();
}

function handleWindowResize(event) {
  if (!resizingWindow.value || resizedWindowIndex.value === -1) return;

  const chat = activeChats.value[resizedWindowIndex.value];
  if (!chat) return;

  const dx = event.clientX - resizeStart.value.x;
  const dy = event.clientY - resizeStart.value.y;

  // Update dimensions
  const newWidth = Math.max(300, parseInt(chat.position.width) + dx);
  const newHeight = Math.max(200, parseInt(chat.position.height) + dy);

  chat.position.width = `${newWidth}px`;
  chat.position.height = `${newHeight}px`;

  // Update starting point for next resize step
  resizeStart.value = { x: event.clientX, y: event.clientY };
}

function stopResizeWindow() {
  resizingWindow.value = false;
  resizedWindowIndex.value = -1;
}

async function setFocusedChat(index) {
  if (focusedChatIndex.value !== index) {
    focusedChatIndex.value = index;
    
    const chat = activeChats.value[index];
    if (chat) {
      // Update current chat type
      currentChatType.value = {
        isGroup: chat.isGroup,
        chatId: chat.isGroup ? chat.entity.id : [currUserId, chat.entity.id].sort().join('_')
      };

      await updateLastReadTime(chat);
      await clearNotifications(chat, chat.isGroup);
    }

    // Move focused window to top (highest z-index)
    const highestZ = Math.max(
      ...activeChats.value.map((chat) => parseInt(chat.position.zIndex) || 1)
    );

    activeChats.value[index].position.zIndex = highestZ + 1;
    scrollToLastMessage(index);
  }
}

// Update updateLastReadTime function
async function updateLastReadTime(chat) {
  if (!chat) return;

  const chatId = chat.isGroup 
    ? chat.entity.id 
    : [currUserId, chat.entity.id].sort().join('_');
  
  const collectionPath = chat.isGroup ? 'groups' : 'chats';
  const lastReadRef = doc(db, collectionPath, chatId, 'lastRead', currUserId);

  await setDoc(lastReadRef, {
    timestamp: new Date(),
    userId: currUserId
  });

  // Pass both parameters to clearNotifications
  await clearNotifications(chat, chat.isGroup);
}

function toggleMinimize(index) {
  activeChats.value[index].minimized = !activeChats.value[index].minimized;
  if (!activeChats.value[index].minimized) {
    setFocusedChat(index);
  }
}

function minimizeAllWindows() {
  activeChats.value.forEach((chat) => {
    chat.minimized = true;
  });
}

function tileWindows() {
  if (activeChats.value.length === 0) return;

  const workspace = chatWorkspace.value;
  if (!workspace) return;

  const workspaceRect = workspace.getBoundingClientRect();
  const workspaceWidth = workspaceRect.width;
  const workspaceHeight = workspaceRect.height;

  // Calculate grid dimensions based on number of windows
  const count = activeChats.value.length;
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  const windowWidth = Math.floor(workspaceWidth / cols);
  const windowHeight = Math.floor(workspaceHeight / rows);

  activeChats.value.forEach((chat, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;

    chat.position = {
      left: `${col * windowWidth}px`,
      top: `${row * windowHeight}px`,
      width: `${windowWidth - 5}px`,
      height: `${windowHeight - 5}px`,
      zIndex: 1,
    };

    chat.minimized = false;
  });
}

function resizeWindow(index) {
  const chat = activeChats.value[index];
  const workspace = chatWorkspace.value;
  if (!chat || !workspace) return;

  const workspaceRect = workspace.getBoundingClientRect();

  // Toggle between normal size and maximized
  if (chat.position.width === `${workspaceRect.width}px`) {
    // Restore to default size
    chat.position = {
      ...chat.position,
      width: "400px",
      height: "500px",
    };
  } else {
    // Maximize
    chat.position = {
      top: "0",
      left: "0",
      width: `${workspaceRect.width}px`,
      height: `${workspaceRect.height}px`,
    };
  }
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

// Helper functions
function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getUserAvatar(userId, chat) {
  if (userId === currUserId) {
    return userCache.value[currUserId]?.photoURL || "default-avatar-url";
  }

  if (!chat.isGroup) {
    return chat.entity.photoURL;
  }

  // For group messages, find the user in cache
  return userCache.value[userId]?.photoURL || "default-avatar-url";
}

function getUserName(userId, chat) {
  if (userId === currUserId) {
    return userCache.value[currUserId]?.name || "You";
  }

  if (!chat.isGroup) {
    return chat.entity.name;
  }

  // For group messages, find the user in cache
  return userCache.value[userId]?.name || "Unknown User";
}

// Create Group function
async function createGroup() {
  if (!groupName.value || groupMembers.value.length < 1) return;

  const groupDoc = await addDoc(collection(db, "groups"), {
    name: groupName.value,
    members: groupMembers.value.concat(currUserId),
    admins: [currUserId], // Creator is the first admin
    createdAt: new Date(),
    photoURL: "https://res.cloudinary.com/duwrqxvey/image/upload/v1745712112/people-icon-business-corporate-team-working-together-social-network-group-logo-symbol-crowd-sign-leadership-community-conce-118388147_wpfwke.jpg"
  });

  await addDoc(collection(db, "groups", groupDoc.id, "messages"), {
    text: "SYSTEM: Terminal group created. Welcome users.",
    senderId: currUserId,
    createdAt: new Date(),
  });

  groupName.value = "";
  groupMembers.value = [];
  showGroupModal.value = false;

  Modal.getInstance(document.getElementById("groupModal")).hide();
}

// Edit message functions
function startEditingMessage(message) {
  editingMessageId.value = message.id;
  editingMessageText.value = message.text;
}

function cancelEditing() {
  editingMessageId.value = null;
  editingMessageText.value = "";
}

async function saveEditedMessage(chat, message) {
  if (!editingMessageText.value.trim()) return;

  const messageRef = doc(
    db,
    chat.isGroup ? "groups" : "chats",
    chat.isGroup ? chat.entity.id : [currUserId, chat.entity.id].sort().join("_"),
    "messages",
    message.id
  );

  await updateDoc(messageRef, { text: editingMessageText.value });

  cancelEditing();
}

async function deleteMessage(chat, message) {
  const messageRef = doc(
    db,
    chat.isGroup ? "groups" : "chats",
    chat.isGroup ? chat.entity.id : [currUserId, chat.entity.id].sort().join("_"),
    "messages",
    message.id
  );

  await deleteDoc(messageRef);
}

// Add this near your other watch effects
watch(() => activeChats.value.map(chat => chat.messages), (newVal, oldVal) => {
  const changedIndex = newVal.findIndex((messages, index) => 
    messages.length !== (oldVal?.[index]?.length || 0)
  );
  
  if (changedIndex !== -1) {
    scrollToLastMessage(changedIndex);
  }
}, { deep: true });

// Setup global message listeners
function setupGlobalMessageListeners() {
  // Listen to all user chats
  users.value.forEach(user => {
    const chatId = [currUserId, user.id].sort().join('_');
    if (!globalMessageListeners.value[chatId]) {
      const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("createdAt")
      );

      globalMessageListeners.value[chatId] = onSnapshot(q, (snapshot) => {
        const newMessages = snapshot.docChanges()
          .filter(change => change.type === 'added')
          .map(change => ({
            id: change.doc.id,
            ...change.doc.data()
          }))
          .filter(msg => msg.senderId !== currUserId);

        if (newMessages.length > 0) {
          // Check if this chat is currently open
          const isOpen = activeChats.value.some(
            chat => !chat.isGroup && chat.entity.id === user.id
          );

          if (!isOpen) {
            // Add to unread messages
            const key = `user-${user.id}`;
            allUnreadMessages.value[key] = [
              ...(allUnreadMessages.value[key] || []),
              ...newMessages
            ];
          }
        }
      });
    }
  });

  // Listen to all group chats
  userGroups.value.forEach(group => {
    const groupId = group.id;
    if (!globalMessageListeners.value[groupId]) {
      const q = query(
        collection(db, "groups", groupId, "messages"),
        orderBy("createdAt")
      );

      globalMessageListeners.value[groupId] = onSnapshot(q, (snapshot) => {
        const newMessages = snapshot.docChanges()
          .filter(change => change.type === 'added')
          .map(change => ({
            id: change.doc.id,
            ...change.doc.data()
          }))
          .filter(msg => msg.senderId !== currUserId);

        if (newMessages.length > 0) {
          // Check if this group chat is currently open
          const isOpen = activeChats.value.some(
            chat => chat.isGroup && chat.entity.id === groupId
          );

          if (!isOpen) {
            // Add to unread messages
            const key = `group-${groupId}`;
            allUnreadMessages.value[key] = [
              ...(allUnreadMessages.value[key] || []),
              ...newMessages
            ];
          }
        }
      });
    }
  });
}

// Open group settings
async function openGroupSettings(groupId) {
  const group = userGroups.value.find(g => g.id === groupId);
  if (group) {
    // Ensure we have the latest group data
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (groupDoc.exists()) {
      selectedGroup.value = {
        id: groupDoc.id,
        ...groupDoc.data()
      };
      showGroupSettings.value = true;
    }
  }
}

// Handle group left event
function handleGroupLeft() {
  // Close any active chat windows for this group
  const index = activeChats.value.findIndex(
    chat => chat.isGroup && chat.entity.id === selectedGroup.value.id
  );
  if (index !== -1) {
    closeChat(index);
  }
  selectedGroup.value = null;
  showGroupSettings.value = false;
}

// Invite user to group
async function inviteUserToGroup(userId, groupData) {
  const inviter = {
    id: currUserId,
    displayName: userCache.value[currUserId]?.name || 'Unknown User',
    photoURL: userCache.value[currUserId]?.photoURL
  };

  try {
    // Create invite in Firestore
    await addDoc(collection(db, 'groups', groupData.id, 'invites'), {
      userId,
      inviterId: currUserId,
      status: 'pending',
      createdAt: new Date()
    });

    // Send notification
    await notificationService.sendGroupInviteNotification(
      userId,
      {
        id: groupData.id,
        name: groupData.name,
        photoURL: groupData.photoURL
      },
      inviter
    );
  } catch (error) {
    console.error('Error inviting user to group:', error);
    throw error;
  }
}

// Handle incoming group invites
function setupGroupInviteListener() {
  if (!currUserId) return;

  const invitesQuery = query(
    collection(db, 'users', currUserId, 'notifications'),
    where('type', '==', NotificationType.GROUP_INVITE),
    where('read', '==', false)
  );

  return onSnapshot(invitesQuery, async (snapshot) => {
    for (const change of snapshot.docChanges()) {
      if (change.type === 'added') {
        const invite = change.doc.data();
        const groupId = invite.data.groupId;

        // Add the group to userGroups if accepted
        // You might want to add UI for accepting/rejecting invites
        if (invite.status === 'accepted') {
          const groupRef = doc(db, 'groups', groupId);
          const groupDoc = await getDoc(groupRef);
          
          if (groupDoc.exists()) {
            const groupData = groupDoc.data();
            if (!groupData.members.includes(currUserId)) {
              await updateDoc(groupRef, {
                members: [...groupData.members, currUserId]
              });
            }
          }
        }
      }
    }
  });
}
</script>

<style scoped>
/* Terminal Base Styles */
.hacker-terminal {
  height: 100vh;
  width: 100%;
  background: var(--dark-bg);
  color: var(--text-color);
  font-family: "Courier New", monospace;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--accent-color);
}

.terminal-header {
  background: var(--card-bg);
  border-bottom: 1px solid var(--accent-color);
  margin-bottom: 0px;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.terminal-controls {
  display: flex;
  gap: 8px;
}

.terminal-title {
  font-weight: bold;
  letter-spacing: 1px;
  color: var(--accent-color);
  text-align: center;
  flex-grow: 1;
}

.terminal-actions {
  display: flex;
  gap: 10px;
}

.terminal-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* Collapsible Sidebar */
.terminal-sidebar {
  width: 250px;
  background: var(--card-bg);
  border-right: 1px solid var(--accent-color);
  overflow-y: auto;
  user-select: none;
  transition: width 0.3s ease;
}

.terminal-sidebar.collapsed {
  width: 50px;
  overflow: hidden;
}

.terminal-sidebar.collapsed .terminal-heading,
.terminal-sidebar.collapsed .terminal-user-info,
.terminal-sidebar.collapsed button span {
  display: none;
}

.terminal-heading {
  color: var(--accent-color);
  font-weight: bold;
  border-bottom: 1px dashed var(--border-color);
  padding-bottom: 5px;
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.terminal-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.terminal-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin-bottom: 5px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
}

/* Add this new style for the user info container */
.terminal-user-info {
  display: flex;
  align-items: center;
  flex: 1;
}

/* Add this style for the d-flex container */
.d-flex.align-items-center {
  display: flex;
  align-items: center;
  flex: 1;
}

.terminal-list-item:hover {
  background: var(--button-bg);
  border-color: var(--accent-color);
}

.terminal-list-item.active {
  background: var(--button-bg);
  border-color: var(--accent-color);
  box-shadow: 0 0 5px var(--accent-color);
}

.terminal-avatar {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  margin-right: 10px;
  border: 1px solid var(--border-color);
}

.terminal-username {
  font-weight: bold;
}

.terminal-user-handle {
  font-size: 0.8em;
  color: var(--text-secondary);
}

/* Workspace for multiple chat windows */
.terminal-workspace {
  position: relative;
  overflow: auto;
  flex: 1;
  background: var(--dark-bg);
}

/* Chat Windows */
.chat-window {
  position: absolute;
  background: var(--card-bg);
  border: 1px solid var(--accent-color);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  min-width: 300px;
  min-height: 40px;
}

.chat-window.focused {
  border: 2px solid var(--accent-secondary);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
}

.chat-window.minimized {
  height: 40px !important;
  overflow: hidden;
}

@keyframes newMessage {
  0% { border-color: var(--accent-color); }
  50% { border-color: var(--accent-secondary); }
  100% { border-color: var(--accent-color); }
}

.chat-window.has-new-message {
  animation: newMessage 1s infinite;
}

.chat-window-header {
  background: var(--button-bg);
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  border-bottom: 1px solid var(--border-color);
}

.chat-window-info {
  display: flex;
  align-items: center;
}

.chat-window-avatar {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  margin-right: 8px;
  cursor: pointer;
}

.chat-window-title {
  font-size: 0.9em;
  font-weight: bold;
  color: var(--accent-color);
}

.window-dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot-red {
  background-color: #ff5f56;
}

.dot-yellow {
  background-color: #ffbd2e;
}

.dot-green {
  background-color: #27c93f;
}


.window-control {
  cursor: pointer;
}

.window-control.only{
  color: var(--accent-secondary);
  background: none;
  border: none;
}

.window-control.only:hover {
  background: var(--accent-secondary-hover);
}

.chat-window-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  padding: 10px; /* Add padding to prevent overflow */
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

/* Terminal-style messages */
.terminal-message {
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.terminal-message.user-message {
  align-items: flex-end; /* Align user's messages to the right */
}

.terminal-message.user-message .message-user-info {
  flex-direction: row-reverse; /* Reverse the order of avatar and username */
}

.terminal-message.user-message .message-avatar {
  margin-left: 8px; /* Adjust spacing for reversed layout */
  margin-right: 0;
}

.terminal-message.user-message .message-command {
  text-align: right; /* Align text to the right */
}

.terminal-message.user-message .message-timestamp {
  text-align: right; /* Align timestamp to the right */
}

.message-user-info {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.message-avatar {
  width: 24px;
  height: 24px;
  border-radius: 3px;
  margin-right: 8px;
  border: 1px solid var(--border-color);
}

.message-username {
  font-weight: bold;
  color: var(--accent-secondary);
  font-size: 0.9em;
}

.message-command {
  display: flex;
  align-items: center;
  font-family: "Courier New", monospace;
  word-break: break-word;
}
.command-prompt {
  margin-right: 5px;
  color: var(--accent-color);
}

.message-timestamp {
  font-size: 0.7em;
  color: var(--text-secondary);
  margin-top: 2px;
}

.message-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 4px;
  margin-top: 5px;
  cursor: pointer;
  transition: transform 0.2s;
}

.message-image:hover {
  transform: scale(1.1);
}

.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 5px;
}

.message-action-btn {
  background: none;
  border: none;
  color: var(--accent-color);
  cursor: pointer;
  font-size: 0.9em;
  transition: color 0.2s;
}

.message-action-btn:hover {
  color: var(--accent-secondary);
}

/* Chat Input */
.chat-input-form {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap; /* Ensure inputs wrap if they don't fit */
}

.input-prompt {
  font-weight: bold;
  font-size: 0.8em;
  color: var(--accent-color);
  white-space: nowrap;
}

.terminal-input {
  flex: 1;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  padding: 6px 10px;
  border-radius: 4px;
  color: var(--text-color);
  font-family: "Courier New", monospace;
  font-size: 0.9em;
}

/* Style for the image upload input */
.image-upload-input {
  display: none; /* Hide the default file input */
}

.image-upload-button {
  background: var(--button-bg);
  border: 1px solid var(--accent-color);
  color: var(--accent-color);
  font-family: "Courier New", monospace;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 0.85em;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap; /* Prevent text overflow */
  max-width: 100%; /* Ensure it doesn't overflow the window */
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-upload-button:hover {
  background: var(--accent-color);
  color: var(--dark-bg);
}

/* No Chats Message */
.no-chats-message {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: var(--text-secondary);
  font-family: "Courier New", monospace;
  text-align: center;
  pointer-events: none;
}

.terminal-text .terminal-line {
  margin: 5px 0;
}

.blink {
  animation: blink 1s step-start infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* Modal Styles */
.terminal-modal {
  background: var(--card-bg);
  color: var(--text-color);
  border: 1px solid var(--accent-color);
  border-radius: 8px;
  font-family: "Courier New", monospace;
}

.terminal-modal-header {
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.terminal-modal-title {
  color: var(--accent-color);
  font-weight: bold;
}

.terminal-close-btn {
  background: none;
  border: none;
  color: var(--accent-color);
  font-size: 1.2em;
  cursor: pointer;
}

.terminal-modal-body {
  padding: 20px;
}

.terminal-modal-input {
  width: 100%;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  padding: 8px;
  border-radius: 4px;
  color: var(--text-color);
  font-size: 0.9em;
}

.terminal-modal-section {
  margin-top: 20px;
}

.terminal-modal-label {
  font-weight: bold;
  margin-bottom: 10px;
}

.terminal-checkbox-list {
  display: flex;
  flex-direction: column;
  max-height: 150px;
  overflow-y: auto;
  gap: 8px;
}

.terminal-checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.terminal-checkbox {
  width: 14px;
  height: 14px;
}

.terminal-checkbox-label {
  font-size: 0.9em;
}

/* Buttons */
.terminal-btn,
.terminal-btn-sm {
  background: var(--button-bg);
  border: 1px solid var(--accent-color);
  color: var(--accent-color);
  font-family: "Courier New", monospace;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.85em;
  cursor: pointer;
  transition: background 0.2s;
}

.terminal-btn-sm {
  padding: 4px 8px;
  font-size: 0.75em;
}

.terminal-btn:hover,
.terminal-btn-sm:hover {
  background: var(--accent-color);
  color: var(--dark-bg);
}

.terminal-modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 10px 20px;
  border-top: 1px solid var(--border-color);
}

/* Resize Handle */
.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 15px;
  height: 15px;
  background: var(--accent-color);
  cursor: nwse-resize;
}

/* Image Viewer Overlay */
.image-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  cursor: pointer;
}

/* Image Viewer Image */
.image-viewer-image {
  max-width: 90%;
  max-height: 90%;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
}

/* Edit Message Input */
.edit-message-input {
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  padding: 4px 8px;
  border-radius: 4px;
  color: var(--text-color);
  font-family: "Courier New", monospace;
  font-size: 0.9em;
  width: 100%;
}

.unread-messages-divider {
  text-align: center;
  margin: 10px 0;
  color: var(--accent-color);
  border-bottom: 1px dashed var(--accent-color);
  font-size: 0.8em;
  padding: 5px 0;
}

/* Add to your existing styles */
.search-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.search-box {
  position: relative;
}

.search-input {
  width: 100%;
  padding-left: 28px;
  font-size: 0.9em;
}

.search-box::before {
  content: '>';
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--accent-color);
}

.filter-options {
  display: flex;
  gap: 0.5rem;
}

.filter-options .terminal-btn-sm {
  flex: 1;
  text-align: center;
}

.filter-options .terminal-btn-sm.active {
  background: var(--accent-color);
  color: var(--dark-bg);
}

.following-indicator {
  color: var(--accent-color);
  font-size: 0.9em;
  margin-right: 0.5rem;
}

.terminal-list-item.is-following {
  border-left: 2px solid var(--accent-color);
}

.status-indicators {
  display: flex;
  align-items: center;
}

/* Add responsive styles for collapsed sidebar */
.terminal-sidebar.collapsed .search-controls {
  display: none;
}
</style>