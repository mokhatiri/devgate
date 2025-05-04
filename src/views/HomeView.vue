<template>
    <div class="dashboard-container">
        <ProfileCard :userId = "userId" />

        <TechGoals :technicalGoals="CurrUser.technicalGoals || []"  :userId = "userId" />
        
        <Skills :skills="CurrUser.skills || []" :userId = "userId" />

        <Projects :projects="CurrUser.projects || []"  :userId = "userId" />

        <RecentActivity :recentActivity="CurrUser.recentActivity || []" v-if="route.name == 'dashboard'" />

        <Graphs :projects="CurrUser.projects || []" :skills="CurrUser.skills || []" :recentActivity="CurrUser.recentActivity"/>
    </div>
  </template>
  
  <script setup>
  import { onMounted, ref} from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { getAccountInfo } from '@/Functions';
  import {CurrUser as Accuser, auth} from '@/firebase';
  import Skills from "@/components/Skills.vue";
  import Projects from "@/components/Projects.vue";
  import RecentActivity from "@/components/RecentActivity.vue";
  import TechGoals from "@/components/TechGoals.vue";
  import ProfileCard from "@/components/ProfileCard.vue";
  import Graphs from "@/components/Graphs.vue";

  const route = useRoute();
  const router  = useRouter();

  const userId = ref(null);
  let CurrUser = ref({});

  onMounted(() => {
    const cursor = document.querySelector('.cursor');
    if (cursor) {
      setInterval(() => {
        cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
      }, 500);
    }
    if(route.name == "userprofile"){
      userId.value = route.params.id
      try{
        getAccountInfo(userId.value).then((user) => {
          CurrUser.value = user;
        });
      } catch (error) {
        router.push({ name: 'dashboard' });
      }
    }
    else{
      userId.value = auth.currentUser.uid
      CurrUser = Accuser;
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