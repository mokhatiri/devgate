<template>
    <div class="online-dot-container">
        <span
        v-if="online"
        class="online-indicator"
        :class="{ 'online': online }"
        ></span>
        <span 
        v-else
        class="online-indicator"
        :class="{ 'offline': !online }"
        ></span>
    </div>
</template>

<script setup>
import { useUserPresence } from '@/firebase';
import { defineProps } from 'vue';

const props = defineProps({
    user: {
        type: Object,
        required: true
    }
});
const online = useUserPresence(props.user.id);
</script>

<style scoped>
.online-dot-container {
    display: inline-block;
    margin-left: 8px;
    position: relative;
}

.online-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transition: background-color 0.3s ease;
}

.online {
    background-color: #27c93f;
    box-shadow: 0 0 4px #27c93f;
}

.offline {
    background-color: #ff5f56;
    box-shadow: 0 0 4px #ff5f56;
}
</style>