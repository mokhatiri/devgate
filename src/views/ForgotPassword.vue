<template>
    <div
      class="container-fluid forgot-password-container"
      :class="{ 'light-mode': !isDarkMode }"
    >
      <!-- Background Logo -->
      <div class="background-logo">DEV GATE</div>
  
      <div class="row justify-content-center">
        <div class="col-md-8 col-lg-5">
          <div
            class="card shadow rounded-4"
            :class="{ 'light-mode-card': !isDarkMode }"
          >
            <div class="card-body p-5">
              <div class="logo-container mb-4">
                <h1 class="text-center fw-bold brand-title">
                  DEV<span class="text-primary">GATE</span>
                </h1>
                <div class="code-line">
                  <span>&lt;Forgot_Password /&gt;</span>
                </div>
              </div>
  
              <p class="text-center text-muted mb-5">
                Remembered your password? 
                <router-link
                  to="/login"
                  class="text-decoration-none text-accent fw-semibold"
                >
                  Sign in here
                </router-link>
              </p>
  
              <hr :class="{ 'light-mode-hr': !isDarkMode }" />
  
              <div class="mt-4">
                <div class="step-header">
                  <div class="step-title">
                    <span class="code-comment">// Reset Password</span>
                    <h3 class="mb-3 fw-bold text-accent">Enter your email</h3>
                  </div>
                </div>
  
                <form @submit.prevent="resetPassword">
                  <div
                    v-if="errorMessage"
                    class="alert alert-danger"
                    role="alert"
                  >
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    {{ errorMessage }}
                  </div>
  
                  <div class="input-wrapper mb-3">
                    <label class="form-label">
                      <span class="code-keyword">const</span> email =
                    </label>
                    <input
                      type="email"
                      class="form-control custom-input"
                      v-model="form.email"
                      required
                      placeholder="email@example.com"
                    />
                  </div>
  
                  <button
                    class="btn btn-accent w-100 py-2 button-glow mb-3"
                    type="submit"
                    :disabled="isSubmitting"
                  >
                    <span
                      v-if="isSubmitting"
                      class="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    <span v-else
                      ><i class="bi bi-arrow-repeat me-2"></i
                    ></span>
                    Reset Password
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import { useRouter } from "vue-router";
  import {
    getAuth,
    sendPasswordResetEmail,
  } from "firebase/auth";
  
  // Router instance
  const router = useRouter();
  
  // Firebase authentication
  const auth = getAuth();
  
  // Reactive references for form data and states
  const isGoogleLoading = ref(false);
  const isDarkMode = ref(true);
  const form = ref({
    email: "",
  });
  const isSubmitting = ref(false);
  const errorMessage = ref("");
  
  // Reset password function
  const resetPassword = async () => {
    isSubmitting.value = true;
    errorMessage.value = "";
  
    try {
      await sendPasswordResetEmail(auth, form.value.email);
      router.push("/login");
    } catch (error) {
      console.error("Reset Password Error:", error.message);
  
      // Handle different Firebase authentication error codes
      if (error.code === "auth/invalid-email") {
        errorMessage.value = "The email address is not valid.";
      } else if (error.code === "auth/user-not-found") {
        errorMessage.value = "No user found with this email.";
      } else {
        errorMessage.value = "An error occurred during password reset: " + error.message;
      }
    } finally {
      isSubmitting.value = false;
    }
  };
  </script>
  
  <style scoped>
  .forgot-password-container {
    min-height: 100vh;
    background-color: var(--dark-bg);
    position: relative;
    padding: 3rem 1rem;
    overflow: hidden;
    font-family: "Inter", sans-serif;
  }
  
  .background-logo {
    position: fixed;
    font-size: 18vw;
    font-weight: 800;
    color: var(--background-logo-color);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-10deg);
    white-space: nowrap;
    pointer-events: none;
    z-index: 0;
    font-family: "Fira Code", monospace;
    letter-spacing: -0.05em;
  }
  
  .card {
    background-color: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 1;
    color: var(--text-color);
    transition: background-color 0.3s ease, border-color 0.3s ease;
  }
  
  .brand-title {
    letter-spacing: -1px;
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }
  
  .text-accent {
    color: var(--accent-color);
  }
  
  .text-primary {
    color: var(--accent-secondary) !important;
  }
  
  .code-line {
    font-family: "Fira Code", monospace;
    color: var(--text-secondary);
    text-align: center;
    font-size: 0.9rem;
    margin-top: -0.5rem;
  }
  
  .code-comment {
    font-family: "Fira Code", monospace;
    color: var(--code-comment);
  }
  
  .code-keyword {
    font-family: "Fira Code", monospace;
    color: var(--code-keyword);
    font-weight: 500;
  }
  
  .form-label {
    font-family: "Fira Code", monospace;
    color: var(--text-color);
    margin-bottom: 0.25rem;
    transition: color 0.3s ease;
  }
  
  .custom-input {
    background-color: var(--input-focus-bg);
    border: 1px solid;
    border-color: var(--accent-color);
    color: var(--text-color);
    transition: all 0.3s ease;
    font-family: "Inter", sans-serif;
  }
  
  .custom-input:focus {
    background-color: var(--input-focus-bg);
    border-color: var(--accent-color);
    box-shadow: 0 0 0 0.25rem var(--input-focus-shadow);
  }
  
  .custom-input::placeholder {
    color: var(--input-placeholder-color);
  }
  
  .input-group-text {
    background-color: var(--input-group-text-bg);
    border: 1px solid var(--input-group-text-border);
    color: var(--text-secondary);
    transition: all 0.3s ease;
  }
  
  .toggle-password {
    background-color: var(--toggle-password-bg);
    border: 1px solid var(--toggle-password-border);
    color: var(--text-secondary);
    transition: all 0.3s ease;
  }
  
  .toggle-password:hover {
    background-color: var(--toggle-password-hover-bg);
  }
  
  /* Button styles */
  .btn-accent {
    background-color: var(--accent-color);
    border-color: var(--accent-color);
    color: white;
    font-weight: 600;
    transition: all 0.3s ease;
  }
  
  .btn-accent:hover,
  .btn-accent:focus {
    background-color: var(--accent-secondary);
    border-color: var(--accent-secondary);
    color: white;
  }
  
  .button-glow {
    position: relative;
    overflow: hidden;
    z-index: 1;
  }
  
  .button-glow::after {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      var(--glow-bg) 0%,
      var(--glow-fade) 70%
    );
    opacity: 0;
    z-index: -1;
    transition: opacity 0.6s ease;
  }
  
  .button-glow:hover::after {
    opacity: 1;
  }
  
  /* Step header styles */
  .step-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  
  /* Custom checkbox styling */
  .custom-checkbox {
    background-color: var(--input-focus-bg);
    border-color: var(--accent-color);
  }
  
  .custom-checkbox:checked {
    background-color: var(--accent-color);
    border-color: var(--accent-color);
  }
  
  .form-check-label {
    color: var(--text-secondary);
  }
  
  .forgot-password {
    color: var(--text-secondary);
    transition: color 0.3s ease;
  }
  
  .forgot-password:hover {
    color: var(--accent-color);
  }
  
  /* Light mode adjustments */
  .light-mode-card {
    background-color: var(--light-card-bg);
    border-color: var(--light-border-color);
  }
  
  .light-mode-hr {
    opacity: 0.1;
  }
  
  .light-mode-toggle-password {
    background-color: var(--light-toggle-password-bg);
    border-color: var(--light-toggle-password-border);
  }
  
  .light-mode-input-group-text {
    background-color: var(--light-input-group-text-bg);
    border-color: var(--light-input-group-text-border);
  }
  </style>  