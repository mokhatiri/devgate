<template>
    <div class="coding-community-container">
      <!-- Left Section: Communities -->
      <div class="terminal-panel communities-section">
        <div class="terminal-header">
          <div class="terminal-dots">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <div class="terminal-title">communities.sh</div>
        </div>
        
        <div class="terminal-body">
          <div class="input-group mb-3 command-line">
            <span class="input-group-text code-font">
              <i class="bi bi-search"></i>
            </span>
            <input 
              type="text" 
              class="form-control code-font"
              v-model="communitySearch"
              placeholder="grep community..."
            />
          </div>
          
          <div class="communities-list custom-scrollbar">
            <div 
              v-if="loading"
              class="empty-state code-font text-center p-4"
            >
              <div class="spinner-border text-accent" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2">// Loading communities...</p>
            </div>
            
            <div 
              v-else-if="communities.length === 0"
              class="empty-state code-font text-center p-4"
            >
              <i class="bi bi-code-slash fs-1"></i>
              <p class="mt-2">// No communities found</p>
            </div>
            
            <div 
              v-for="community in filteredCommunities" 
              :key="community.id"
              class="community-item"
              :class="{ 'active': selectedCommunityId && selectedCommunityId === community.id }"
              @click="selectCommunity(community.id)"
            >
              <div class="community-icon">
                <i class="bi bi-braces"></i>
              </div>
              <div class="community-info">
                <h5 class="community-name code-font">{{ community.name }}</h5>
                <p class="community-members code-comment">// {{ community.memberCount || 0 }} developers</p>
              </div>
            </div>
          </div>
          
          <button class="btn add-community-btn" @click="$router.push('/addcommunity')">
            <i class="bi bi-plus-circle"></i>
            <span class="code-font">new Community()</span>
          </button>
        </div>
      </div>
      
      <!-- Middle Section: Posts (Using the CommunityDisplay component) -->
      <CommunityDisplay :community-id="selectedCommunityId" />
      
      <!-- Right Section: Users -->
      <div class="terminal-panel users-section">
        <div class="terminal-header">
          <div class="terminal-dots">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <div class="terminal-title">users.json</div>
        </div>
        
        <div class="terminal-body">
          <div class="users-header mb-3">
            <h4 class="code-font mb-3"><span class="text-accent">{</span> Developers <span class="text-accent">}</span></h4>
            <div class="filter-controls">
              <div class="form-check mb-2">
                <input 
                  class="form-check-input" 
                  type="checkbox" 
                  id="friendsOnly" 
                  v-model="friendsOnly"
                />
                <label class="form-check-label code-font" for="friendsOnly">
                  .filter(user => user.isFriend)
                </label>
              </div>
              
              <div class="input-group input-group-sm command-line">
                <span class="input-group-text code-font">
                  <i class="bi bi-search"></i>
                </span>
                <input 
                  type="text" 
                  class="form-control code-font"
                  placeholder="find user"
                  v-model="userSearch"
                />
              </div>
            </div>
          </div>
          
          <div class="users-list custom-scrollbar">
            <div 
              v-for="user in filteredUsers" 
              :key="user.id" 
              class="user-item"
            >
              <img 
                :src="user.photoURL" 
                alt="Profile" 
                class="user-avatar"
              />
              <div class="user-info">
                <div class="user-name code-font">{{ user.name || user.displayName }}</div>
                <div class="user-username code-comment">@{{ user.username || user.id.substring(0, 8) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, onUnmounted } from "vue";
  import { collection, query, onSnapshot, getDocs } from 'firebase/firestore';
  import { db } from '@/firebase';
  import { getAccountsInfoBy } from "@/Functions";
  import { CurrUser } from "@/firebase";
  import CommunityDisplay from '@/components/CommunityDisplay.vue';
  
  const communitySearch = ref("");
  const userSearch = ref("");
  const friendsOnly = ref(false);
  const communities = ref([]);
  const selectedCommunityId = ref(null);
  const loading = ref(true);
  const currentUser = CurrUser;
  console.log("Current User:", currentUser.value);
  
  const { filteredAccounts, unsubscribe } = getAccountsInfoBy({});
  
  const filteredUsers = computed(() => {
    return filteredAccounts.value.filter((user) => {
      const userName = user.name || user.displayName || "";
      const userUsername = user.username || user.id || "";
      
      const matchesSearch =
        userName.toLowerCase().includes(userSearch.value.toLowerCase()) ||
        userUsername.toLowerCase().includes(userSearch.value.toLowerCase());
      const matchesFriendsOnly = !friendsOnly.value || user.isFriend;
      return matchesSearch && matchesFriendsOnly;
    });
  });
  
  const filteredCommunities = computed(() => {
    return communities.value.filter((community) =>
      community.name.toLowerCase().includes(communitySearch.value.toLowerCase())
    );
  });
  
  // Fetch communities from Firebase
  async function fetchCommunities() {
    try {
      loading.value = true;
      const communityCollection = collection(db, "communities");
      
      // Subscribe to communities collection updates
      const unsubscribeCommunities = onSnapshot(communityCollection, (snapshot) => {
        communities.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        loading.value = false;
      }, (error) => {
        console.error("Error fetching communities:", error);
        loading.value = false;
      });
      
      return unsubscribeCommunities;
    } catch (error) {
      console.error("Error setting up communities listener:", error);
      loading.value = false;
    }
  }
  
  const selectCommunity = (communityId) => {
    selectedCommunityId.value = communityId;
  };
  
  let unsubscribeCommunities = null;
  
  onMounted(async () => {
    unsubscribeCommunities = await fetchCommunities();
  });
  
  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe();
    }
    
    if (unsubscribeCommunities) {
      unsubscribeCommunities();
    }
  });
  </script>
  
  <style scoped>
  /* Import a monospace font for code */
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap');
  
  /* Base styles */
  .coding-community-container {
    display: grid;
    grid-template-columns: 280px 1fr 280px;
    gap: 20px;
    height: calc(100vh - 60px);
    overflow: hidden;
    padding: 0 10px;
    font-family: var(--body-font-family);
  }
  
  /* Terminal panels */
  .terminal-panel {
    background-color: var(--card-bg);
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .terminal-header {
    background-color: var(--navbar-bg);
    padding: 8px 12px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
  }
  
  .terminal-dots {
    display: flex;
    gap: 6px;
    margin-right: 12px;
  }
  
  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  
  .red { background-color: #ff5f57; }
  .yellow { background-color: #febc2e; }
  .green { background-color: #28c840; }
  
  .terminal-title {
    font-family: 'Fira Code', monospace;
    font-size: 13px;
    color: var(--text-secondary);
  }
  
  .terminal-body {
    padding: 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  /* Code styling */
  .code-font {
    font-family: 'Fira Code', monospace !important;
    font-size: 14px;
  }
  
  .code-comment {
    color: var(--code-comment);
    font-family: 'Fira Code', monospace;
    font-size: 12px;
  }
  
  .text-accent {
    color: var(--accent-color);
  }
  
  /* Command line input styling */
  .command-line .input-group-text {
    background-color: var(--input-group-text-bg);
    border-color: var(--input-group-text-border);
  }
  
  .command-line .form-control {
    background-color: var(--chat-input-bg);
    border-color: var(--input-group-text-border);
  }
  
  .command-line .form-control:focus {
    background-color: var(--input-focus-bg);
    box-shadow: 0 0 0 0.25rem var(--input-focus-shadow);
  }
  
  /* Custom scrollbar */
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: var(--accent-secondary) var(--dark-bg);
    overflow-y: auto;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: var(--dark-bg);
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: var(--accent-secondary);
    border-radius: 20px;
  }
  
  /* Communities section */
  .communities-section {
    height: 100%;
  }
  
  .communities-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }
  
  .community-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 4px;
  }
  
  .community-item:hover {
    background-color: var(--card-hover-bg);
  }
  
  .community-item.active {
    background-color: var(--message-sent-bg);
    color: white;
  }
  
  .community-item.active .code-comment {
    color: rgba(255, 255, 255, 0.7);
  }
  
  .community-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--button-gradient-bg);
    border-radius: 6px;
    color: white;
    margin-right: 12px;
    font-size: 14px;
  }
  
  .community-info {
    flex: 1;
  }
  
  .community-name {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }
  
  .community-members {
    margin: 0;
    font-size: 12px;
  }
  
  .add-community-btn {
    background: var(--button-gradient-bg);
    color: white;
    border: none;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
    width: 100%;
    margin-top: 10px;
  }
  
  .add-community-btn:hover {
    opacity: 0.9;
  }
  
  /* Users section */
  .users-section {
    height: 100%;
  }
  
  .users-list {
    flex: 1;
    overflow-y: auto;
  }
  
  .user-item {
    display: flex;
    align-items: center;
    padding: 10px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-bottom: 4px;
  }
  
  .user-item:hover {
    background-color: var(--card-hover-bg);
  }
  
  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    margin-right: 12px;
    object-fit: cover;
  }
  
  .user-info {
    flex: 1;
  }
  
  .user-name {
    font-weight: 600;
    font-size: 14px;
  }
  
  .user-username {
    font-size: 12px;
  }
  
  /* Empty state styles */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    color: var(--text-secondary);
  }
  
  /* Small screens adjustments */
  @media (max-width: 992px) {
    .coding-community-container {
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr auto;
    }
    
    .users-section, .communities-section {
      height: 300px;
    }
  }
  </style>