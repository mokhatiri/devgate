<template>
    <div class="dashboard-container">
      <div class="row g-4">
        <!-- Header Section -->
        <div class="col-12">
          <div class="window">
            <div class="window-header">
              <div class="window-dots">
                <span class="dot dot-red"></span>
                <span class="dot dot-yellow"></span>
                <span class="dot dot-green"></span>
              </div>
              <h2 class="window-title">Tableau de bord</h2>
            </div>
            <div class="window-body p-4">
              <div class="window-body-content">
                <div class="terminal-content">
                  <div class="terminal-header">
                    <span class="text-primary">~/user/{{ truncateUsername(CurrUser.name) }}</span> <span class="text-secondary">$</span> <span class="cursor">_</span>
                  </div>
                  <div class="terminal-line">
                    <span class="text-primary">$</span> <span class="text-secondary">./welcome.sh</span>
                  </div>
                  <p class="text-secondary mt-2">Bonjour {{ truncateUsername(CurrUser.name) }}, bienvenue sur votre tableau de bord personnel.</p>
                </div>
                <div class="user-profile">
                  <img :src="CurrUser.photoURL || 'default-avatar.png'" :alt="CurrUser.name" class="rounded-circle profile-image">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Technical Goals Section -->
        <TechGoals :technicalGoals="CurrUser.technicalGoals || []" :userId="CurrUser.uid"/>
        
        <!-- Skills Section -->
        <Skills :skills="CurrUser.skills || []" />

        <!-- Projects Section -->
        <Projects :projects="CurrUser.projects || []" :userId="CurrUser.uid" />

        <!-- Recent Activity Section -->
        <RecentActivity :recentActivity="CurrUser.recentActivity || []" />

      </div>
    </div>
  </template>
  
  <script setup>
  import { onMounted } from 'vue';
  import { CurrUser } from "@/firebase";

  import Skills from "@/components/Skills.vue";
  import Projects from "@/components/Projects.vue";
  import RecentActivity from "@/components/RecentActivity.vue";
  import TechGoals from "@/components/TechGoals.vue";

  const truncateUsername = (username) => {
    if(!username) return '';
    if (username.length > 60) {
      return username.substring(0, 60) + '...';
    }
    return username;
  };

  onMounted(() => {
    const cursor = document.querySelector('.cursor');
    if (cursor) {
      setInterval(() => {
        cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
      }, 500);
    }
  });
  </script>

  <style scoped src="@/assets/css/windows.css"></style>
  <style scoped>
  .window-body-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 2rem;
  }

  .terminal-content {
    flex: 1;
  }

  .user-profile {
    flex-shrink: 0;
  }

  .profile-image {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border: 2px solid #ccc;
  }
  </style>