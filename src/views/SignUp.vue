<template>
  <div
    class="container-fluid signup-container"
    :class="{ 'light-mode': !isDarkMode }"
  >
    <!-- Background Logo -->
    <div class="background-logo">DEV GATE</div>

    <div class="row justify-content-center">
      <div class="col-md-8 col-lg-6">
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
                <span>&lt;Join_The_Community /&gt;</span>
              </div>
            </div>

            <p class="text-center text-muted mb-5">
              Already have an account?
              <router-link
                to="/signin"
                class="text-decoration-none text-accent fw-semibold"
              >
                Sign in here
              </router-link>
            </p>

            <hr />
            <!-- Step-by-step carousel -->
            <div
              id="carouselSignup"
              class="carousel slide"
              data-bs-ride="carousel"
              data-bs-interval="false"
            >
              <div class="carousel-inner">
                <!-- Step 1: Personal Info -->
                <div
                  class="carousel-item"
                  :class="{ active: currentStep === 0 }"
                >
                  <form @submit.prevent="goToNextSlide">
                    <div class="step-header">
                      <div class="step-title">
                        <span class="code-comment">// Step 1:</span>
                        <h3 class="mb-3 fw-bold text-accent">Personal Info</h3>
                      </div>
                      <div class="step-indicator">1/3</div>
                    </div>

                    <div class="input-wrapper mb-3">
                      <label class="form-label">
                        <span class="code-keyword">const</span> fullName =
                      </label>
                      <input
                        type="text"
                        class="form-control custom-input"
                        v-model="form.name"
                        required
                        placeholder="Fname Lname"
                      />
                    </div>

                    <div class="input-wrapper mb-3">
                      <label class="form-label">
                        <span class="code-keyword">const</span> username =
                      </label>
                      <div class="input-group">
                        <span
                          class="input-group-text"
                          :class="{
                            'light-mode-input-group-text': !isDarkMode,
                          }"
                          >@</span
                        >
                        <input
                          type="text"
                          class="form-control custom-input"
                          v-model="form.username"
                          required
                          placeholder="user_name"
                        />
                      </div>
                    </div>

                    <div class="input-wrapper mb-4">
                      <label class="form-label">
                        <span class="code-keyword">const</span> dateOfBirth =
                      </label>
                      <input
                        type="date"
                        class="form-control custom-input"
                        v-model="form.dob"
                        required
                      />
                    </div>

                    <button
                      class="btn btn-accent w-100 py-2 button-glow"
                      type="submit"
                    >
                      Next <i class="bi bi-arrow-right ms-2"></i>
                    </button>
                  </form>
                </div>

                <!-- Step 2: Account Info -->
                <div
                  class="carousel-item"
                  :class="{ active: currentStep === 1 }"
                >
                  <button
                    type="button"
                    class="btn btn-outline-secondary d-flex align-items-center gap-2 mb-3"
                    @click="goToPreviousSlide"
                  >
                    <i class="bi bi-arrow-left"></i> Back
                  </button>

                  <div class="step-header">
                    <div class="step-title">
                      <span class="code-comment">// Step 2:</span>
                      <h3 class="mb-3 fw-bold text-accent">Account Info</h3>
                    </div>
                    <div class="step-indicator">2/3</div>
                  </div>

                  <form @submit.prevent="signUp">
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
                        <span class="code-keyword">const</span> confirmEmail =
                      </label>
                      <input
                        type="email"
                        class="form-control custom-input"
                        v-model="form.confirmEmail"
                        required
                        placeholder="confirm email@example.com"
                      />
                    </div>

                    <div class="input-wrapper mb-4">
                      <label class="form-label">
                        <span class="code-keyword">const</span> password =
                      </label>
                      <div class="input-group mb-3">
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
                      <div class="password-strength" v-if="form.password">
                        <div class="strength-meter">
                          <div
                            class="strength-bar"
                            :style="passwordStrengthStyle"
                          ></div>
                        </div>
                        <small class="text-muted">{{
                          passwordStrengthText
                        }}</small>
                      </div>
                    </div>

                    <button
                      class="btn btn-accent w-100 py-2 button-glow mb-3"
                      type="submit"
                    >
                      Sign Up <i class="bi bi-check2 ms-2"></i>
                    </button>
                  </form>

                  <div class="text-center">
                    <hr
                      class="my-4"
                      :class="{ 'light-mode-hr': !isDarkMode }"
                    />
                    <p class="text-muted mb-3 code-comment">
                      // Or continue with:
                    </p>
                    <button
                      class="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
                      @click="signUpWithGoogle"
                    >
                      <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        width="20"
                        height="20"
                      />
                      Sign up with Google
                    </button>
                  </div>
                </div>

                <!-- Step 3: Email Verification -->
                <div
                  class="carousel-item"
                  :class="{ active: currentStep === 2 }"
                >
                  <div class="step-header">
                    <div class="step-title">
                      <span class="code-comment">// Step 3:</span>
                      <h3 class="mb-3 fw-bold text-accent">Verification</h3>
                    </div>
                    <div class="step-indicator">3/3</div>
                  </div>

                  <div
                    class="alert alert-info verify-alert"
                    :class="{ 'light-mode-alert': !isDarkMode }"
                  >
                    <i class="bi bi-info-circle me-2"></i>
                    <div>
                      <p class="mb-1">
                        <span class="code-keyword">await</span>
                        emailVerification();
                      </p>
                      <small
                        >A verification email has been sent to
                        <strong>{{ form.email }}</strong></small
                      >
                    </div>
                  </div>

                  <button
                    class="btn btn-accent w-100 py-2 button-glow mb-3"
                    :disabled="isVerifying || resendCountdown > 0"
                    @click="resendVerificationEmail"
                  >
                    <span
                      v-if="isVerifying"
                      class="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    {{
                      resendCountdown > 0
                        ? `Resend email (${resendCountdown}s)`
                        : "Resend verification email"
                    }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Step indicators -->
            <div class="progress-container mt-4">
              <div
                class="progress-step"
                :class="{
                  active: currentStep >= 0,
                  completed: currentStep > 0,
                }"
              >
                <div class="step-indicator">1</div>
                <div class="step-label">Profile</div>
              </div>
              <div
                class="progress-line"
                :class="{ active: currentStep > 0 }"
              ></div>
              <div
                class="progress-step"
                :class="{
                  active: currentStep >= 1,
                  completed: currentStep > 1,
                }"
              >
                <div class="step-indicator">2</div>
                <div class="step-label">Account</div>
              </div>
              <div
                class="progress-line"
                :class="{ active: currentStep > 1 }"
              ></div>
              <div class="progress-step" :class="{ active: currentStep >= 2 }">
                <div class="step-indicator">3</div>
                <div class="step-label">Verify</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Carousel } from "bootstrap";
