<template>
  <div>
    <SideBar v-if="!isAuthPage" />
    <router-view :style="!isAuthPage ? 'margin-left: 80px; width: Calc(100% - 80px)' : ''" />
  
    <button
      @click="toggleTheme"
      class="btn btn-sm position-fixed bottom-0"
      style="z-index: 9999;"
    >
      <i :class="theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill'"></i>
    </button>

    <!-- Add the notifications container -->
    <div class="notifications-container">
      <TransitionGroup name="notification">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-popup"
          :class="{ 'dark': theme === 'dark' }"
        >
          <div class="notification-content">
            <img 
              :src="notification.icon" 
              class="notification-avatar"
              @error="e => e.target.src = 'https://res.cloudinary.com/duwrqxvey/image/upload/v1745689776/default-avatar-icon-of-social-media-user-vector_zoyryv.jpg'"
            />
            <div class="notification-text">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-body">
                {{ notification.body }}
                <span v-if="notification.count > 1" class="counter">{{ notification.count }}</span>
              </div>
            </div>
            <button class="notification-close" @click="removeNotification(notification.id)">×</button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, provide, onUnmounted } from "vue";
import SideBar from "./components/SideBar.vue";
import { useRoute } from "vue-router";
import { auth } from "@/firebase";
import { notificationService } from "@/firebase";

const route = useRoute();

// Pages where sidebar should be hidden
const authPages = ["/login", "/signup", "/forgotpassword"];

const isAuthPage = computed(() => authPages.includes(route.path.toLowerCase()));

const theme = ref(
  localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light")
);

const applyTheme = () => {
  document.body.setAttribute("data-bs-theme", theme.value);

  const darkModeStyles = {
    "--bs-body-bg": "#121212",
    "--bs-body-color": "#e1e1e1",
    "--accent-color": "#ff38b8",
    "--accent-secondary": "#6464ff",
    "--dark-bg": "#181818",
    "--card-bg": "#232323",
    "--text-color": "#f8f9fa",
    "--text-secondary": "#c6c6c6",
    "--code-comment": "#6d6d7f",
    "--code-keyword": "#ff38b8",
    "--code-function": "#6464ff",
    "--background-logo-color": "#ffffff",
    "--input-group-text-bg": "#333333",
    "--input-group-text-border": "#444444",
    "--input-focus-bg": "#222222", // new
    "--input-focus-shadow": "#ff38b840", // new
    "--input-placeholder-color": "#888888", // new
    "--glow-bg": "#ff38b8",
    "--glow-fade": "#ff38b8",
    "--verify-alert-bg": "#4444ff",
    "--verify-alert-border": "#6464ff",
    "--strength-meter-bg": "#555555",
    "--strength-bar-bg": "#ffffff",
    "--border-color": "#444444",
    "--button-bg": "#444444",
    "--button-border": "#555555",
    "--button-text": "#f8f9fa",
    "--link-color": "#ff38b8",
    "--link-hover-color": "#ffffff",
    "--alert-bg": "#333333",
    "--alert-border": "#ff38b8",
    "--navbar-bg": "#202020",
    "--navbar-text": "#f0f0f0",
    "--step-indicator-bg": "#2c2c2c", // new
    "--progress-line-bg": "#444444", // new
    "--message-sent-bg": "#6464ff",        // keep it, fits dark mode too
    "--message-received-bg": "#232323",    // soft dark card background
    "--chat-input-bg": "#181818",          // slightly darker for input area
    "--chat-border": "#444444",            // dark subtle border
    "--card-hover-bg": "#2a2a2a",
    "--progress-bar-active-bg": "#ff38b8",
    "--navbar-hover-bg": "#333333",
    "--error-alert-bg": "#e74c3c",
    "--active-button-bg": "#333333",
    "--button-hover-bg": "#555555",
    "--heading-font-weight": "600",       // Adjust heading weight
    "--body-font-family": "'Roboto', sans-serif", // Font for body text
    "--button-gradient-bg": "linear-gradient(45deg, #ff38b8, #6464ff)",
    "--error-color": "#ff4444",
    "--error-color-dark": "#cc0000",
  };

  const lightModeStyles = {
    "--bs-body-bg": "#ffffff",
    "--bs-body-color": "#000000",
    "--accent-color": "#ff38b8",
    "--accent-secondary": "#6464ff",
    "--dark-bg": "#f8f9fa",
    "--card-bg": "#e1e1e6",
    "--text-color": "#000000",
    "--text-secondary": "#555555",
    "--code-comment": "#6d6d7f",
    "--code-keyword": "#ff38b8",
    "--code-function": "#6464ff",
    "--background-logo-color": "#000000",
    "--input-group-text-bg": "#f0f0f0",
    "--input-group-text-border": "#cccccc",
    "--input-focus-bg": "#ffffff",
    "--input-focus-shadow": "#ff38b840",
    "--input-placeholder-color": "#aaaaaa",
    "--glow-bg": "#ff38b8",
    "--glow-fade": "#ff38b8",
    "--verify-alert-bg": "#6666ff",
    "--verify-alert-border": "#6464ff",
    "--strength-meter-bg": "#dddddd",
    "--strength-bar-bg": "#ff38b8",
    "--border-color": "#cccccc",
    "--button-bg": "#ffffff",
    "--button-border": "#dddddd",
    "--button-text": "#000000",
    "--link-color": "#ff38b8",
    "--link-hover-color": "#6464ff",
    "--alert-bg": "#e0f7fa",
    "--alert-border": "#ff38b8",
    "--navbar-bg": "#ffffff",
    "--navbar-text": "#000000",
    "--step-indicator-bg": "#dddddd", // new
    "--progress-line-bg": "#cccccc", // new
    "--message-sent-bg": "#6464ff",        // nice blue accent for sent
    "--message-received-bg": "#f0f0f0",    // light gray for received
    "--chat-input-bg": "#f9f9f9",          // light input background
    "--chat-border": "#cccccc",            // soft border
    "--card-hover-bg": "#eaeaea",
    "--card-hover-bg": "#eaeaea",
    "--progress-bar-active-bg": "#ff38b8",
    "--navbar-hover-bg": "#f2f2f2",
    "--error-alert-bg": "#ff6b6b",
    "--active-button-bg": "#dddddd",
    "--button-hover-bg": "#f0f0f0",
    "--heading-font-weight": "600",       // Adjust heading weight
    "--body-font-family": "'Roboto', sans-serif", // Font for body text
    "--button-gradient-bg": "linear-gradient(45deg, #ff38b8, #6464ff)",
    "--error-color": "#ff4444",
    "--error-color-dark": "#cc0000",
  };

  const styles = theme.value === "dark" ? darkModeStyles : lightModeStyles;

  Object.keys(styles).forEach((key) => {
    document.documentElement.style.setProperty(key, styles[key]);
  });

  localStorage.setItem("theme", theme.value);
};

