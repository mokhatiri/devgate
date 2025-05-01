import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  writeBatch, 
  getDocs, 
  getDoc 
} from 'firebase/firestore';
import { getDatabase, ref, onValue, set, serverTimestamp, onDisconnect, off} from 'firebase/database';
import { ref as vueRef, onUnmounted, onMounted } from 'vue';

const firebaseConfig = {
    apiKey: "AIzaSyD06RdWmg7cNHnG6zevlxVESSmxgZMftf8",
    authDomain: "devgate-5f83d.firebaseapp.com",
    projectId: "devgate-5f83d",
    storageBucket: "devgate-5f83d.firebasestorage.app",
    messagingSenderId: "834270768863",
    appId: "1:834270768863:web:750d84562186746a00436a",
    measurementId: "G-C61YCLFEJ5",
    databaseURL: "https://devgate-5f83d-default-rtdb.europe-west1.firebasedatabase.app/"  // Add the databaseURL here
};  

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const rtdb = getDatabase(app);

setPersistence(auth, browserLocalPersistence)
  .then(() => {
    // Persistence set successfully
  })
  .catch((error) => {
    console.log('Error setting persistence:', error);
  });

// User presence management
onAuthStateChanged(auth, (user) => {
  if (user) {
    const uid = user.uid;
    const userStatusDatabaseRef = ref(rtdb, `/status/${uid}`);

    const isOfflineForDatabase = {
      state: 'offline',
      last_changed: serverTimestamp(),
    };

    const isOnlineForDatabase = {
      state: 'online',
      last_changed: serverTimestamp(),
    };

    const connectedRef = ref(rtdb, '.info/connected');
    onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === false) return;

      onDisconnect(userStatusDatabaseRef).set(isOfflineForDatabase).then(() => {
        set(userStatusDatabaseRef, isOnlineForDatabase);
      });
    });
  }
});

// Function to check user presence
function useUserPresence(otherUserId) {
  const isOnline = vueRef(false);
  const userStatusRef = ref(rtdb, 'status/' + otherUserId);

  const callback = (snapshot) => {
    const status = snapshot.val();
    if (status !== null) {
      isOnline.value = status.state === 'online';
    } else {
      isOnline.value = false;
    }
  };

  onValue(userStatusRef, callback);

  onUnmounted(() => {
    off(userStatusRef, 'value', callback);
  });
  
  return isOnline;
}

const CurrUser = vueRef({}); // GLOBAL reactive object
// ====> an object with all current user info, reactive, and is onSnapshot

// Start listening immediately
let unsubscribe = null;

function startListeningToCurrentUser() {
  if (unsubscribe) return; // already listening

  auth.onAuthStateChanged(user => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      
      // Listen for notifications
      const notificationsQuery = query(
        collection(db, 'users', user.uid, 'notifications'),
        where('type', '==', 'message'),
        orderBy('createdAt', 'desc')
      );

      // Add notification listener
      const notificationUnsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const notification = change.doc.data();
            
            // Request notification permission if needed
            if (Notification.permission === 'default') {
              Notification.requestPermission();
            }

            // Show notification if permitted
            if (Notification.permission === 'granted') {
              const sender = CurrUser.value[notification.senderId]?.name || 'Someone';
              new Notification('New Message', {
                body: notification.notificationtext || 'You have a new notification',
                icon: CurrUser.value[notification.senderId]?.photoURL || '/default-avatar.png'
              });
            }
          }
        });
      });

      // User data listener
      unsubscribe = onSnapshot(userDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          CurrUser.value = {
            uid: user.uid,  // Add this line to include the uid
            ...userData,
            photoURL: userData.photoURL || 'https://res.cloudinary.com/duwrqxvey/image/upload/v1745689776/default-avatar-icon-of-social-media-user-vector_zoyryv.jpg'
          };
        } else {
          CurrUser.value = { uid: user.uid };  // Include uid even when no other data exists
        }
      });

      // Update unsubscribe to clean up both listeners
      const originalUnsubscribe = unsubscribe;
      unsubscribe = () => {
        originalUnsubscribe();
        notificationUnsubscribe();
      };
    } else {
      CurrUser.value = {}; // signed out
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    }
  });
}