import { useRouter } from "vue-router";

// Firebase imports
import { auth, db } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
} from "firebase/auth";

import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";

// For storing temp user data
import {
  getDatabase,
  ref as dbRef,
  set as dbSet,
  get as dbGet,
  remove as dbRemove,
} from "firebase/database";

const router = useRouter();
const form = ref({
  name: "",
  username: "",
  email: "",
  confirmEmail: "",
  password: "",
  dob: "",
});

let carouselInstance = null;
const currentStep = ref(0);
const passwordVisible = ref(false);
const isVerifying = ref(false);
const resendCountdown = ref(0);
const tempUserData = ref(null);

// Theme state
const isDarkMode = ref(true);

// Store for temporarily storing user credential before verification
const rtdb = getDatabase();

// Password strength checker
const passwordStrength = computed(() => {
  const password = form.value.password;
  if (!password) return 0;

  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[a-z]/.test(password)) strength += 1;
  if (/\d/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;

  return strength;
});

const passwordStrengthStyle = computed(() => {
  const strength = passwordStrength.value;
  const widthPercent = (strength / 5) * 100;

  let color = "#dc3545"; // Red - weak
  if (strength >= 3) color = "#ffc107"; // Yellow - medium
  if (strength >= 4) color = "#28a745"; // Green - strong

  return {
    width: `${widthPercent}%`,
    backgroundColor: color,
  };
});

