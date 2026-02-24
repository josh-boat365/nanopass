<script setup>
import { ref, onMounted } from "vue";
import BaseLayout from "@/layouts/AppLayout.vue";
import {
  Save,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-vue-next";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/apiConfig";
import { useToast } from "@/composables/useToast";
import { useUserStore } from "@/stores/useUserStore";
import { useDepartmentStore } from "@/stores/useDepartmentStore";
import { storeToRefs } from "pinia";

const userStore = useUserStore();
const departmentStore = useDepartmentStore();
const { departments } = storeToRefs(departmentStore);
const { success, error: showError } = useToast();

// Tabs
const activeTab = ref("profile");

// Profile Data
const userProfile = ref({
  firstName: "",
  surname: "",
  username: "",
  email: "",
  department: "",
  privilege: "",
});

// Profile Form
const profileFormData = ref({
  firstName: "",
  surname: "",
  username: "",
  email: "",
  department: "",
});

const profileLoading = ref(false);
const profileSaved = ref(false);
const profileError = ref("");

// Password Reset Form
const passwordResetForm = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const passwordLoading = ref(false);
const passwordReset = ref(false);
const passwordError = ref("");

// ========================================
// LIFECYCLE
// ========================================

onMounted(async () => {
  await loadDepartments();
  await loadUserProfile();
});

// Load all departments
const loadDepartments = async () => {
  try {
    await departmentStore.getAllDepartments();
  } catch (err) {
    console.error("Error loading departments:", err);
  }
};

// Get department name by ID
const getDepartmentName = (departmentId) => {
  if (!departmentId) return "";
  const dept = departments.value.find((d) => d.id === departmentId);
  return dept ? dept.name : "";
};

// ========================================
// PROFILE FUNCTIONS
// ========================================

const loadUserProfile = async () => {
  profileLoading.value = true;
  profileError.value = "";
  try {
    if (userStore.user) {
      const departmentName = getDepartmentName(userStore.user.department_id);
      userProfile.value = {
        firstName: userStore.user.firstName || "",
        surname: userStore.user.surname || "",
        username: userStore.user.username || "",
        email: userStore.user.email || "",
        department: departmentName || userStore.user.department || "",
        privilege: userStore.user.admin ? "Admin" : "User",
      };

      profileFormData.value = {
        firstName: userProfile.value.firstName,
        surname: userProfile.value.surname,
        username: userProfile.value.username,
        email: userProfile.value.email,
        department: userProfile.value.department,
      };
    }
  } catch (err) {
    console.error("Error loading profile:", err);
    profileError.value = "Failed to load profile";
  } finally {
    profileLoading.value = false;
  }
};

// Fetch user data from backend API to get fresh data
const fetchUserFromAPI = async () => {
  try {
    if (!userStore.user || !userStore.user.id) {
      console.warn("User ID not available");
      return false;
    }

    const endpoint =
      API_ENDPOINTS.USERS?.SHOW(userStore.user.id) ||
      `/users/${userStore.user.id}`;
    console.log("Fetching user from API at:", endpoint);

    const response = await apiClient.get(endpoint);
    console.log("User data from API:", response.data);

    const userData = response.data.data || response.data;

    // Update store with fresh data
    if (userStore.user) {
      userStore.user.firstName = userData.firstName || userStore.user.firstName;
      userStore.user.surname = userData.surname || userStore.user.surname;
      userStore.user.username = userData.username || userStore.user.username;
      userStore.user.email = userData.email || userStore.user.email;
      userStore.user.department_id =
        userData.department_id || userStore.user.department_id;
      userStore.user.full_name = userData.full_name || userStore.user.full_name;
    }

    // Get department name from department_id
    const departmentName = getDepartmentName(
      userData.department_id || userStore.user.department_id,
    );

    // Update local profile data
    userProfile.value = {
      ...userProfile.value,
      username: userData.username || userProfile.value.username,
      email: userData.email || userProfile.value.email,
      department: departmentName || userProfile.value.department,
    };

    // Update form data
    profileFormData.value = {
      username: userData.username || profileFormData.value.username,
      email: userData.email || profileFormData.value.email,
      department: departmentName || profileFormData.value.department,
    };

    return true;
  } catch (err) {
    console.error("Error fetching user from API:", err);
    return false;
  }
};

const saveProfile = async () => {
  profileLoading.value = true;
  profileError.value = "";
  profileSaved.value = false;

  try {
    if (
      !profileFormData.value.firstName.trim() ||
      !profileFormData.value.surname.trim() ||
      !profileFormData.value.username.trim() ||
      !profileFormData.value.email.trim()
    ) {
      profileError.value =
        "First name, last name, username and email are required";
      profileLoading.value = false;
      return;
    }

    if (!userStore.user || !userStore.user.id) {
      profileError.value = "User ID not available";
      profileLoading.value = false;
      return;
    }

    const endpoint =
      API_ENDPOINTS.USERS?.UPDATE(userStore.user.id) ||
      `/users/${userStore.user.id}`;
    console.log("Updating profile at:", endpoint);

    const response = await apiClient.put(endpoint, {
      firstName: profileFormData.value.firstName,
      surname: profileFormData.value.surname,
      username: profileFormData.value.username,
      email: profileFormData.value.email,
      department: profileFormData.value.department,
    });

    console.log("Profile update response:", response);

    // Reload user data from API to verify changes were persisted
    const fetchSuccess = await fetchUserFromAPI();
    if (!fetchSuccess) {
      profileError.value =
        "Profile updated but verification failed. Please refresh the page.";
      showError(profileError.value);
      profileLoading.value = false;
      return;
    }

    profileSaved.value = true;
    success("Profile updated successfully!");

    setTimeout(() => {
      profileSaved.value = false;
    }, 3000);
  } catch (err) {
    console.error("Error saving profile:", err);
    profileError.value =
      err.response?.data?.message || err.message || "Failed to update profile";
    showError(profileError.value);
  } finally {
    profileLoading.value = false;
  }
};

// ========================================
// PASSWORD RESET FUNCTIONS
// ========================================

const validatePasswordForm = () => {
  passwordError.value = "";

  if (!passwordResetForm.value.currentPassword.trim()) {
    passwordError.value = "Current password is required";
    return false;
  }

  if (!passwordResetForm.value.newPassword.trim()) {
    passwordError.value = "New password is required";
    return false;
  }

  if (passwordResetForm.value.newPassword.length < 8) {
    passwordError.value = "New password must be at least 8 characters";
    return false;
  }

  if (
    passwordResetForm.value.newPassword !==
    passwordResetForm.value.confirmPassword
  ) {
    passwordError.value = "Passwords do not match";
    return false;
  }

  if (
    passwordResetForm.value.currentPassword ===
    passwordResetForm.value.newPassword
  ) {
    passwordError.value =
      "New password must be different from current password";
    return false;
  }

  return true;
};

const resetPassword = async () => {
  if (!validatePasswordForm()) {
    return;
  }

  passwordLoading.value = true;
  passwordError.value = "";

  try {
    if (!userStore.user || !userStore.user.id) {
      passwordError.value = "User ID not available";
      passwordLoading.value = false;
      return;
    }

    const endpoint =
      API_ENDPOINTS.USERS?.UPDATE(userStore.user.id) ||
      `/users/${userStore.user.id}`;
    console.log("Updating password at:", endpoint);

    const response = await apiClient.put(endpoint, {
      password: passwordResetForm.value.newPassword,
      password_confirmation: passwordResetForm.value.confirmPassword,
    });

    console.log("Password update response:", response);

    passwordResetForm.value = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };

    passwordReset.value = true;
    success("Password changed successfully!");

    setTimeout(() => {
      passwordReset.value = false;
    }, 3000);
  } catch (err) {
    console.error("Error resetting password:", err);
    passwordError.value =
      err.response?.data?.message || err.message || "Failed to change password";
    showError(passwordError.value);
  } finally {
    passwordLoading.value = false;
  }
};

