<template>
  <div class="hacker-terminal">
    <!-- Terminal Header -->
    <div class="terminal-header">
      <div class="terminal-controls">
        <span class="terminal-button close"></span>
        <span class="terminal-button minimize"></span>
        <span class="terminal-button maximize"></span>
      </div>
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
          <button
            class="terminal-btn-sm"
            style="width: 100%"
            @click="showGroupModal = true"
          >
            {{ sidebarCollapsed ? "+" : "[NEW_GROUP]" }}
          </button>

          <div class="terminal-section mt-4">
            <div class="terminal-heading">CONTACTS_</div>
            <ul class="terminal-list">
              <li
                v-for="user in users"
                :key="user.id"
                class="terminal-list-item"
                @click="toggleChat(user, false)"
                :class="{
                  active: activeChats.some(
                    (chat) => !chat.isGroup && chat.entity.id === user.id
                  ),
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
                  </div>
                </div>
                <OnlineDot :user="user" />
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
              />
              <div class="chat-window-title">
                {{ chat.isGroup ? chat.entity.name : chat.entity.name }}
              </div>
              <div style="margin-left : 10px">
              <button
                class="window-control only"
                @click.stop="keepOnlyThisWindow(index)"
              >
                [ONLY]
              </button>
              </div>
            </div>
            <div class="chat-window-controls">
              <button
                class="window-control"
                @click.stop="toggleMinimize(index)"
              >
                {{ chat.minimized ? "□" : "_" }}
              </button>
              <button class="window-control" @click.stop="resizeWindow(index)">
                ⊞
              </button>
              <button
                class="window-control close"
                @click.stop="closeChat(index)"
              >
                ×
              </button>
            </div>
          </div>

          <!-- Chat Window Content -->
          <div class="chat-window-content" v-show="!chat.minimized">
            <div class="chat-messages">
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
                  <span class="command-text">{{ message.text }}</span>
                </div>
                <div class="message-timestamp">
                  [{{ formatTimestamp(message.createdAt) }}]
                </div>
              </div>
            </div>

            <!-- Chat Input -->
            <form @submit.prevent="sendMessage(index)" class="chat-input-form">
              <div class="input-prompt">
                <span>@{{ chat.entity.username }}:~$</span>
              </div>
              <input
                v-model="chat.newMessage"
                class="terminal-input"
                placeholder="Type command..."
                @focus="setFocusedChat(index)"
              />
              <button class="terminal-btn-sm" type="submit">[ SEND ]</button>
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
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted, computed } from "vue";
import { db } from "@/firebase";
import { getAccountsInfoBy } from "@/Functions";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { auth } from "@/firebase";
import { Modal } from "bootstrap";
import OnlineDot from "@/components/OnlineDot.vue";

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
        };
      });
      // Add current user to cache
      const currentUser = newUsers.find((u) => u.id === currUserId);
      if (currentUser) {
        userCache.value[currUserId] = {
          name: currentUser.name,
          photoURL: currentUser.photoURL,
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
  const groupModal = new Modal(groupModalElement);

  watch(showGroupModal, (newValue) => {
    if (newValue) {
      groupModal.show();
    } else {
      groupModal.hide();
    }
  });

  // Window drag handlers
  document.addEventListener("mousemove", handleWindowDrag);
  document.addEventListener("mouseup", stopWindowDrag);

  // Resize handlers
  document.addEventListener("mousemove", handleWindowResize);
  document.addEventListener("mouseup", stopResizeWindow);

  // Clean up event listeners
  onUnmounted(() => {
    document.removeEventListener("mousemove", handleWindowDrag);
    document.removeEventListener("mouseup", stopWindowDrag);
    document.removeEventListener("mousemove", handleWindowResize);
    document.removeEventListener("mouseup", stopResizeWindow);
  });
});

