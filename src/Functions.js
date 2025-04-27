import { db } from "./firebase";
import { ref as vueRef } from 'vue';
import { doc, onSnapshot, collection, query, onSnapshot as onCollectionSnapshot } from "firebase/firestore";

/** 
 * Reactive single account info (by userId)
 */
export function getAccountInfo(userId) {
    const accountInfo = vueRef(null);

    const accountInfoRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(accountInfoRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            accountInfo.value = { id: docSnap.id, ...data, logoURL: data.logoURL || "https://res.cloudinary.com/duwrqxvey/image/upload/v1745689776/default-avatar-icon-of-social-media-user-vector_zoyryv.jpg"};
        } else {
            accountInfo.value = null;
        }
    });

    return { accountInfo, unsubscribe };
}

/**
 * examplaire use:
    import { onUnmounted } from 'vue';

    const { accountInfo, unsubscribe } = getAccountInfo('user123');

    onUnmounted(() => {
    unsubscribe();
    });
 */


/** 
 * Reactive multiple accounts info (by conditions)
 */
export function getAccountsInfoBy(object) {
    const filteredAccounts = vueRef([]);

    const accountInfoRef = collection(db, "users");

    const unsubscribe = onCollectionSnapshot(accountInfoRef, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const accounts = querySnapshot.docs.map(doc => {
            const accountData = doc.data();
            return {
              id: doc.id,
              ...accountData,
              logoURL: accountData.logoURL || 'https://res.cloudinary.com/duwrqxvey/image/upload/v1745689776/default-avatar-icon-of-social-media-user-vector_zoyryv.jpg', // add default logo if missing
            };
          });
      
          filteredAccounts.value = accounts.filter(account =>
            Object.entries(object).every(([key, value]) => {
              if (Array.isArray(value)) {
                return value.includes(account[key]);
              } else {
                return account[key] === value;
              }
            })
          );
        } else {
          filteredAccounts.value = []; // no data
        }
      });
      
    return { filteredAccounts, unsubscribe };
}

/**
 * examplaire use:
    import { getAccountInfoBy } from './your-file';
    import { onUnmounted } from 'vue';

    // Suppose you want to find all users whose name is "John" OR "Youssef" and whose age is 25
    const { filteredAccounts, unsubscribe } = getAccountInfoBy({
        name: ["John", "Youssef"],
        age: 25
    });

    // Now, `filteredAccounts` is a ref that will automatically update when Firestore changes

    console.log(filteredAccounts.value); // initial value

    // When the component is destroyed, you should unsubscribe
    onUnmounted(() => {
    unsubscribe();
    });
 */