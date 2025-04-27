<template>
    <span
    v-if="online"
    class="online-indicator rounded-circle"
    style="width: 8px; height: 8px; background-color: green"
    ></span>
    <span v-else
    class="online-indicator rounded-circle"
    style="width: 8px; height: 8px; background-color: red"
    ></span>
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