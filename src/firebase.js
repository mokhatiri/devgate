
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase, ref, onValue, set, serverTimestamp, onDisconnect } from 'firebase/database';
import { ref as vueRef, onUnmounted } from 'vue';

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
export function useUserPresence(otherUserId) {
  const isOnline = vueRef(false);
  const userStatusRef = ref(rtdb, 'status/' + otherUserId);

  const callback = (snapshot) => {
    const status = snapshot.val();
    if (status !== null) {
      isOnline.value = status.state === 'online';
    } else {
      isOnline.value = false; // Default to offline if no status
    }
  };

  // Set up the listener
  onValue(userStatusRef, callback);

  // Cleanup when the component is unmounted
  onUnmounted(() => {
    userStatusRef.off('value', callback);
  });

  return isOnline;
}

export { auth, db, rtdb };