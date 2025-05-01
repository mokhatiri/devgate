<template>
  <div class="notifications-view">
    <div class="terminal-container">
      <div class="window">
        <div class="window-header">
          <div class="window-dots">
            <span class="dot dot-red"></span>
            <span class="dot dot-yellow"></span>
            <span class="dot dot-green"></span>
          </div>
          <h2 class="window-title">notifications.log</h2>
        </div>

        <div class="window-body p-4">
          <div class="notifications-list">
            <div v-if="notifications.length === 0" class="empty-state">
              <i class="fas fa-bell-slash"></i>
              <p>No notifications yet</p>
            </div>

            <div
              v-for="notification in notifications"
              :key="notification.id"
              class="notification-item"
              :class="{ unread: !notification.read }"
              @click="handleNotificationClick(notification)"
            >
              <div class="notification-icon">
                <i :class="getNotificationIcon(notification.type)"></i>
              </div>
              <div class="notification-content">
                <div class="notification-title">{{ notification.title }}</div>
                <div class="notification-body">{{ notification.body }}</div>
                <div class="notification-time">
                  {{ formatTimestamp(notification.createdAt) }}
                </div>
              </div>
              <button
                class="mark-read-btn"
                v-if="!notification.read"
                @click.stop="markAsRead(notification)"
              >
                Mark as read
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db, CurrUser, notificationService, NotificationType } from "@/firebase";
import { useRouter } from "vue-router";

const router = useRouter();
const notifications = ref([]);
let unsubscribe = null;

const notificationMessages = {
  [NotificationType.MESSAGE]: 'sent you a message',
  [NotificationType.GROUP_INVITE]: 'invited you to a group',
  [NotificationType.MENTION]: 'mentioned you',
  [NotificationType.LIKE]: 'liked your message',
};

onMounted(() => {
  if (!CurrUser.value?.uid) return;

  const q = query(
    collection(db, "users", CurrUser.value.uid, "notifications"),
    orderBy("createdAt", "desc")
  );

  unsubscribe = onSnapshot(q, (snapshot) => {
    notifications.value = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  });
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});

const getNotificationIcon = (type) => {
  switch (type) {
    case "message":
      return "fas fa-comment";
    case "like":
      return "fas fa-heart";
    case "group_invite":
      return "fas fa-users";
    case "mention":
      return "fas fa-at";
    default:
      return "fas fa-bell";
  }
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  
  let date;
  if (timestamp.toDate) {
    // Firestore Timestamp
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    // JavaScript Date object
    date = timestamp;
  } else if (typeof timestamp === 'number') {
    // Unix timestamp in milliseconds
    date = new Date(timestamp);
  } else {
    return "";
  }

  const diffDays = Math.floor((date - new Date()) / (1000 * 60 * 60 * 24));
  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    diffDays,
    "day"
  );
};

const handleNotificationClick = async (notification) => {
  if (!notification.read) {
    await markAsRead(notification);
  }

  switch (notification.type) {
    case NotificationType.MESSAGE:
      router.push(`/chat`);
      break;
    case NotificationType.GROUP_INVITE:
      router.push(`/chat`);
      break;
    case NotificationType.MENTION:
      if (notification.data?.messageId) {
        router.push(`/chat`);
      }
      break;
    case NotificationType.LIKE:
      if (notification.data?.messageId) {
        router.push(`/`);
      }
      break;
  }
};

const markAsRead = async (notification) => {
  if (!notification.read) {
    await notificationService.markAsRead(CurrUser.value.uid, notification.id);
  }
};

const showBrowserNotification = (notification) => {
  if (Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.body,
      icon: notification.icon || '/path-to-default-icon.png'
    });
  }
};
</script>

<style scoped src="@/assets/css/windows.css"></style>
<style scoped>
.notifications-view {
    padding: 10px;
}

.notifications-list {
  max-width: 800px;
  margin: 0 auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  margin-bottom: 1rem;
  background: var(--dark-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.notification-item.unread {
  border-color: var(--accent-color);
  background: var(--card-bg);
}

.notification-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.notification-item.unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--accent-color);
  border-radius: 4px 0 0 4px;
}

.notification-icon {
  color: var(--accent-color);
  font-size: 1.2rem;
  margin-right: 1rem;
  width: 24px;
  text-align: center;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.notification-body {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.notification-time {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

.notification-actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.mark-read-btn {
  background: none;
  border: none;
  color: var(--accent-color);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.5rem;
}

.mark-read-btn:hover {
  text-decoration: underline;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}
</style>
