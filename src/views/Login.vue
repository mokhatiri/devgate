<template>
  <div
    class="container-fluid login-container"
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
                <span>&lt;Welcome_Back /&gt;</span>
              </div>
            </div>

            <p class="text-center text-muted mb-5">
              Don't have an account yet?
              <router-link
                to="/signup"
                class="text-decoration-none text-accent fw-semibold"
              >
                Sign up here
              </router-link>
            </p>

            <hr :class="{ 'light-mode-hr': !isDarkMode }" />

            <div class="mt-4">
              <div class="step-header">
                <div class="step-title">
                  <span class="code-comment">// Authentication</span>
                  <h3 class="mb-3 fw-bold text-accent">Sign In</h3>
                </div>
              </div>

              <form @submit.prevent="login">
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

                <div class="input-wrapper mb-3">
                  <label class="form-label">
                    <span class="code-keyword">const</span> password =
                  </label>
                  <div class="input-group">
                    <input
                      class="form-control custom-input"
                      v-model="form.password"
                      required
                      :type="passwordVisible ? 'text' : 'password'"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      class="btn btn-outline-secondary toggle-password"
                      :class="{ 'light-mode-toggle-password': !isDarkMode }"
                      @click="passwordVisible = !passwordVisible"
                    >
                      <i
                        :class="
                          passwordVisible ? 'bi bi-eye' : 'bi bi-eye-slash'
                        "
                      ></i>
                    </button>
                  </div>
                </div>

                <div class="d-flex justify-content-between mb-4">
                  <div class="form-check">
                    <input
                      class="form-check-input custom-checkbox"
                      type="checkbox"
                      id="rememberMe"
                      v-model="form.rememberMe"
                    />
                    <label class="form-check-label small" for="rememberMe">
                      Remember me
                    </label>
                  </div>
                  <router-link
                    to="/forgot-password"
                    class="text-decoration-none forgot-password small"
                  >
                    Forgot password?
                  </router-link>
                </div>

                <button
                  class="btn btn-accent w-100 py-2 button-glow mb-3"
                  type="submit"
                  :disabled="isLoggingIn"
                >
                  <span
                    v-if="isLoggingIn"
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></span>
                  <span v-else
                    ><i class="bi bi-box-arrow-in-right me-2"></i
                  ></span>
                  Sign In
                </button>
              </form>

              <div class="text-center">
                <hr class="my-4" :class="{ 'light-mode-hr': !isDarkMode }" />
                <p class="text-muted mb-3 code-comment">// Or continue with:</p>
                <div class="social-login-buttons">
                  <button
                    class="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
                    @click="loginWithGoogle"
                    :disabled="isLoggingIn"
                  >
                    <span
                      v-if="isGoogleLoading"
                      class="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    <img
                      v-else
                      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                      width="20"
                      height="20"
                    />
                    Sign in with Google
                  </button>
                </div>
              </div>
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
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/firebase";


// Router instance
const router = useRouter();

// Firebase authentication
const auth = getAuth();

// Reactive references for form data and states
const passwordVisible = ref(false);
const isGoogleLoading = ref(false);
const isDarkMode = ref(true);
const form = ref({
  email: "",
  password: "",
  rememberMe: false,
});
const isLoggingIn = ref(false);
const errorMessage = ref("");


const login = async () => {
  isLoggingIn.value = true;
  errorMessage.value = "";

  try {
    // Set persistence mode based on 'Remember me' checkbox
    const persistenceMode = form.value.rememberMe ? browserLocalPersistence : browserSessionPersistence;
    
    // Use setPersistence to apply persistence mode
    await setPersistence(auth, persistenceMode);

    // Perform the login
    const userCredential = await signInWithEmailAndPassword(auth, form.value.email, form.value.password);
    console.log("User logged in:", userCredential.user);
    router.push("/dashboard");
  } catch (error) {
    console.error("Login Error:", error.message);

    // Handle different Firebase authentication error codes
    if (error.code === "auth/user-disabled") {
      errorMessage.value = "This user has been disabled.";
    } else if (error.code === "auth/user-not-found") {
      errorMessage.value = "No user found with this email.";
    } else if(error.code === "auth/invalid-credential") {
        errorMessage.value = "Incorrect credentials.";
    } else {
        errorMessage.value = "An error occurred during login : " + error.message;
    }
  } finally {
    isLoggingIn.value = false;
  }
};

const loginWithGoogle = async () => {
  isGoogleLoading.value = true;
  errorMessage.value = "";

  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);

    await checkUserExists(auth.currentUser.uid);
  } catch (error) {
    console.error("Google Login Error:", error.message);
    errorMessage.value = error.message;
  } finally {
    isGoogleLoading.value = false;
  }
};

const checkUserExists = async (googleUser) => {
  const userExists = await getDoc(doc(db, "users", googleUser));
  if(!userExists.exists()) {
    auth.signOut();
    if(confirm("User does not exist. Do you want to create a new account?")) {
        router.push("/signup");
    }
    else {
        router.push("/");
    }
  }
  else {
    router.push("/");
  }
};

</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background-color: invisible;
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