// Toggle chat window visibility
function toggleChat(entity, isGroup) {
  // Check if the chat is already open
  const existingIndex = activeChats.value.findIndex(
    (chat) => chat.isGroup === isGroup && chat.entity.id === entity.id
  );

  if (existingIndex !== -1) {
    // Chat is already open, focus it
    setFocusedChat(existingIndex);
    // If minimized, maximize it
    if (activeChats.value[existingIndex].minimized) {
      activeChats.value[existingIndex].minimized = false;
    }
  } else {
    // Open new chat window with default position
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

// Load messages for a user chat
function loadUserMessages(chatIndex) {
  const chat = activeChats.value[chatIndex];
  if (!chat || chat.isGroup) return;

  const chatId = [currUserId, chat.entity.id].sort().join("_");
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    activeChats.value[chatIndex].messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  });

  // Store unsubscribe function to clean up when closing the window
  activeChats.value[chatIndex].unsubscribe = unsubscribe;
}

// Load messages for a group chat
function loadGroupMessages(chatIndex) {
  const chat = activeChats.value[chatIndex];
  if (!chat || !chat.isGroup) return;

  const groupId = chat.entity.id;
  const q = query(
    collection(db, "groups", groupId, "messages"),
    orderBy("createdAt")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    activeChats.value[chatIndex].messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  });

  // Store unsubscribe function
  activeChats.value[chatIndex].unsubscribe = unsubscribe;
}

// Send message from specific chat window
async function sendMessage(chatIndex) {
  const chat = activeChats.value[chatIndex];
  if (!chat || !chat.newMessage.trim()) return;

  if (!chat.isGroup) {
    const chatId = [currUserId, chat.entity.id].sort().join("_");
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: chat.newMessage,
      senderId: currUserId,
      receiverId: chat.entity.id,
      createdAt: new Date(),
    });
  } else {
    const groupId = chat.entity.id;
    await addDoc(collection(db, "groups", groupId, "messages"), {
      text: chat.newMessage,
      senderId: currUserId,
      createdAt: new Date(),
    });
  }

  activeChats.value[chatIndex].newMessage = "";
}

// Close chat window
function closeChat(index) {
  // Clean up listeners
  if (activeChats.value[index].unsubscribe) {
    activeChats.value[index].unsubscribe();
  }

  // Remove the chat
  activeChats.value.splice(index, 1);

  // Update focused chat if needed
  if (focusedChatIndex.value === index) {
    focusedChatIndex.value =
      activeChats.value.length > 0 ? activeChats.value.length - 1 : -1;
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

  resizeWindow(index);
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

function setFocusedChat(index) {
  if (focusedChatIndex.value !== index) {
    focusedChatIndex.value = index;

    // Move focused window to top (highest z-index)
    const highestZ = Math.max(
      ...activeChats.value.map((chat) => parseInt(chat.position.zIndex) || 1)
    );

    activeChats.value[index].position.zIndex = highestZ + 1;
  }
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
    createdAt: new Date(),
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
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.terminal-controls {
  display: flex;
  gap: 8px;
}

.terminal-button {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.terminal-button.close {
  background-color: #ff5f56;
}

.terminal-button.minimize {
  background-color: #ffbd2e;
}

.terminal-button.maximize {
  background-color: #27c93f;
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
  min-height: 200px; /* Minimum height for resizing */
}

.chat-window.focused {
  border: 2px solid var(--accent-secondary);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
}

.chat-window.minimized {
  height: 40px !important;
  overflow: hidden;
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
}

.chat-window-title {
  font-size: 0.9em;
  font-weight: bold;
  color: var(--accent-color);
}

.chat-window-controls {
  display: flex;
  gap: 5px;
}

.window-control {
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
}

.window-control:hover {
  background: var(--button-hover-bg);
}

.window-control.close {
  color: #ff5f56;
}

.window-control.close:hover {
  background: #ff5f5630;
}

.window-control.only{
  color: var(--accent-secondary);
}

.window-control.only:hover {
  background: var(--accent-secondary-hover);
}

.chat-window-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
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

/* Chat Input */
.chat-input-form {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
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
</style>