startListeningToCurrentUser();

// Notification Types
export const NotificationType = {
  MESSAGE: 'message',
  GROUP_INVITE: 'group_invite',
  MENTION: 'mention',
  REPLY: 'reply',
  SYSTEM: 'system',
  LIKE: 'like'
};

// Notification Preferences
const NotificationPreferences = {
  NONE: 'none',
  IMPORTANT_ONLY: 'important',
  ALL: 'all'
};

// Notification Handler
export class NotificationService {
  constructor() {
    this.notificationCallback = null;
    this.notificationSound = new Audio('@/assets/sound/notificationSound.wav'); // Add notification sound
    this.unreadCount = vueRef(0);
    this.setupUnreadCounter();
    this.notificationQueue = [];
    this.isProcessing = false;
    this.minTimeBetweenNotifications = 1000; // 1 second
    this.lastNotificationTime = 0;
    this.pendingNotifications = [];
    this.notificationTimeout = null;
  }

  async playNotificationSound() {
    try {
      await this.notificationSound.play();
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  setNotificationHandler(callback) {
    this.notificationCallback = callback;
  }

  async handlePendingNotifications() {
    if (this.pendingNotifications.length === 0) return;

    // If there's only one notification, show it normally
    if (this.pendingNotifications.length === 1) {
      const notification = this.pendingNotifications[0];
      new Notification(notification.title, {
        body: notification.body,
        icon: notification.icon || '/default-avatar.png',
        silent: false
      });
    } else {
      // Show a grouped notification
      new Notification('New Notifications', {
        body: `You have ${this.pendingNotifications.length} new notifications`,
        icon: '/default-avatar.png',
        silent: false
      });
    }

    // Play sound only once
    await this.playNotificationSound();
    
    // Clear pending notifications
    this.pendingNotifications = [];
    this.notificationTimeout = null;
  }

  async sendNotification(notification) {
    try {
      const {
        recipientId,
        senderId,
        type,
        title,
        body,
        icon,
        data = {}
      } = notification;

      const notificationRef = await addDoc(
        collection(db, 'users', recipientId, 'notifications'),
        {
          type,
          title,
          body,
          icon,
          senderId,
          data,
          read: false,
          createdAt: serverTimestamp(),
        }
      );

      // If recipient is not the current user, queue the notification
      if (recipientId !== auth.currentUser?.uid && Notification.permission === 'granted') {
        this.pendingNotifications.push({ title, body, icon });
        
        // Clear existing timeout if it exists
        if (this.notificationTimeout) {
          clearTimeout(this.notificationTimeout);
        }

        // Set a new timeout to show notifications after a delay
        this.notificationTimeout = setTimeout(() => {
          this.handlePendingNotifications();
        }, 1000); // Wait 1 second to batch notifications
      }

      return notificationRef.id;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  async sendSystemNotification(recipientId, title, body, data = {}) {
    return this.sendNotification({
      recipientId,
      senderId: 'system',
      type: NotificationType.SYSTEM,
      title,
      body,
      data
    });
  }

  // Listen to user's notifications
  listenToNotifications(userId) {
    if (!userId) return () => {};

    const q = query(
      collection(db, 'users', userId, 'notifications'),
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' && this.notificationCallback) {
          const notification = {
            id: change.doc.id,
            ...change.doc.data()
          };
          this.notificationCallback(notification);
        }
      });
    });
  }

