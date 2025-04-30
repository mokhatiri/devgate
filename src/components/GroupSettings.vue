<template>
    <div 
      class="modal"
      :class="{ 'show d-block': true }" 
      tabindex="-1"
      style="background: rgba(0, 0, 0, 0.5);"
      @click.self="$emit('close')"
    >
      <div class="modal-dialog modal-dialog-centered" @click.stop>
        <div class="modal-content terminal-modal">
          <div class="modal-header terminal-modal-header">
            <h5 class="modal-title terminal-modal-title">GROUP_SETTINGS: {{ groupData?.name }}</h5>
            <button type="button" class="terminal-close-btn" @click="$emit('close')">x</button>
          </div>
          <div class="modal-body terminal-modal-body" v-if="groupData">
            <!-- Group Info -->
            <div class="terminal-section">
              <div class="terminal-heading">GROUP_INFO</div>
              <div class="group-info">
                <img :src="groupData.photoURL" alt="Group Avatar" class="group-avatar" />
                <div class="group-details">
                  <div>Name: {{ groupData.name }}</div>
                  <div>Created: {{ formatDate(groupData.createdAt) }}</div>
                  <div>Members: {{ groupData.members?.length || 0 }}</div>
                </div>
              </div>
            </div>
  
            <!-- Members Section -->
            <div class="terminal-section">
              <div class="terminal-heading">MEMBERS_LIST</div>
              <div class="members-list">
                <div v-for="memberId in groupData.members" :key="memberId" class="member-item">
                  <img :src="getMemberAvatar(memberId)" class="member-avatar" />
                  <span class="member-name">{{ getMemberName(memberId) }}</span>
                  <span v-if="isAdmin(memberId)" class="admin-badge">ADMIN</span>
                  <!-- Admin Controls -->
                  <div v-if="isCurrentUserAdmin && memberId !== currUserId" class="member-controls">
                    <button 
                      v-if="!isAdmin(memberId)"
                      @click="makeAdmin(memberId)" 
                      class="terminal-btn-sm"
                    >
                      [MAKE_ADMIN]
                    </button>
                    <button 
                      v-if="isAdmin(memberId)"
                      @click="removeAdmin(memberId)" 
                      class="terminal-btn-sm"
                    >
                      [REMOVE_ADMIN]
                    </button>
                    <button 
                      @click="removeMember(memberId)" 
                      class="terminal-btn-sm remove-btn"
                    >
                      [REMOVE]
                    </button>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- Leave Group Button -->
            <div class="terminal-section">
              <button 
                @click="leaveGroup" 
                class="terminal-btn danger-btn" 
                style="width: 100%"
              >
                [ LEAVE_GROUP ]
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed, ref, onMounted, onUnmounted } from 'vue';
  import { doc, updateDoc, arrayRemove, arrayUnion, deleteDoc, getDoc, onSnapshot } from 'firebase/firestore';
  import { db, auth } from '@/firebase';
  import { 
    collection, 
    getDocs, 
    writeBatch,
    query
  } from 'firebase/firestore';
  
  const props = defineProps({
    group: {
      type: Object,
      required: true
    },
    userCache: {
      type: Object,
      required: true
    }
  });
  
  const emit = defineEmits(['close', 'groupLeft']);
  const currUserId = auth.currentUser.uid;
  
  // Create a reactive reference for the group data
  const groupData = ref(null);
  
  // Update isCurrentUserAdmin to use groupData instead of props
  const isCurrentUserAdmin = computed(() => {
    return groupData.value?.admins?.includes(currUserId);
  });
  
  // Setup real-time listener for group changes
  let unsubscribe;
  
  onMounted(() => {
    // Start listening to group changes
    unsubscribe = onSnapshot(doc(db, 'groups', props.group.id), (doc) => {
      if (doc.exists()) {
        groupData.value = {
          id: doc.id,
          ...doc.data()
        };
      }
    });
  });
  
  onUnmounted(() => {
    // Clean up listener when component is destroyed
    if (unsubscribe) {
      unsubscribe();
    }
  });
  
  // Update other functions to use groupData instead of props.group
  function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleDateString();
  }
  
  function getMemberAvatar(memberId) {
    return props.userCache[memberId]?.photoURL || 'default-avatar-url';
  }
  
  function getMemberName(memberId) {
    return props.userCache[memberId]?.name || 'Unknown User';
  }
  
  function isAdmin(memberId) {
    return groupData.value?.admins?.includes(memberId);
  }
  
  async function makeAdmin(memberId) {
    if (!isCurrentUserAdmin.value) return;
    const groupRef = doc(db, 'groups', groupData.value.id);
    await updateDoc(groupRef, {
      admins: arrayUnion(memberId)
    });
  }
  
  async function removeAdmin(memberId) {
    if (!isCurrentUserAdmin.value) return;
    const groupRef = doc(db, 'groups', groupData.value.id);
    await updateDoc(groupRef, {
      admins: arrayRemove(memberId)
    });
  }
  
  async function removeMember(memberId) {
    if (!isCurrentUserAdmin.value) return;
    const groupRef = doc(db, 'groups', groupData.value.id);
    await updateDoc(groupRef, {
      members: arrayRemove(memberId),
      admins: arrayRemove(memberId) // Also remove from admins if they were one
    });
  }
  
  async function leaveGroup() {
    const groupRef = doc(db, 'groups', props.group.id);
    const groupSnap = await getDoc(groupRef);
    const groupData = groupSnap.data();
    
    // Calculate remaining members after current user leaves
    const remainingMembers = groupData.members.filter(id => id !== currUserId);
    
    if (remainingMembers.length === 0) {
      // If no members will remain, delete the group and all its subcollections
      const batch = writeBatch(db);
      
      // Delete all messages
      const messagesQuery = query(collection(db, 'groups', props.group.id, 'messages'));
      const messagesSnap = await getDocs(messagesQuery);
      messagesSnap.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete all lastRead records
      const lastReadQuery = query(collection(db, 'groups', props.group.id, 'lastRead'));
      const lastReadSnap = await getDocs(lastReadQuery);
      lastReadSnap.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete the group document itself
      batch.delete(groupRef);

      // Commit all deletions
      await batch.commit();
    } else {
      // Otherwise just remove the current user
      await updateDoc(groupRef, {
        members: arrayRemove(currUserId),
        admins: arrayRemove(currUserId)
      });

      // Delete user's lastRead record
      const lastReadRef = doc(db, 'groups', props.group.id, 'lastRead', currUserId);
      await deleteDoc(lastReadRef);
    }
    
    emit('groupLeft');
    emit('close');
  }
  </script>
  
  <style scoped>
  .group-info {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
  }
  
  .group-avatar {
    width: 60px;
    height: 60px;
    border-radius: 4px;
    border: 1px solid var(--accent-color);
  }
  
  .group-details {
    font-size: 0.9em;
  }
  
  .members-list {
    max-height: 300px;
    overflow-y: auto;
  }
  
  .member-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border: 1px solid var(--border-color);
    margin-bottom: 5px;
    border-radius: 4px;
  }
  
  .member-avatar {
    width: 30px;
    height: 30px;
    border-radius: 4px;
  }
  
  .member-name {
    flex: 1;
  }
  
  .admin-badge {
    font-size: 0.8em;
    color: var(--accent-color);
    border: 1px solid var(--accent-color);
    padding: 2px 6px;
    border-radius: 4px;
  }
  
  .member-controls {
    display: flex;
    gap: 5px;
  }
  
  .danger-btn {
    background: var(--error-color);
    border-color: var(--error-color);
    color: white;
  }
  
  .danger-btn:hover {
    background: var(--error-color-dark);
  }
  
  .remove-btn {
    color: var(--error-color);
    border-color: var(--error-color);
  }
  
  .remove-btn:hover {
    background: var(--error-color);
    color: white;
  }

  .modal {
    z-index: 1050;
  }

  .modal-dialog {
    z-index: 1051;
  }
  </style>