const toggleTheme = () => {
  theme.value = theme.value === "light" ? "dark" : "light";
  applyTheme();
};

// Add notification state
const MAX_VISIBLE_NOTIFICATIONS = 5;
const notifications = ref([]);

// Add notification methods
const addNotification = (notification) => {
  const id = Date.now();
  
  // Check if there's already a notification from the same sender/chat
  const existingNotificationIndex = notifications.value.findIndex(
    n => n.chatId === notification.data?.chatId
  );

  if (existingNotificationIndex !== -1) {
    // Update existing notification counter
    const existing = notifications.value[existingNotificationIndex];
    if (!existing.count) existing.count = 1;
    existing.count++;
    existing.body = `${existing.count} new messages`;
    // Move to top
    const updated = notifications.value.splice(existingNotificationIndex, 1)[0];
    notifications.value.unshift(updated);
  } else {
    // Add new notification at the beginning
    notifications.value.unshift({
      id,
      title: notification.title || 'New Message',
      body: notification.text || 'You have a new message',
      icon: notification.senderPhoto || 'default-avatar-url',
      timestamp: new Date(),
      chatId: notification.data?.chatId,
      count: 1
    });

    // Limit the number of visible notifications
    if (notifications.value.length > MAX_VISIBLE_NOTIFICATIONS) {
      notifications.value = notifications.value.slice(0, MAX_VISIBLE_NOTIFICATIONS);
    }
  }

  // Auto remove after 5 seconds
  setTimeout(() => removeNotification(id), 5000);
};

const removeNotification = (id) => {
  notifications.value = notifications.value.filter(n => n.id !== id);
};

// Make notifications available globally
provide('notifications', {
  add: addNotification,
  remove: removeNotification,
  list: notifications
});

// Request notification permission
const requestNotificationPermission = async () => {
  try {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
};

// Request notification permission on mount
onMounted(async () => {
  await requestNotificationPermission();
  applyTheme();
  
  // Set up notification handler
  notificationService.setNotificationHandler((notification) => {
    addNotification({
      title: notification.title,
      text: notification.body,
      senderPhoto: notification.icon,
      data: notification.data
    });
  });

  // Start listening to notifications for current user
  let unsubscribe;
  const currentUser = auth.currentUser;
  if (currentUser) {
    unsubscribe = notificationService.listenToNotifications(currentUser.uid);
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });
});
</script>

<style>
.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 80vh; /* Limit height to 80% of viewport height */
  overflow-y: auto; /* Make it scrollable */
  padding-right: 5px; /* Add padding for scrollbar */
}

/* Add custom scrollbar styling */
.notifications-container::-webkit-scrollbar {
  width: 6px;
}

.notifications-container::-webkit-scrollbar-track {
  background: var(--card-bg);
  border-radius: 3px;
}

.notifications-container::-webkit-scrollbar-thumb {
  background: var(--accent-color);
  border-radius: 3px;
}

.notification-popup {
  background: var(--card-bg);
  border: 1px solid var(--glow-bg);
  box-shadow: 0 4px 12px var(--glow-fade);
  border-radius: 8px;
  padding: 12px;
  min-width: 300px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
  opacity: 0.95; /* Add slight transparency */
  backdrop-filter: blur(5px); /* Add blur effect */
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notification-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.notification-text {
  flex: 1;
}

.notification-title {
  font-weight: bold;
  margin-bottom: 4px;
  color: var(--text-color);
}

.notification-body {
  font-size: 0.9em;
  color: var(--text-secondary);
}

.notification-body .counter {
  display: inline-block;
  background: var(--accent-color);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.8em;
  margin-left: 5px;
}

.notification-close {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.2em;
  cursor: pointer;
  padding: 0 4px;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.notifications-container::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(transparent, var(--card-bg));
  pointer-events: none;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>