  // Mark notification as read
  async markAsRead(userId, notificationId) {
    try {
      await updateDoc(
        doc(db, 'users', userId, 'notifications', notificationId),
        { read: true }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markMultipleAsRead(userId, query) {
    try {
      const snapshot = await getDocs(query);
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  // Helper methods for different notification types
  async sendMessageNotification(recipientId, message, sender, chatId, isGroup, groupName) {
    return this.sendNotification({
      recipientId,
      senderId: sender.id,
      type: NotificationType.MESSAGE,
      title: `New message from user '${sender.displayName}'${isGroup ? ' in group: ' + groupName : ''}`,
      body: message.text || '[Image]',
      icon: sender.photoURL,
      data: { messageId: message.id, chatId: chatId }
    });
  }

  async sendGroupInviteNotification(recipientId, groupData, inviter) {
    return this.sendNotification({
      recipientId,
      senderId: inviter.id,
      type: NotificationType.GROUP_INVITE,
      title: `Group Invitation`,
      body: `${inviter.displayName} invited you to join ${groupData.name}`,
      icon: groupData.photoURL,
      data: { groupId: groupData.id }
    });
  }

  async sendMentionNotification(recipientId, message, sender, context) {
    return this.sendNotification({
      recipientId,
      senderId: sender.id,
      type: NotificationType.MENTION,
      title: `${sender.displayName} mentioned you`,
      body: message.text,
      icon: sender.photoURL,
      data: { messageId: message.id, context }
    });
  }

  async sendLikeNotification(recipientId, message, sender) {
    return this.sendNotification({
      recipientId,
      senderId: sender.id,
      type: NotificationType.LIKE,
      title: `${sender.displayName} liked your message`,
      body: message.text,
      icon: sender.photoURL,
      data: { messageId: message.id }
    });
  }

  setupUnreadCounter() {
    if (!auth.currentUser) return;

    const unreadQuery = query(
      collection(db, 'users', auth.currentUser.uid, 'notifications'),
      where('read', '==', false)
    );

    onSnapshot(unreadQuery, (snapshot) => {
      this.unreadCount.value = snapshot.docs.length;
      this.updateFavicon(this.unreadCount.value);
    });
  }

  updateFavicon(count) {
    // Update favicon with notification count
    const favicon = document.querySelector('link[rel="icon"]');
    if (count > 0) {
      // Create dynamic favicon with count
      // Implementation depends on your favicon strategy
    }
  }

  async groupNotifications(notifications) {
    const grouped = {};
    
    notifications.forEach(notification => {
      const key = `${notification.type}-${notification.senderId}`;
      if (!grouped[key]) {
        grouped[key] = {
          ...notification,
          count: 1
        };
      } else {
        grouped[key].count++;
        if (notification.createdAt > grouped[key].createdAt) {
          grouped[key].createdAt = notification.createdAt;
        }
      }
    });

    return Object.values(grouped);
  }

  async setUserNotificationPreferences(userId, preferences) {
    await updateDoc(doc(db, 'users', userId), {
      notificationPreferences: preferences
    });
  }

  async shouldNotify(notification) {
    const userDoc = await getDoc(doc(db, 'users', notification.recipientId));
    const preferences = userDoc.data()?.notificationPreferences || NotificationPreferences.ALL;
    
    if (preferences === NotificationPreferences.NONE) return false;
    if (preferences === NotificationPreferences.IMPORTANT_ONLY) {
      return ['group_invite', 'mention'].includes(notification.type);
    }
    return true;
  }

  async processNotificationQueue() {
    if (this.isProcessing || this.notificationQueue.length === 0) return;
    
    this.isProcessing = true;
    while (this.notificationQueue.length > 0) {
      const notification = this.notificationQueue.shift();
      await this.showNotification(notification);
      await new Promise(resolve => setTimeout(resolve, this.minTimeBetweenNotifications));
    }
    this.isProcessing = false;
  }

  queueNotification(notification) {
    this.notificationQueue.push(notification);
    this.processNotificationQueue();
  }
}

// Create and export a singleton instance
export const notificationService = new NotificationService();

export { auth, db, rtdb, CurrUser, useUserPresence };