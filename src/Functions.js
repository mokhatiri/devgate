import { db } from "./firebase";
import { ref as vueRef } from 'vue';
import { doc, onSnapshot, collection, onSnapshot as onCollectionSnapshot, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";

/** 
 * Reactive single account info (by userId)
 */
export async function getAccountInfo(userId) {
    const accountInfo = vueRef(null);

    // Get initial data
    const accountInfoRef = doc(db, "users", userId);
    const initialDoc = await getDoc(accountInfoRef);
    
    if (initialDoc.exists()) {
        const data = initialDoc.data();
        accountInfo.value = {
            id: initialDoc.id,
            ...data,
            photoURL: data.photoURL || "https://res.cloudinary.com/duwrqxvey/image/upload/v1745689776/default-avatar-icon-of-social-media-user-vector_zoyryv.jpg"
        };
    }

    // Set up real-time listener
    const unsubscribe = onSnapshot(accountInfoRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            accountInfo.value = {
                id: docSnap.id,
                ...data,
                photoURL: data.photoURL || "https://res.cloudinary.com/duwrqxvey/image/upload/v1745689776/default-avatar-icon-of-social-media-user-vector_zoyryv.jpg"
            };
        } else {
            accountInfo.value = null;
        }
    });

    return { accountInfo, unsubscribe };
}

export async function getAccountInfoStable(userId) {
    const accountInfo = vueRef(null);

    // Get initial data
    const accountInfoRef = doc(db, "users", userId);
    const initialDoc = await getDoc(accountInfoRef);
    
    if (initialDoc.exists()) {
        const data = initialDoc.data();
        accountInfo.value = {
            id: initialDoc.id,
            ...data,
            photoURL: data.photoURL || "https://res.cloudinary.com/duwrqxvey/image/upload/v1745689776/default-avatar-icon-of-social-media-user-vector_zoyryv.jpg"
        };
    }

    return accountInfo;
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
 * Updates user profile sections
 * param {string} userId - The user ID
 * param {string} section - Section to update ('projects', 'skills', 'recentActivity', 'technicalGoals')
 * param {Object|Array} data - The new data to add/update
 * param {string} operation - The operation to perform ('add', 'update', 'remove')
 */

export async function updateUserSection(userId, section, data, operation = 'add', type = "default") {
    if (!userId) {
        throw new Error('User ID is required');
    }

    try {
        const userRef = doc(db, "users", userId);
        
        switch (operation) {
            case 'add':
                // Add new item to array
                await updateDoc(userRef, {
                    [section]: arrayUnion(data)
                });
                break;

            case 'update':
                // For updating existing items
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    const currentData = userDoc.data()[section] || [];
                    const updatedData = currentData.map(item => 
                        item.id === data.id ? { ...item, ...data } : item
                    );
                    await updateDoc(userRef, {
                        [section]: updatedData
                    });
                }
                break;

            case 'remove':
                // if the type is id, remove by checking for the id
                if (type === "id") {
                    const userDoc = await getDoc(userRef);
                    if (userDoc.exists()) {
                        const currentData = userDoc.data()[section] || [];
                        const updatedData = currentData.filter(item => item.id !== data);
                        await updateDoc(userRef, {
                            [section]: updatedData
                        });
                    }
                } else {
                    // Remove item from array
                    await updateDoc(userRef, {
                        [section]: arrayRemove(data)
                    });
                }
                break;

            default:
                throw new Error('Invalid operation');
        }

        return true;
    } catch (error) {
        console.error(`Error updating ${section}:`, error);
        throw error;
    }
}



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
              photoURL: accountData.photoURL || 'https://res.cloudinary.com/duwrqxvey/image/upload/v1745689776/default-avatar-icon-of-social-media-user-vector_zoyryv.jpg', // add default logo if missing
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