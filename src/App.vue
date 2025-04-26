<template>
  <div>
    <button
      @click="toggleTheme"
      class="btn btn-sm btn-outline-secondary position-fixed top-0 end-0 m-3 z-3"
    >
      Toggle {{ theme === "dark" ? "Light" : "Dark" }} Mode
    </button>
    <router-view />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";

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
    "--input-focus-shadow": "#ff38b840", // new (semi-transparent pink)
    "--input-placeholder-color": "#888888", // new
    "--button-glow-bg": "#ff38b8",
    "--button-glow-fade": "#ff38b8",
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
    "--input-focus-bg": "#ffffff", // new
    "--input-focus-shadow": "#ff38b840", // new (semi-transparent pink)
    "--input-placeholder-color": "#aaaaaa", // new
    "--button-glow-bg": "#ff38b8",
    "--button-glow-fade": "#ff38b8",
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
