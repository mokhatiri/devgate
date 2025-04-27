<template>
  <div>
    <SideBar v-if="!isAuthPage" />
    <router-view :style="!isAuthPage ? 'margin-left: 80px; width: Calc(100% - 80px)' : ''" />
  
    <button
      @click="toggleTheme"
      class="btn btn-sm position-fixed bottom-0"
      style="z-index: 9999;"
    >
      <i :class="theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill'"></i>
    </button>

  </div>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import SideBar from "./components/SideBar.vue";
import { useRoute } from "vue-router";

const route = useRoute();

// Pages where sidebar should be hidden
const authPages = ["/login", "/signup", "/forgotpassword"];

const isAuthPage = computed(() => authPages.includes(route.path.toLowerCase()));

const theme = ref(
  localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light")
);

const applyTheme = () => {
  document.body.setAttribute("data-bs-theme", theme.value);

  const darkModeStyles = {
    "--bs-body-bg": "#121212",
    "--bs-body-color": "#e1e1e1",
    "--accent-color": "#ff38b8",
    "--accent-secondary": "#6464ff",
    "--dark-bg": "#181818",
    "--card-bg": "#232323",
    "--text-color": "#f8f9fa",
    "--text-secondary": "#c6c6c6",
    "--code-comment": "#6d6d7f",
    "--code-keyword": "#ff38b8",
    "--code-function": "#6464ff",
    "--background-logo-color": "#ffffff",
    "--input-group-text-bg": "#333333",
    "--input-group-text-border": "#444444",
    "--input-focus-bg": "#222222", // new
    "--input-focus-shadow": "#ff38b840", // new
    "--input-placeholder-color": "#888888", // new
    "--glow-bg": "#ff38b8",
    "--glow-fade": "#ff38b8",
    "--verify-alert-bg": "#4444ff",
    "--verify-alert-border": "#6464ff",
    "--strength-meter-bg": "#555555",
    "--strength-bar-bg": "#ffffff",
    "--border-color": "#444444",
    "--button-bg": "#444444",
    "--button-border": "#555555",
    "--button-text": "#f8f9fa",
    "--link-color": "#ff38b8",
    "--link-hover-color": "#ffffff",
    "--alert-bg": "#333333",
    "--alert-border": "#ff38b8",
    "--navbar-bg": "#202020",
    "--navbar-text": "#f0f0f0",
    "--step-indicator-bg": "#2c2c2c", // new
    "--progress-line-bg": "#444444", // new
    "--message-sent-bg": "#6464ff",        // keep it, fits dark mode too
    "--message-received-bg": "#232323",    // soft dark card background
    "--chat-input-bg": "#181818",          // slightly darker for input area
    "--chat-border": "#444444",            // dark subtle border
    "--card-hover-bg": "#2a2a2a",
    "--progress-bar-active-bg": "#ff38b8",
    "--navbar-hover-bg": "#333333",
    "--error-alert-bg": "#e74c3c",
    "--active-button-bg": "#333333",
    "--button-hover-bg": "#555555",
    "--heading-font-weight": "600",       // Adjust heading weight
    "--body-font-family": "'Roboto', sans-serif", // Font for body text
    "--button-gradient-bg": "linear-gradient(45deg, #ff38b8, #6464ff)",
  };

  const lightModeStyles = {
    "--bs-body-bg": "#ffffff",
    "--bs-body-color": "#000000",
    "--accent-color": "#ff38b8",
    "--accent-secondary": "#6464ff",
    "--dark-bg": "#f8f9fa",
    "--card-bg": "#e1e1e6",
    "--text-color": "#000000",
    "--text-secondary": "#555555",
    "--code-comment": "#6d6d7f",
    "--code-keyword": "#ff38b8",
    "--code-function": "#6464ff",
    "--background-logo-color": "#000000",
    "--input-group-text-bg": "#f0f0f0",
    "--input-group-text-border": "#cccccc",
    "--input-focus-bg": "#ffffff",
    "--input-focus-shadow": "#ff38b840",
    "--input-placeholder-color": "#aaaaaa",
    "--glow-bg": "#ff38b8",
    "--glow-fade": "#ff38b8",
    "--verify-alert-bg": "#6666ff",
    "--verify-alert-border": "#6464ff",
    "--strength-meter-bg": "#dddddd",
    "--strength-bar-bg": "#ff38b8",
    "--border-color": "#cccccc",
    "--button-bg": "#ffffff",
    "--button-border": "#dddddd",
    "--button-text": "#000000",
    "--link-color": "#ff38b8",
    "--link-hover-color": "#6464ff",
    "--alert-bg": "#e0f7fa",
    "--alert-border": "#ff38b8",
    "--navbar-bg": "#ffffff",
    "--navbar-text": "#000000",
    "--step-indicator-bg": "#dddddd", // new
    "--progress-line-bg": "#cccccc", // new
    "--message-sent-bg": "#6464ff",        // nice blue accent for sent
    "--message-received-bg": "#f0f0f0",    // light gray for received
    "--chat-input-bg": "#f9f9f9",          // light input background
    "--chat-border": "#cccccc",            // soft border
    "--card-hover-bg": "#eaeaea",
    "--card-hover-bg": "#eaeaea",
    "--progress-bar-active-bg": "#ff38b8",
    "--navbar-hover-bg": "#f2f2f2",
    "--error-alert-bg": "#ff6b6b",
    "--active-button-bg": "#dddddd",
    "--button-hover-bg": "#f0f0f0",
    "--heading-font-weight": "600",       // Adjust heading weight
    "--body-font-family": "'Roboto', sans-serif", // Font for body text
    "--button-gradient-bg": "linear-gradient(45deg, #ff38b8, #6464ff)",
  };

  const styles = theme.value === "dark" ? darkModeStyles : lightModeStyles;

  Object.keys(styles).forEach((key) => {
    document.documentElement.style.setProperty(key, styles[key]);
  });

  localStorage.setItem("theme", theme.value);
};

const toggleTheme = () => {
  theme.value = theme.value === "light" ? "dark" : "light";
  applyTheme();
};

onMounted(() => {
  applyTheme();
});
</script>

