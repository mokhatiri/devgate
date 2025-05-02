<template>
    <div class="dashboard-container">
        <ProfileCard :userId = "$route.name == 'userprofile' ? $route.params.id : CurrUser.uid" />

        <Graph/>

        <TechGoals :technicalGoals="CurrUser.technicalGoals || []"  :userId = "$route.name == 'userprofile' ? $route.params.id : CurrUser.uid" />
        
        <Skills :skills="CurrUser.skills || []"/>

        <Projects :projects="CurrUser.projects || []"  :userId = "$route.name == 'userprofile' ? $route.params.id : CurrUser.uid" />

        <RecentActivity :recentActivity="CurrUser.recentActivity || []" v-if="$route.name == 'dashboard'" />
    </div>
  </template>
  
  <script setup>
  import { onMounted } from 'vue';
  import { CurrUser } from "@/firebase";

  import Skills from "@/components/Skills.vue";
  import Projects from "@/components/Projects.vue";
  import RecentActivity from "@/components/RecentActivity.vue";
  import TechGoals from "@/components/TechGoals.vue";
  import ProfileCard from "@/components/ProfileCard.vue";

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