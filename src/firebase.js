
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
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

      unsubscribe = onSnapshot(userDocRef, (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.data();
          CurrUser.value = {
            ...userData,
            photoURL: userData.photoURL || 'https://res.cloudinary.com/duwrqxvey/image/upload/v1745689776/default-avatar-icon-of-social-media-user-vector_zoyryv.jpg', // add default logo if missing
          };
        } else {
          CurrUser.value = {}; // no data
        }
      });
    } else {
      CurrUser.value = {}; // signed out
      if (unsubscribe) {
        unsubscribe();
        unsubscribe();
        unsubscribe = null;
      }
    }
  });
}

startListeningToCurrentUser();

export { auth, db, rtdb, CurrUser, useUserPresence};