<template>
    <div class="dashboard-container">
        <!-- Image Preview Modal -->
        <div v-if="showImagePreview" class="image-preview-modal" @click="closeImagePreview">
            <div class="preview-content" @click.stop>
                <img :src="previewImageURL" alt="Preview" />
                <button class="close-preview" @click="closeImagePreview">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        </div>

        <ProfileCard 
            :userId="userId" 
            @showPreview="handlePreview"
        />

        <TechGoals :technicalGoals="CurrUser.technicalGoals || []"  :userId="userId" />
        
        <Skills :skills="CurrUser.skills || []" :userId="userId" />

        <Projects :projects="CurrUser.projects || []"  :userId="userId" />

        <RecentActivity :recentActivity="CurrUser.recentActivity || []" v-if="route.name == 'dashboard'" />

        <Graphs :projects="CurrUser.projects || []" :skills="CurrUser.skills || []" :recentActivity="CurrUser.recentActivity"/>
    </div>
</template>
  
<script setup>
import { onMounted, ref, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAccountInfoStable } from '@/Functions';
import {CurrUser as Accuser, auth} from '@/firebase';
import Skills from "@/components/Skills.vue";
import Projects from "@/components/Projects.vue";
import RecentActivity from "@/components/RecentActivity.vue";
import TechGoals from "@/components/TechGoals.vue";
import ProfileCard from "@/components/ProfileCard.vue";
import Graphs from "@/components/Graphs.vue";

const route = useRoute();
const router = useRouter();

const userId = ref(null);
const CurrUser = ref({});
let unsubscribeUser = null;

// Add these new refs for image preview
const showImagePreview = ref(false);
const previewImageURL = ref('');

// Add these new functions
function handlePreview(imageUrl) {
    previewImageURL.value = imageUrl;
    showImagePreview.value = true;
}

function closeImagePreview() {
    showImagePreview.value = false;
    previewImageURL.value = '';
}

onMounted(async () => {
    const cursor = document.querySelector('.cursor');
    if (cursor) {
        setInterval(() => {
            cursor.style.opacity = cursor.style.opacity === '0' ? '1' : '0';
        }, 500);
    }

    // Cleanup previous subscription if exists
    if (unsubscribeUser) {
        unsubscribeUser();
    }

    if(route.name === "userprofile") {
        userId.value = route.params.id;
        const accountInfo = await getAccountInfoStable(userId.value);
        CurrUser.value = accountInfo.value; // Update .value instead of reassigning
        if(!CurrUser.value){
            router.push({ name: 'dashboard' });
        }
    } else {
        userId.value = auth.currentUser.uid;
        CurrUser.value = Accuser.value; // Update .value instead of reassigning
    }
});

// Add cleanup when component is destroyed
onUnmounted(() => {
    if (unsubscribeUser) {
        unsubscribeUser();
    }
});

// Watch for route changes to update user data
watch(
    () => route.params.id,
    async (newId) => {
        if (unsubscribeUser) {
            unsubscribeUser();
        }

        if(route.name === "userprofile" && newId) {
            userId.value = newId;
            const accountInfo = await getAccountInfoStable(newId);
            CurrUser.value = accountInfo.value; // Update .value instead of reassigning
        } else {
            userId.value = auth.currentUser.uid;
            CurrUser.value = Accuser.value; // Update .value instead of reassigning
        }
    }
);
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

/* Add these new styles */
.image-preview-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.preview-content {
    position: relative;
    max-width: 90%;
    max-height: 90%;
}

.preview-content img {
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
}

.close-preview {
    position: absolute;
    top: -40px;
    right: 0;
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.close-preview:hover {
    transform: scale(1.1);
}
</style>