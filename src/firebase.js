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
  updateDoc 
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
  SYSTEM: 'system'
};

// Notification Handler
export class NotificationService {
  constructor() {
    this.notificationCallback = null;
  }

  setNotificationHandler(callback) {
    this.notificationCallback = callback;
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

      // Save notification to Firestore
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

      // If recipient is not the current user, trigger notification
      if (recipientId !== auth.currentUser?.uid && this.notificationCallback) {
        this.notificationCallback({
          id: notificationRef.id,
          type,
          title,
          body,
          icon,
          data
        });
      }

      return notificationRef.id;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
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

  // Helper methods for different notification types
  async sendMessageNotification(recipientId, message, sender) {
    return this.sendNotification({
      recipientId,
      senderId: sender.id,
      type: NotificationType.MESSAGE,
      title: `New message from ${sender.displayName}`,
      body: message.text || '[Image]',
      icon: sender.photoURL,
      data: { messageId: message.id, chatId: message.chatId }
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
}

// Create and export a singleton instance
export const notificationService = new NotificationService();

export { auth, db, rtdb, CurrUser, useUserPresence };