const resetPasswordForm = () => {
  passwordResetForm.value = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
  showCurrentPassword.value = false;
  showNewPassword.value = false;
  showConfirmPassword.value = false;
  passwordError.value = "";
};
</script>

<template>
  <BaseLayout>
    <div class="p-6">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Settings</h1>
        <p class="mt-2 text-gray-600">
          Manage your profile and security settings
        </p>
      </div>

      <!-- Tabs Navigation -->
      <div class="mb-8 border-b border-gray-200">
        <div class="flex gap-8">
          <button
            @click="activeTab = 'profile'"
            :class="[
              'pb-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'profile'
                ? 'border-black text-gray-900'
                : 'border-transparent text-gray-600 hover:text-gray-900',
            ]"
          >
            <User class="inline mr-2 h-4 w-4" />
            Profile
          </button>
          <button
            @click="activeTab = 'password'"
            :class="[
              'pb-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'password'
                ? 'border-black text-gray-900'
                : 'border-transparent text-gray-600 hover:text-gray-900',
            ]"
          >
            <Lock class="inline mr-2 h-4 w-4" />
            Password Reset
          </button>
        </div>
      </div>

      <!-- Profile Tab -->
      <div v-show="activeTab === 'profile'" class="space-y-6">
        <!-- Profile Overview Card -->
        <div class="rounded-lg border bg-white p-6 shadow-sm">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">
            Profile Information
          </h2>

          <!-- Full Name Display -->
          <div class="mb-6 p-4 bg-blue-50 rounded-md border border-blue-200">
            <p class="text-sm text-blue-600 mb-2">Full Name</p>
            <p class="text-lg font-semibold text-gray-900">
              {{ profileFormData.firstName }} {{ profileFormData.surname }}
            </p>
          </div>

          <div
            v-if="profileError"
            class="mb-6 rounded-lg bg-red-50 border border-red-200 p-4"
          >
            <div class="flex items-start gap-3">
              <AlertCircle class="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <p class="text-sm text-red-800">{{ profileError }}</p>
            </div>
          </div>

          <div class="grid gap-6 md:grid-cols-2">
            <!-- Editable Fields -->
            <div>
              <label
                for="firstName"
                class="block text-sm font-medium text-gray-900 mb-2"
              >
                First Name
              </label>
              <input
                id="firstName"
                v-model="profileFormData.firstName"
                type="text"
                :disabled="profileLoading"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                for="surname"
                class="block text-sm font-medium text-gray-900 mb-2"
              >
                Last Name
              </label>
              <input
                id="surname"
                v-model="profileFormData.surname"
                type="text"
                :disabled="profileLoading"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                for="username"
                class="block text-sm font-medium text-gray-900 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                v-model="profileFormData.username"
                type="text"
                :disabled="profileLoading"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                for="email"
                class="block text-sm font-medium text-gray-900 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                v-model="profileFormData.email"
                type="email"
                :disabled="profileLoading"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <div class="md:col-span-2">
              <label
                for="department"
                class="block text-sm font-medium text-gray-900 mb-2"
              >
                Department
              </label>
              <input
                id="department"
                v-model="profileFormData.department"
                type="text"
                :disabled="profileLoading"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            <!-- Display Fields -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Current Privilege
              </label>
              <div
                class="px-4 py-2 bg-gray-50 rounded-md border border-gray-200"
              >
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="
                    userProfile.privilege === 'Admin'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  "
                >
                  {{ userProfile.privilege }}
                </span>
              </div>
            </div>
          </div>

          <!-- Save Button -->
          <div class="mt-6 flex items-center gap-4">
            <button
              @click="saveProfile"
              :disabled="profileLoading"
              class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader2 v-if="profileLoading" class="h-4 w-4 animate-spin" />
              <Save v-else class="h-4 w-4" />
              {{ profileLoading ? "Saving..." : "Save Changes" }}
            </button>
            <div
              v-if="profileSaved"
              class="flex items-center gap-2 text-green-600 text-sm"
            >
              <CheckCircle class="h-4 w-4" />
              Profile updated successfully
            </div>
          </div>
        </div>
      </div>

      <!-- Password Reset Tab -->
      <div v-show="activeTab === 'password'" class="space-y-6">
        <!-- Password Reset Card -->
        <div class="rounded-lg border bg-white p-6 shadow-sm">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">
            Change Password
          </h2>

          <div
            v-if="passwordError"
            class="mb-6 rounded-lg bg-red-50 border border-red-200 p-4"
          >
            <div class="flex items-start gap-3">
              <AlertCircle class="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <p class="text-sm text-red-800">{{ passwordError }}</p>
            </div>
          </div>

          <div class="space-y-4 max-w-md">
            <!-- Current Password -->
            <div>
              <label
                for="current-password"
                class="block text-sm font-medium text-gray-900 mb-2"
              >
                Current Password
              </label>
              <div class="relative">
                <input
                  id="current-password"
                  v-model="passwordResetForm.currentPassword"
                  :type="showCurrentPassword ? 'text' : 'password'"
                  :disabled="passwordLoading"
                  class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter your current password"
                />
                <button
                  @click="showCurrentPassword = !showCurrentPassword"
                  type="button"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  :disabled="passwordLoading"
                >
                  <Eye v-if="!showCurrentPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </button>
              </div>
            </div>

            <!-- New Password -->
            <div>
              <label
                for="new-password"
                class="block text-sm font-medium text-gray-900 mb-2"
              >
                New Password
              </label>
              <div class="relative">
                <input
                  id="new-password"
                  v-model="passwordResetForm.newPassword"
                  :type="showNewPassword ? 'text' : 'password'"
                  :disabled="passwordLoading"
                  class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter your new password"
                />
                <button
                  @click="showNewPassword = !showNewPassword"
                  type="button"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  :disabled="passwordLoading"
                >
                  <Eye v-if="!showNewPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </button>
              </div>
              <p class="mt-1 text-xs text-gray-600">At least 8 characters</p>
            </div>

            <!-- Confirm Password -->
            <div>
              <label
                for="confirm-password"
                class="block text-sm font-medium text-gray-900 mb-2"
              >
                Confirm Password
              </label>
              <div class="relative">
                <input
                  id="confirm-password"
                  v-model="passwordResetForm.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  :disabled="passwordLoading"
                  class="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Confirm your new password"
                />
                <button
                  @click="showConfirmPassword = !showConfirmPassword"
                  type="button"
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  :disabled="passwordLoading"
                >
                  <Eye v-if="!showConfirmPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mt-6 flex items-center gap-4">
            <button
              @click="resetPassword"
              :disabled="passwordLoading"
              class="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Loader2 v-if="passwordLoading" class="h-4 w-4 animate-spin" />
              <Lock v-else class="h-4 w-4" />
              {{ passwordLoading ? "Changing..." : "Change Password" }}
            </button>
            <button
              @click="resetPasswordForm"
              :disabled="passwordLoading"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
            <div
              v-if="passwordReset"
              class="flex items-center gap-2 text-green-600 text-sm"
            >
              <CheckCircle class="h-4 w-4" />
              Password changed successfully
            </div>
          </div>
        </div>

        <!-- Security Recommendation -->
        <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div class="flex items-start gap-3">
            <AlertCircle class="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <h3 class="font-semibold text-blue-900">Security Tips</h3>
              <ul class="text-sm text-blue-800 mt-2 space-y-1 ml-5 list-disc">
                <li>
                  Use a strong password with uppercase, lowercase, numbers, and
                  symbols
                </li>
                <li>Never share your password with anyone</li>
                <li>Change your password regularly for maximum security</li>
                <li>Your password must be at least 8 characters long</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>