const passwordStrengthText = computed(() => {
  const strength = passwordStrength.value;
  if (strength < 2) return "Weak password";
  if (strength < 4) return "Moderate password";
  return "Strong password";
});

onMounted(() => {
  const el = document.getElementById("carouselSignup");
  carouselInstance = new Carousel(el, {
    interval: false,
    ride: false,
    wrap: false,
  });

  // Load theme preference from localStorage
  const savedTheme = localStorage.getItem("devgateTheme");
  if (savedTheme) {
    isDarkMode.value = savedTheme === "dark";
  } else {
    // Check system preference
    isDarkMode.value =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  // Listen for system theme changes
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", (e) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem("devgateTheme")) {
        isDarkMode.value = e.matches;
      }
    });
  }
});

const errorMessages = {
  "auth/email-already-in-use":
    "This email is already associated with an account.",
  "auth/weak-password": "Password is too weak. Please use a stronger password.",
  "auth/invalid-email": "The email address is invalid.",
};

const goToNextSlide = async () => {
  const { name, username, dob } = form.value;

  if (!name || !username || !dob) {
    alert("Please complete all fields before continuing.");
    return;
  }

  // Age check (min 14)
  const birthDate = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  const actualAge =
    age - (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? 1 : 0);

  if (actualAge < 14) {
    alert("You must be at least 14 years old to sign up.");
    return;
  }

  // Check username uniqueness
  const q = query(collection(db, "users"), where("username", "==", username));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    alert("This username is already taken. Please choose another one.");
    return;
  }

  // All validations passed, move to step 2
  currentStep.value = 1;
  carouselInstance.next();
};

const goToPreviousSlide = () => {
  carouselInstance.prev();
  currentStep.value -= 1;
};

const signUp = async () => {
  const { email, confirmEmail, password } = form.value;

  if (!email || !confirmEmail || !password) {
    alert("Please complete all fields.");
    return;
  }

  // Email match
  if (email !== confirmEmail) {
    alert("Emails don't match.");
    return;
  }

  // Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    alert("Invalid email format.");
    return;
  }

  // Password strength
  if (passwordStrength.value < 3) {
    alert(
      "Please use a stronger password with at least 8 characters, including uppercase, lowercase, numbers, and special characters."
    );
    return;
  }

  try {
    // Create user but don't save to Firestore yet
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Store temporary user data in Firebase Realtime Database with verification code
    await dbSet(dbRef(rtdb, `tempUsers/${user.uid}`), {
      name: form.value.name,
      username: form.value.username,
      email: form.value.email,
      dob: form.value.dob,
      createdAt: Date.now(),
      verified: false,
    });

    // Send the email verification
    await sendEmailVerification(user);

    // Move to verification step
    currentStep.value = 2;
    carouselInstance.next();

    // Start countdown for resend button
    startResendCountdown();

    // Store user credential for later use
    tempUserData.value = user;

    alert("A verification email has been sent. Please check your inbox.");

    // Listen for the user's email verification
    auth.onAuthStateChanged(async (user) => {
    console.log("here");
    if (user) {
        console.log("here 1");

        // Polling function to check email verification status
        const checkEmailVerification = async () => {
        await user.reload();  // Refresh the user's data
        if (user.emailVerified) {
            console.log("here 2");
            // Now that the user has verified their email, store the final data in Firestore
            const userRef = doc(db, "users", user.uid);

            // Add user data to Firestore after email verification
            await setDoc(userRef, {
            name: form.value.name,
            username: form.value.username,
            email: form.value.email,
            dob: form.value.dob,
            createdAt: serverTimestamp(),
            });

            // Remove temporary user data from Realtime Database
            await dbRemove(dbRef(rtdb, `tempUsers/${user.uid}`));

            // Notify user and redirect
            alert("Your account has been created successfully!");
            router.push("/");  // Redirect to home page
        } else {
            // If email is not verified, wait and check again (polling)
            console.log("Email not verified yet, waiting...");
            setTimeout(() => checkEmailVerification(), 2000);  // Retry after 2 seconds
        }
        };

        // Start the polling function
        checkEmailVerification();
    }
    });
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      const shouldLogin = confirm(
        "An account with this email already exists. Do you want to log in instead?"
      );
      if (shouldLogin) {
        router.push("/login");
      }
    } else {
      const errorMessage = errorMessages[err.code] || err.message;
      alert(errorMessage);
    }
  }
};

