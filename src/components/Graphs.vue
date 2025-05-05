<template>
  <div class="graphs-section">
    <div class="row">
      <div class="col-12 col-md-6">
        <ProjectsGraph :projects="projects" />
      </div>
      <div class="col-12 col-md-6">
        <SkillsGraph :skills="skills" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import ProjectsGraph from './ProjectsGraph.vue';
import SkillsGraph from './SkillsGraph.vue';

defineProps({
  projects: {
    type: Array,
    required: true,
    default: () => []
  },
  skills: {
    type: Array,
    required: true,
    default: () => []
  },
  recentActivity: {
    type: Array,
    default: () => []
  }
});
</script>

<style scoped>
.graphs-section {
  margin-top: 2rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin-right: -15px;
  margin-left: -15px;
}

.col-12 {
  width: 100%;
  padding-right: 15px;
  padding-left: 15px;
  margin-bottom: 30px;
}

@media (min-width: 768px) {
  .col-md-6 {
    width: 50%;
  }
}
</style>