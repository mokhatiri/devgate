<template>
  <ProjectsGraph :projects="projects" />


</template>


<script setup>
import { defineProps } from 'vue';
import ProjectsGraph from './ProjectsGraph.vue'

const props = defineProps({
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