<template>
    <div
      class="sidebar d-flex flex-column justify-content-between p-3"
      :class="[{'collapsed': isCollapsed},{'rounded-end-4': !isCollapsed}]"
      @mouseenter="isCollapsed = false"
      @mouseleave="isCollapsed = true"
    >
    <div 
      class="sidebar-logo mb-4" 
      style="margin-top: 30px; cursor: pointer;" 
      @click="$router.push('/')"
    >
      
      <h2 class="fw-bold brand-title">
        D<span class="text-appear" :class="{ invisible: isCollapsed }">EV</span><span class="text-primary">G<span class="text-appear" :class="{ invisible: isCollapsed }">ATE</span></span>
      </h2>
      <div class="code-line small text-primary" >&lt;<span class="text-appear" :class="{invisible : isCollapsed}">Sidebar</span>/&gt;</div>
    </div>

    <nav class="nav flex-column">

      <router-link
        v-for="link in links"
        :key="link.name"
        :to="link.path"
        class="nav-link sidebar-link"
        active-class="active-link"
      >
        <i :class="link.icon" class="me-2"></i> <span class="text-appear" :class="{invisible : isCollapsed}">{{link.name}}</span>
      </router-link>
    </nav>

    <div>
      <router-link 
        class="nav sidebar-link nav-link" 
        style="padding: 1rem 0.4rem;"
        :to="'/'"
      >
      <div class="align-items-center gap-2 d-flex flex-row">
        <img
          :src="CurrUser.photoURL"
          alt="Profile Picture"
          class="rounded-circle"
          style="width: 40px; height: 40px; object-fit: cover;"
        />
        <span class="fw-semibold text-appear" :class="{invisible : isCollapsed}">{{CurrUser.name}}</span>
      </div>
      </router-link>
      <nav class="nav flex-column">
      <div class="nav-link sidebar-link" @click="auth.signOut()">
      <i class="bi bi-box-arrow-right me-2"></i> <span class="text-appear" :class="{invisible : isCollapsed}">Logout</span>
      </div>
      </nav>  
    </div>
  </div>
</template>
  
  <script setup>
  import { ref } from "vue";
  import { auth, CurrUser } from "@/firebase";

  const isCollapsed = ref(true);

  // List of sidebar links
  const links = [
    { name: "Explore", path: "/explore", icon: "bi bi-search" },
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
    transition: width 0.3s ease, background-color 0.2s ease;
    border-right: 1px solid var(--glow-bg);
  }

  .collapsed {
    width: 80px;
    padding-left: 0.5rem; /* optional, if you want tighter spacing */
    padding-right: 0.5rem;
  }

  .text-appear {
    opacity: 0;
    transition: opacity 0.2s ease 0.3s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sidebar:not(.collapsed) .text-appear {
    opacity: 1;
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

  .invisible {
    display: none;
    opacity: 0;
    visibility: hidden;
  }

  </style>
  