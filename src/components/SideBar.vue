<template>
    <div
      v-if="!isAuthPage"
      class="sidebar d-flex flex-column justify-content-between p-3"
      :class="[{'collapsed': isCollapsed},{'rounded-end-4': !isCollapsed}]"
      @mouseenter="isCollapsed = false"
      @mouseleave="isCollapsed = true"
    >
    <div class="sidebar-logo mb-4" style="margin-top: 30px;">
      <h2 class="fw-bold brand-title" v-if="!isCollapsed">
        DEV<span class="text-primary">GATE</span>
      </h2>
      <h2 class="fw-bold brand-title" v-else>
        D<span class="text-primary">G</span>
      </h2>
      <div class="code-line small text-primary" >&lt;{{!isCollapsed ? "Sidebar " : ""}}/&gt;</div>
    </div>

    <nav class="nav flex-column">

      <router-link
        v-for="link in links"
        :key="link.name"
        :to="link.path"
        class="nav-link sidebar-link"
        active-class="active-link"
      >
        <i :class="link.icon" class="me-2"></i> {{ !isCollapsed ? link.name : '' }}
      </router-link>
    </nav>

    <div>
      <div>
        <!-- account info -->
      </div>
      <nav class="nav flex-column">
      <router-link to="/settings" class="nav-link sidebar-link">
      <i class="bi bi-gear me-2" ></i> {{ !isCollapsed ? "Settings" : '' }}
      </router-link>
      </nav>  
    </div>
  </div>
</template>
  
  <script setup>
  import { ref } from "vue";
  import {}
  
  const isCollapsed = ref(true);

  // List of sidebar links
  const links = [
    { name: "Dashboard", path: "/", icon: "bi bi-house" },
    { name: "Explore", path: "/explore", icon: "bi bi-search" },
    { name: "Profile", path: "/profile", icon: "bi bi-person" },
    { name: "Chat", path: "/chat", icon: "bi bi-chat" },
    { name: "Notifications", path: "/notifications", icon: "bi bi-bell" },
  ];  
  </script>
  
  <style scoped>
  .sidebar {
    width: 250px;
    min-height: 100vh;
    background-color: var(--card-bg);
    color: var(--text-color);
    font-family: "Inter", sans-serif;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 10;
    transition: background-color 0.3s ease;
    box-shadow: 2px 0 10px var(--glow-bg) !important;
  }

  .collapsed {
    width: 80px;
  }
  

  .toggle-button {
    background: none;
    border: none;
    color: var(--accent-color);
    font-size: 1.5rem;
    cursor: pointer;
    margin-bottom: 1rem;
  }

  .sidebar-logo {
    text-align: center;
  }
  
  .nav-link {
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
  }
  
  .nav-link:hover {
    color: var(--accent-color);
  }
  
  .active-link {
    color: var(--accent-color);
    font-weight: 700;
  }
  
  .sidebar-link i {
    font-size: 1.2rem;
  }
    
  .sidebar {
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.15);
  }
  </style>
  