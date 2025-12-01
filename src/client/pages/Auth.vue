<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-tabs">
          <button
            :class="['tab-button', { active: activeTab === 'login' }]"
            @click="activeTab = 'login'"
          >
            Login
          </button>
          <button
            :class="['tab-button', { active: activeTab === 'register' }]"
            @click="activeTab = 'register'"
          >
            Register
          </button>
        </div>

        <!-- Login Form -->
        <form
          v-if="activeTab === 'login'"
          class="auth-form"
          @submit.prevent="handleLogin"
        >
          <h2>Welcome Back</h2>
          <p class="subtitle">
            Sign in to your account
          </p>

          <div
            v-if="loginError"
            class="error-message"
            role="alert"
          >
            {{ loginError }}
          </div>

          <div class="form-group">
            <label for="login-email">Email</label>
            <input
              id="login-email"
              v-model="loginForm.email"
              type="email"
              placeholder="Enter your email"
              required
              autocomplete="email"
            >
          </div>

          <div class="form-group">
            <label for="login-password">Password</label>
            <input
              id="login-password"
              v-model="loginForm.password"
              type="password"
              placeholder="Enter your password"
              required
              autocomplete="current-password"
            >
          </div>

          <button
            type="submit"
            class="submit-button"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>

          <div class="auth-links">
            <button
              type="button"
              class="link-button"
              @click="showForgotPassword = true"
            >
              Forgot password?
            </button>
          </div>
        </form>

        <!-- Register Form -->
        <form
          v-else-if="activeTab === 'register'"
          class="auth-form"
          @submit.prevent="handleRegister"
        >
          <h2>Create Account</h2>
          <p class="subtitle">
            Join us today
          </p>

          <div
            v-if="registerError"
            class="error-message"
            role="alert"
          >
            {{ registerError }}
          </div>

          <div
            v-if="registerSuccess"
            class="success-message"
            role="status"
          >
            {{ registerSuccess }}
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="register-firstName">First Name</label>
              <input
                id="register-firstName"
                v-model="registerForm.firstName"
                type="text"
                placeholder="First name"
                required
                autocomplete="given-name"
              >
            </div>

            <div class="form-group">
              <label for="register-lastName">Last Name</label>
              <input
                id="register-lastName"
                v-model="registerForm.lastName"
                type="text"
                placeholder="Last name"
                required
                autocomplete="family-name"
              >
            </div>
          </div>

          <div class="form-group">
            <label for="register-email">Email</label>
            <input
              id="register-email"
              v-model="registerForm.email"
              type="email"
              placeholder="Enter your email"
              required
              autocomplete="email"
            >
          </div>

          <div class="form-group">
            <label for="register-password">Password</label>
            <input
              id="register-password"
              v-model="registerForm.password"
              type="password"
              placeholder="Create a password"
              required
              autocomplete="new-password"
            >
            <div
              v-if="passwordPolicy"
              class="password-requirements"
            >
              <p>Password must have:</p>
              <ul>
                <li :class="{ met: hasMinLength }">
                  At least {{ passwordPolicy.minLength }} characters
                </li>
                <li :class="{ met: hasUppercase }">
                  One uppercase letter
                </li>
                <li :class="{ met: hasLowercase }">
                  One lowercase letter
                </li>
                <li :class="{ met: hasDigit }">
                  One number
                </li>
                <li :class="{ met: hasSpecialChar }">
                  One special character
                </li>
              </ul>
            </div>
          </div>

          <div class="form-group">
            <label for="register-confirmPassword">Confirm Password</label>
            <input
              id="register-confirmPassword"
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="Confirm your password"
              required
              autocomplete="new-password"
            >
            <p
              v-if="registerForm.confirmPassword && !passwordsMatch"
              class="field-error"
            >
              Passwords do not match
            </p>
          </div>

          <div class="form-group">
            <label for="register-contactNumber">Contact Number (optional)</label>
            <input
              id="register-contactNumber"
              v-model="registerForm.contactNumber"
              type="tel"
              placeholder="Enter your phone number"
              autocomplete="tel"
            >
          </div>

          <button 
            type="submit" 
            class="submit-button" 
            :disabled="isLoading || !isRegisterFormValid"
          >
            {{ isLoading ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <!-- Forgot Password Modal -->
        <div
          v-if="showForgotPassword"
          class="modal-overlay"
          @click.self="showForgotPassword = false"
        >
          <div
            class="modal-content"
            role="dialog"
            aria-labelledby="forgot-password-title"
          >
            <button
              class="modal-close"
              aria-label="Close"
              @click="showForgotPassword = false"
            >
              &times;
            </button>
            <h3 id="forgot-password-title">
              Reset Password
            </h3>
            
            <div
              v-if="resetSuccess"
              class="success-message"
              role="status"
            >
              {{ resetSuccess }}
            </div>
            
            <div
              v-if="resetError"
              class="error-message"
              role="alert"
            >
              {{ resetError }}
            </div>

            <form
              v-if="!resetSuccess"
              @submit.prevent="handleForgotPassword"
            >
              <p>Enter your email address and we'll send you a link to reset your password.</p>
              
              <div class="form-group">
                <label for="reset-email">Email</label>
                <input
                  id="reset-email"
                  v-model="resetEmail"
                  type="email"
                  placeholder="Enter your email"
                  required
                >
              </div>

              <button
                type="submit"
                class="submit-button"
                :disabled="isLoading"
              >
                {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';

export default {
  name: 'AuthPage',
  setup() {
    const activeTab = ref('login');
    const isLoading = ref(false);
    const showForgotPassword = ref(false);
    const passwordPolicy = ref(null);

    // Login form
    const loginForm = ref({
      email: '',
      password: '',
    });
    const loginError = ref('');

    // Register form
    const registerForm = ref({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      contactNumber: '',
    });
    const registerError = ref('');
    const registerSuccess = ref('');

    // Password reset
    const resetEmail = ref('');
    const resetError = ref('');
    const resetSuccess = ref('');

    // Password validation computed properties
    const hasMinLength = computed(() => 
      registerForm.value.password.length >= (passwordPolicy.value?.minLength || 8)
    );
    const hasUppercase = computed(() => /[A-Z]/.test(registerForm.value.password));
    const hasLowercase = computed(() => /[a-z]/.test(registerForm.value.password));
    const hasDigit = computed(() => /\d/.test(registerForm.value.password));
    const hasSpecialChar = computed(() => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(registerForm.value.password));
    
    const passwordsMatch = computed(() => 
      registerForm.value.password === registerForm.value.confirmPassword
    );

    const isPasswordValid = computed(() => 
      hasMinLength.value && hasUppercase.value && hasLowercase.value && 
      hasDigit.value && hasSpecialChar.value
    );

    const isRegisterFormValid = computed(() => 
      registerForm.value.email &&
      registerForm.value.firstName &&
      registerForm.value.lastName &&
      isPasswordValid.value &&
      passwordsMatch.value
    );

    // Fetch password policy on mount
    onMounted(async () => {
      try {
        const response = await fetch('/api/auth/password-policy');
        const data = await response.json();
        passwordPolicy.value = data.policy;
      } catch {
        // Use default policy if fetch fails
        passwordPolicy.value = {
          minLength: 8,
          maxLength: 128,
          requireUppercase: true,
          requireLowercase: true,
          requireDigit: true,
          requireSpecialChar: true,
        };
      }
    });

    const handleLogin = async () => {
      loginError.value = '';
      isLoading.value = true;

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: loginForm.value.email,
            password: loginForm.value.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          loginError.value = data.error?.message || 'Login failed. Please try again.';
          return;
        }

        // Store tokens (in production, use secure storage)
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect to home or dashboard
        window.location.href = '/';
      } catch {
        loginError.value = 'An error occurred. Please try again.';
      } finally {
        isLoading.value = false;
      }
    };

    const handleRegister = async () => {
      registerError.value = '';
      registerSuccess.value = '';
      isLoading.value = true;

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: registerForm.value.email,
            password: registerForm.value.password,
            firstName: registerForm.value.firstName,
            lastName: registerForm.value.lastName,
            contactNumber: registerForm.value.contactNumber || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (data.error?.details?.errors) {
            registerError.value = data.error.details.errors.join('. ');
          } else {
            registerError.value = data.error?.message || 'Registration failed. Please try again.';
          }
          return;
        }

        registerSuccess.value = data.message || 'Registration successful! Please check your email to verify your account.';
        
        // Clear form
        registerForm.value = {
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          contactNumber: '',
        };
      } catch {
        registerError.value = 'An error occurred. Please try again.';
      } finally {
        isLoading.value = false;
      }
    };

    const handleForgotPassword = async () => {
      resetError.value = '';
      resetSuccess.value = '';
      isLoading.value = true;

      try {
        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: resetEmail.value }),
        });

        const data = await response.json();

        if (!response.ok) {
          resetError.value = data.error?.message || 'Request failed. Please try again.';
          return;
        }

        resetSuccess.value = data.message || 'If an account exists with this email, a password reset link has been sent.';
        resetEmail.value = '';
      } catch {
        resetError.value = 'An error occurred. Please try again.';
      } finally {
        isLoading.value = false;
      }
    };

    return {
      activeTab,
      isLoading,
      showForgotPassword,
      passwordPolicy,
      loginForm,
      loginError,
      registerForm,
      registerError,
      registerSuccess,
      resetEmail,
      resetError,
      resetSuccess,
      hasMinLength,
      hasUppercase,
      hasLowercase,
      hasDigit,
      hasSpecialChar,
      passwordsMatch,
      isRegisterFormValid,
      handleLogin,
      handleRegister,
      handleForgotPassword,
    };
  },
};
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-container {
  width: 100%;
  max-width: 480px;
}

