<template>
  <button @click="$emit('click')" class="add-button">
    <i class="bi bi-plus-circle"></i>
  </button>
</template>

<style scoped>
.add-button {
  background: none;
  border: none;
  color: var(--accent-color);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  transition: transform 0.2s;
}

.add-button:hover {
  transform: scale(1.1);
}
</style>