const startResendCountdown = () => {
  resendCountdown.value = 60;
  const timer = setInterval(() => {
    resendCountdown.value -= 1;
    if (resendCountdown.value <= 0) {
      clearInterval(timer);
    }
  }, 1000);
};

const signUpWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      // User already exists → offer to sign in
      if (
        !confirm(
          "This email is already associated with an account. Do you want to log in?"
        )
      ) {
        await auth.signOut();
      }
    } else {
      // For Google sign-up, assume email is already verified
      await setDoc(userRef, {
        name: form.value.name,
        username: form.value.username,
        email: user.email,
        dob: form.value.dob,
        createdAt: serverTimestamp(),
      });

      alert("Account verified successfully.");
      router.push("/");
    }
  } catch (err) {
    alert("Failed to sign up with Google: " + err.message);
  }
};
</script>

<style scoped>
.signup-container {
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

.code-function {
  font-family: "Fira Code", monospace;
  color: var(--code-function);
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

.password-strength {
  margin-top: 0.5rem;
}

.strength-meter {
  height: 4px;
  background-color: var(--strength-meter-bg);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.strength-bar {
  height: 100%;
  transition: all 0.3s ease;
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
    var(--button-glow-bg) 0%,
    var(--button-glow-fade) 70%
  );
  opacity: 0;
  z-index: -1;
  transition: opacity 0.6s ease;
}

.button-glow:hover::after {
  opacity: 1;
}

/* Step indicator styles */
.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.step-indicator {
  background-color: var(--step-indicator-bg);
  color: var(--text-secondary);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.8rem;
  transition: all 0.3s ease;
}

.progress-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.progress-step .step-indicator {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
  background-color: var(--step-indicator-bg);
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

.progress-step.active .step-indicator {
  background-color: var(--accent-color);
  color: white;
}

.progress-step.completed .step-indicator {
  background-color: var(--accent-secondary);
  color: white;
}

.progress-step .step-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.progress-step.active .step-label {
  color: var(--text-color);
  font-weight: 500;
}

.progress-line {
  flex-grow: 1;
  height: 2px;
  background-color: var(--progress-line-bg);
  margin: 0 0.5rem;
  position: relative;
  top: -15px;
  transition: background-color 0.3s ease;
}

.progress-line.active {
  background-color: var(--accent-secondary);
}

/* Verification code styles */
.verify-alert {
  display: flex;
  align-items: flex-start;
  background-color: var(--verify-alert-bg);
  border-left: 4px solid var(--verify-alert-border);
  font-family: "Fira Code", monospace;
  transition: all 0.3s ease;
}

.verification-code-container {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.verification-code-input {
  letter-spacing: 0.25rem;
  font-weight: 600;
  font-size: 1.2rem;
  text-align: center;
  max-width: 220px;
}

.action-links button {
  padding: 0;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.action-links button:hover {
  color: var(--accent-color) !important;
}
</style>