.auth-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.auth-tabs {
  display: flex;
  border-bottom: 1px solid #e0e0e0;
}

.tab-button {
  flex: 1;
  padding: 16px;
  border: none;
  background: none;
  font-size: 16px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button:hover {
  color: #333;
  background: #f5f5f5;
}

.tab-button.active {
  color: #667eea;
  border-bottom: 3px solid #667eea;
  margin-bottom: -1px;
}

.auth-form {
  padding: 32px;
}

.auth-form h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.subtitle {
  margin: 0 0 24px 0;
  color: #666;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
}

input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.password-requirements {
  margin-top: 8px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 13px;
}

.password-requirements p {
  margin: 0 0 8px 0;
  font-weight: 500;
  color: #666;
}

.password-requirements ul {
  margin: 0;
  padding-left: 20px;
}

.password-requirements li {
  color: #999;
  margin-bottom: 4px;
}

.password-requirements li.met {
  color: #28a745;
}

.password-requirements li.met::marker {
  color: #28a745;
}

.field-error {
  margin: 4px 0 0 0;
  color: #dc3545;
  font-size: 13px;
}

.error-message {
  padding: 12px 16px;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 8px;
  color: #c53030;
  margin-bottom: 20px;
}

.success-message {
  padding: 12px 16px;
  background: #f0fff4;
  border: 1px solid #c6f6d5;
  border-radius: 8px;
  color: #276749;
  margin-bottom: 20px;
}

.submit-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-links {
  margin-top: 16px;
  text-align: center;
}

.link-button {
  background: none;
  border: none;
  color: #667eea;
  font-size: 14px;
  cursor: pointer;
  text-decoration: underline;
}

.link-button:hover {
  color: #764ba2;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 32px;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  position: relative;
  margin: 20px;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
}

.modal-close:hover {
  color: #333;
}

.modal-content h3 {
  margin: 0 0 16px 0;
  font-size: 20px;
  color: #333;
}

.modal-content p {
  margin: 0 0 20px 0;
  color: #666;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .auth-form {
    padding: 24px;
  }
}
</style>
