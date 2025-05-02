<template>
  <ProjectsGraph :projects="projects" />


</template>


<script setup>
import { ref, onMounted, computed, watch, defineProps } from 'vue';
import ProjectsGraph from './ProjectsGraph.vue'

defineProps({
  projects: {
    type: Array,
    required: true
  },
  skills: {
    type: Array,
    required: true
  },
  recentActivity: {
    type: Array,
    required: true
  }

});
</script>