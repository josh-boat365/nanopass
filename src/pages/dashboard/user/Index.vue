<script setup>
import BaseLayout from "@/layouts/AppLayout.vue";
import { ref } from "vue";
import {
  Eye,
  Trash2,
  Edit,
  Lock,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-vue-next";

const activeTab = ref("system");
const showPasswordModal = ref(false);
const showDeleteModal = ref(false);
const selectedPassword = ref(null);
const accountPassword = ref("");
const passwordError = ref("");
const revealedPassword = ref(null);

// Sample system passwords data
const systemPasswords = ref([
  {
    id: 1,
    systemName: "Main Production Server",
    password: "P@ssw0rd123!Secure",
    duration: 90,
    daysLeft: 15,
    privilege: "Admin",
    policy: "Strong",
    status: "warning",
  },
  {
    id: 2,
    systemName: "Database Primary",
    password: "DbS3cur3#2024",
    duration: 60,
    daysLeft: 45,
    privilege: "Editor",
    policy: "Strong",
    status: "healthy",
  },
  {
    id: 3,
    systemName: "Development Environment",
    password: "DevPass456",
    duration: 30,
    daysLeft: 3,
    privilege: "Viewer",
    policy: "Basic",
    status: "critical",
  },
  {
    id: 4,
    systemName: "Staging Server",
    password: "St@g1ng!Env2024",
    duration: 90,
    daysLeft: 60,
    privilege: "Editor",
    policy: "Enterprise",
    status: "healthy",
  },
]);

// Sample personal passwords data
const personalPasswords = ref([
  {
    id: 1,
    systemName: "GitHub Account",
    password: "MyGitH@b2024!",
    duration: 180,
    daysLeft: 120,
    privilege: "Owner",
    policy: "Strong",
    status: "healthy",
  },
  {
    id: 2,
    systemName: "AWS Console",
    password: "AwsC0ns0le#Secure",
    duration: 90,
    daysLeft: 25,
    privilege: "Admin",
    policy: "Enterprise",
    status: "warning",
  },
  {
    id: 3,
    systemName: "Email Account",
    password: "Em@il123Pass",
    duration: 365,
    daysLeft: 200,
    privilege: "Owner",
    policy: "Strong",
    status: "healthy",
  },
]);

const privilegeColors = {
  Admin: "bg-red-100 text-red-800",
  Editor: "bg-blue-100 text-blue-800",
  Viewer: "bg-gray-100 text-gray-800",
  Owner: "bg-purple-100 text-purple-800",
};

const policyColors = {
  Enterprise: "bg-green-100 text-green-800",
  Strong: "bg-blue-100 text-blue-800",
  Basic: "bg-yellow-100 text-yellow-800",
  Weak: "bg-red-100 text-red-800",
};

const statusColors = {
  critical: "text-red-600",
  warning: "text-yellow-600",
  healthy: "text-green-600",
};

const maskPassword = (password) => {
  return "•".repeat(12);
};

const getPrivilegeColor = (privilege) =>
  privilegeColors[privilege] || "bg-gray-100 text-gray-800";
const getPolicyColor = (policy) =>
  policyColors[policy] || "bg-gray-100 text-gray-800";

const handleViewPassword = (password) => {
  selectedPassword.value = password;
  showPasswordModal.value = true;
  accountPassword.value = "";
  passwordError.value = "";
  revealedPassword.value = null;
};

const handleDeletePassword = (password) => {
  selectedPassword.value = password;
  showDeleteModal.value = true;
};

const handleVerifyPassword = () => {
  // Simulate password verification (in real app, this would be an API call)
  if (accountPassword.value === "demo123") {
    passwordError.value = "";
    revealedPassword.value = selectedPassword.value;
  } else {
    passwordError.value = "Incorrect account password. Please try again.";
  }
};

const handleCloseModal = () => {
  showPasswordModal.value = false;
  showDeleteModal.value = false;
  selectedPassword.value = null;
  accountPassword.value = "";
  passwordError.value = "";
  revealedPassword.value = null;
};

const handleConfirmDelete = () => {
  if (activeTab.value === "personal") {
    personalPasswords.value = personalPasswords.value.filter(
      (p) => p.id !== selectedPassword.value.id
    );
  }
  handleCloseModal();
};
</script>

<template>
  <BaseLayout>
    <div class="p-4 sm:p-6">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
          User Dashboard
        </h1>
        <p class="mt-2 text-sm sm:text-base text-gray-600">
          Manage your system and personal passwords securely
        </p>
      </div>

      <!-- Tabs Navigation -->
      <div class="mb-8 border-b border-gray-200">
        <div class="flex gap-4 sm:gap-8">
          <button
            @click="activeTab = 'system'"
            :class="[
              'pb-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap',
              activeTab === 'system'
                ? 'border-black text-gray-900'
                : 'border-transparent text-gray-600 hover:text-gray-900',
            ]"
          >
            <Lock class="inline mr-1 sm:mr-2 h-4 w-4" />
            System Passwords
          </button>
          <button
            @click="activeTab = 'personal'"
            :class="[
              'pb-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap',
              activeTab === 'personal'
                ? 'border-black text-gray-900'
                : 'border-transparent text-gray-600 hover:text-gray-900',
            ]"
          >
            <Eye class="inline mr-1 sm:mr-2 h-4 w-4" />
            Personal Passwords
          </button>
        </div>
      </div>

      <!-- System Passwords Tab -->
      <div v-show="activeTab === 'system'" class="space-y-6">
        <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
          <div class="border-b bg-gray-50 px-4 sm:px-6 py-4">
            <h2 class="text-lg font-semibold text-gray-900">
              System Passwords
            </h2>
            <p class="text-sm text-gray-600 mt-1">
              View system passwords assigned to you
            </p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b bg-gray-50">
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    System Name
                  </th>
                  <th
                    class="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    Password
                  </th>
                  <th
                    class="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    Duration
                  </th>
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    Time Left
                  </th>
                  <th
                    class="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    Privilege
                  </th>
                  <th
                    class="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    Policy
                  </th>
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr
                  v-for="pwd in systemPasswords"
                  :key="pwd.id"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td
                    class="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900"
                  >
                    {{ pwd.systemName }}
                  </td>
                  <td class="hidden sm:table-cell px-4 sm:px-6 py-4">
                    <span class="text-sm font-mono text-gray-600">{{
                      maskPassword(pwd.password)
                    }}</span>
                  </td>
                  <td
                    class="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-gray-600"
                  >
                    {{ pwd.duration }}d
                  </td>
                  <td class="px-4 sm:px-6 py-4">
                    <div class="flex items-center gap-2">
                      <AlertCircle
                        v-if="pwd.status === 'critical'"
                        class="h-4 w-4"
                        :class="statusColors[pwd.status]"
                      />
                      <Clock
                        v-else-if="pwd.status === 'warning'"
                        class="h-4 w-4"
                        :class="statusColors[pwd.status]"
                      />
                      <CheckCircle
                        v-else
                        class="h-4 w-4"
                        :class="statusColors[pwd.status]"
                      />
                      <span
                        :class="[
                          'text-sm font-medium',
                          statusColors[pwd.status],
                        ]"
                      >
                        {{ pwd.daysLeft }}d
                      </span>
                    </div>
                  </td>
                  <td class="hidden lg:table-cell px-4 sm:px-6 py-4">
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        getPrivilegeColor(pwd.privilege),
                      ]"
                    >
                      {{ pwd.privilege }}
                    </span>
                  </td>
                  <td class="hidden lg:table-cell px-4 sm:px-6 py-4">
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        getPolicyColor(pwd.policy),
                      ]"
                    >
                      {{ pwd.policy }}
                    </span>
                  </td>
                  <td class="px-4 sm:px-6 py-4">
                    <button
                      @click="handleViewPassword(pwd)"
                      class="inline-flex items-center gap-1 px-3 py-2 text-xs sm:text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
                    >
                      <Eye class="h-4 w-4" />
                      <span class="hidden sm:inline">View</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Personal Passwords Tab -->
      <div v-show="activeTab === 'personal'" class="space-y-6">
        <div class="rounded-lg border bg-white shadow-sm overflow-hidden">
          <div class="border-b bg-gray-50 px-4 sm:px-6 py-4">
            <h2 class="text-lg font-semibold text-gray-900">
              Personal Passwords
            </h2>
            <p class="text-sm text-gray-600 mt-1">
              Manage your personal password entries
            </p>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b bg-gray-50">
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    System Name
                  </th>
                  <th
                    class="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    Password
                  </th>
                  <th
                    class="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    Duration
                  </th>
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    Time Left
                  </th>
                  <th
                    class="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    Privilege
                  </th>
                  <th
                    class="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    Policy
                  </th>
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr
                  v-for="pwd in personalPasswords"
                  :key="pwd.id"
                  class="hover:bg-gray-50 transition-colors"
                >
                  <td
                    class="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900"
                  >
                    {{ pwd.systemName }}
                  </td>
                  <td class="hidden sm:table-cell px-4 sm:px-6 py-4">
                    <span class="text-sm font-mono text-gray-600">{{
                      maskPassword(pwd.password)
                    }}</span>
                  </td>
                  <td
                    class="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-gray-600"
                  >
                    {{ pwd.duration }}d
                  </td>
                  <td class="px-4 sm:px-6 py-4">
                    <div class="flex items-center gap-2">
                      <AlertCircle
                        v-if="pwd.status === 'critical'"
                        class="h-4 w-4"
                        :class="statusColors[pwd.status]"
                      />
                      <Clock
                        v-else-if="pwd.status === 'warning'"
                        class="h-4 w-4"
                        :class="statusColors[pwd.status]"
                      />
                      <CheckCircle
                        v-else
                        class="h-4 w-4"
                        :class="statusColors[pwd.status]"
                      />
                      <span
                        :class="[
                          'text-sm font-medium',
                          statusColors[pwd.status],
                        ]"
                      >
                        {{ pwd.daysLeft }}d
                      </span>
                    </div>
                  </td>
                  <td class="hidden lg:table-cell px-4 sm:px-6 py-4">
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        getPrivilegeColor(pwd.privilege),
                      ]"
                    >
                      {{ pwd.privilege }}
                    </span>
                  </td>
                  <td class="hidden lg:table-cell px-4 sm:px-6 py-4">
                    <span
                      :class="[
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        getPolicyColor(pwd.policy),
                      ]"
                    >
                      {{ pwd.policy }}
                    </span>
                  </td>
                  <td class="px-4 sm:px-6 py-4">
                    <div class="flex items-center gap-1 sm:gap-2">
                      <button
                        @click="handleViewPassword(pwd)"
                        class="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
                      >
                        <Eye class="h-4 w-4" />
                        <span class="hidden sm:inline">View</span>
                      </button>
                      <button
                        @click="handleViewPassword(pwd)"
                        class="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <Edit class="h-4 w-4" />
                        <span class="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        @click="handleDeletePassword(pwd)"
                        class="inline-flex items-center gap-1 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 class="h-4 w-4" />
                        <span class="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- View Password Modal -->
    <div
      v-if="showPasswordModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
        <div class="border-b px-6 py-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">
            Verify Account Password
          </h2>
          <button
            @click="handleCloseModal"
            class="text-gray-500 hover:text-gray-700"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="px-6 py-4">
          <template v-if="!revealedPassword">
            <div class="mb-4">
              <p class="text-sm text-gray-600 mb-4">
                Please enter your account password to view the details for:
              </p>
              <div class="bg-gray-50 p-3 rounded-md border border-gray-200">
                <p class="text-sm font-medium text-gray-900">
                  {{ selectedPassword?.systemName }}
                </p>
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-900 mb-2">
                Account Password
              </label>
              <input
                type="password"
                v-model="accountPassword"
                @keypress.enter="handleVerifyPassword"
                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Enter your account password"
              />
              <p v-if="passwordError" class="mt-2 text-sm text-red-600">
                {{ passwordError }}
              </p>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p class="text-xs text-blue-800">
                Demo password:
                <span class="font-mono font-semibold">demo123</span>
              </p>
            </div>

            <div class="border-t pt-4 flex gap-3">
              <button
                @click="handleCloseModal"
                class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                @click="handleVerifyPassword"
                class="flex-1 px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
              >
                Verify
              </button>
            </div>
          </template>

          <template v-else>
            <div class="space-y-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >System Name</label
                >
                <p class="text-sm text-gray-900 font-medium">
                  {{ revealedPassword.systemName }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2"
                  >Password</label
                >
                <div
                  class="flex items-center gap-2 bg-gray-50 p-3 rounded-md border border-gray-200"
                >
                  <Lock class="h-4 w-4 text-gray-400" />
                  <code class="text-sm font-mono text-gray-900">{{
                    revealedPassword.password
                  }}</code>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Privilege</label
                  >
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getPrivilegeColor(revealedPassword.privilege),
                    ]"
                  >
                    {{ revealedPassword.privilege }}
                  </span>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2"
                    >Policy</label
                  >
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      getPolicyColor(revealedPassword.policy),
                    ]"
                  >
                    {{ revealedPassword.policy }}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Duration</label
                  >
                  <p class="text-sm text-gray-900">
                    {{ revealedPassword.duration }} days
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1"
                    >Time Left</label
                  >
                  <p
                    :class="[
                      'text-sm font-medium',
                      statusColors[revealedPassword.status],
                    ]"
                  >
                    {{ revealedPassword.daysLeft }} days
                  </p>
                </div>
              </div>
            </div>

            <div class="border-t pt-4">
              <button
                @click="handleCloseModal"
                class="w-full px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div class="relative w-full max-w-md rounded-lg bg-white shadow-xl">
        <div class="border-b px-6 py-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Confirm Deletion</h2>
          <button
            @click="handleCloseModal"
            class="text-gray-500 hover:text-gray-700"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="px-6 py-4">
          <p class="text-sm text-gray-600 mb-4">
            Are you sure you want to delete this password entry? This action
            cannot be undone.
          </p>
          <div class="bg-red-50 border border-red-200 p-3 rounded-md mb-6">
            <p class="text-sm font-medium text-gray-900">
              {{ selectedPassword?.systemName }}
            </p>
          </div>

          <div class="border-t pt-4 flex gap-3">
            <button
              @click="handleCloseModal"
              class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              @click="handleConfirmDelete"
              class="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </BaseLayout>
</template>
