<template>
  <BaseLayout title="Admin Dashboard">
    <div class="dashboard-container">
      <!-- Header Section -->
      <div class="header-section">
        <h1 class="page-title">
          <span class="icon">📊</span>
          Admin Dashboard
        </h1>
        <p class="page-subtitle">
          Manage permissions, users, and system security
        </p>
      </div>

      <!-- Quick Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon users">👥</div>
          <div class="stat-content">
            <div class="stat-label">Total Users</div>
            <div class="stat-value">{{ stats.totalUsers }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon systems">🔐</div>
          <div class="stat-content">
            <div class="stat-label">Total Systems</div>
            <div class="stat-value">{{ stats.totalSystems }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon permissions">🔑</div>
          <div class="stat-content">
            <div class="stat-label">Active Permissions</div>
            <div class="stat-value">{{ stats.activePermissions }}</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon revoked">⛔</div>
          <div class="stat-content">
            <div class="stat-label">Total Revoked</div>
            <div class="stat-value">{{ stats.totalRevoked }}</div>
          </div>
        </div>
      </div>

      <!-- Permissions Metrics Widget -->
      <div class="metrics-section">
        <PermissionMetricsWidget />
      </div>

      <!-- Quick Actions Section -->
      <div class="quick-actions-section">
        <h2 class="section-title">Quick Actions</h2>
        <div class="actions-grid">
          <button @click="goToUsers" class="action-button users-action">
            <span class="action-icon">👤</span>
            <span class="action-text">Manage Users</span>
            <span class="action-arrow">→</span>
          </button>

          <button @click="goToSystems" class="action-button systems-action">
            <span class="action-icon">🔐</span>
            <span class="action-text">Manage Systems</span>
            <span class="action-arrow">→</span>
          </button>

          <button
            @click="goToRevocationHistory"
            class="action-button history-action"
          >
            <span class="action-icon">📋</span>
            <span class="action-text">Revocation Audit</span>
            <span class="action-arrow">→</span>
          </button>

          <button
            @click="goToDepartments"
            class="action-button departments-action"
          >
            <span class="action-icon">🏢</span>
            <span class="action-text">Departments</span>
            <span class="action-arrow">→</span>
          </button>

          <button @click="goToSettings" class="action-button settings-action">
            <span class="action-icon">⚙️</span>
            <span class="action-text">Settings</span>
            <span class="action-arrow">→</span>
          </button>

          <button
            @click="goToPrivileges"
            class="action-button privileges-action"
          >
            <span class="action-icon">🎯</span>
            <span class="action-text">Privileges</span>
            <span class="action-arrow">→</span>
          </button>
        </div>
      </div>

      <!-- System Health Section -->
      <div class="health-section">
        <h2 class="section-title">System Health</h2>
        <div class="health-grid">
          <div class="health-card">
            <div class="health-label">API Status</div>
            <div :class="['health-indicator', apiStatus]">
              {{ apiStatus === "healthy" ? "✅" : "⚠️" }}
            </div>
            <div class="health-text">{{ apiStatusText }}</div>
          </div>

          <div class="health-card">
            <div class="health-label">Data Sync</div>
            <div :class="['health-indicator', dataSyncStatus]">
              {{ dataSyncStatus === "healthy" ? "✅" : "⚠️" }}
            </div>
            <div class="health-text">{{ dataSyncStatusText }}</div>
          </div>

          <div class="health-card">
            <div class="health-label">Last Updated</div>
            <div class="health-value">{{ lastUpdated }}</div>
            <button @click="refreshDashboard" class="refresh-button">
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Upcoming Expirations Section -->
      <div class="upcoming-section">
        <div class="section-header">
          <h2 class="section-title">⏰ Upcoming Expirations (Next 30 Days)</h2>
          <button
            v-if="selectedPermissionsForRevoke.length > 0"
            @click="openBulkRevokeModal"
            class="bulk-revoke-button"
          >
            🔴 Revoke {{ selectedPermissionsForRevoke.length }} Permission{{
              selectedPermissionsForRevoke.length !== 1 ? "s" : ""
            }}
          </button>
        </div>
        <div v-if="loadingExpirations" class="loading">
          <span class="spinner"></span> Loading expirations...
        </div>
        <div
          v-else-if="upcomingExpirations.length > 0"
          class="expirations-list"
        >
          <div
            v-for="expiration in upcomingExpirations"
            :key="expiration.id"
            class="expiration-item"
            :class="{
              selected: selectedPermissionsForRevoke.some(
                (p) => p.id === expiration.id,
              ),
            }"
          >
            <div class="expiration-checkbox">
              <input
                type="checkbox"
                :checked="
                  selectedPermissionsForRevoke.some(
                    (p) => p.id === expiration.id,
                  )
                "
                @change="togglePermissionSelection(expiration)"
              />
            </div>
            <div class="expiration-content">
              <div class="expiration-header">
                <span class="system-name">{{
                  expiration.system.system_name
                }}</span>
                <span
                  :class="[
                    'days-badge',
                    getDaysBadgeClass(expiration.days_left),
                  ]"
                >
                  {{ expiration.days_left }} days
                </span>
              </div>
              <div class="expiration-user">{{ expiration.user.email }}</div>
              <div class="expiration-date">
                Expires: {{ formatDate(expiration.date_time_expiry) }}
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          ✅ No expirations coming up in the next 30 days
        </div>
      </div>

      <!-- Bulk Revoke Modal -->
      <BulkRevokeModal
        :is-open="bulkRevokeModalOpen"
        :selected-permissions="selectedPermissionsForRevoke"
        @close="closeBulkRevokeModal"
        @revoke-success="handleRevocationSuccess"
      />
    </div>
  </BaseLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/useUserStore";
import BaseLayout from "@/layouts/AppLayout.vue";
import PermissionMetricsWidget from "@/components/PermissionMetricsWidget.vue";
import BulkRevokeModal from "@/components/BulkRevokeModal.vue";
import { usePermissionExpiry } from "@/composables/usePermissionExpiry";
import { useToast } from "@/composables/useToast";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/apiConfig";

const router = useRouter();
const userStore = useUserStore();
const { fetchExpiringPermissions } = usePermissionExpiry();
const { success } = useToast();

// Stats
const stats = reactive({
  totalUsers: 0,
  totalSystems: 0,
  activePermissions: 0,
  totalRevoked: 0,
});

// Health status
const apiStatus = ref("healthy");
const apiStatusText = ref("Connected and responding");
const dataSyncStatus = ref("healthy");
const dataSyncStatusText = ref("All data synchronized");
const lastUpdated = ref("Just now");

// Upcoming expirations
const upcomingExpirations = ref([]);
const loadingExpirations = ref(false);
const bulkRevokeModalOpen = ref(false);
const selectedPermissionsForRevoke = ref([]);

// Toggle permission selection for bulk revoke
const togglePermissionSelection = (expiration) => {
  const index = selectedPermissionsForRevoke.value.findIndex(
    (p) => p.id === expiration.id,
  );
  if (index > -1) {
    selectedPermissionsForRevoke.value.splice(index, 1);
  } else {
    selectedPermissionsForRevoke.value.push({
      id: expiration.id,
      system_name: expiration.system.system_name,
      user_email: expiration.user.email,
      expiry_date: expiration.date_time_expiry,
    });
  }
};

// Open bulk revoke modal
const openBulkRevokeModal = () => {
  if (selectedPermissionsForRevoke.value.length > 0) {
    bulkRevokeModalOpen.value = true;
  }
};

// Close bulk revoke modal
const closeBulkRevokeModal = () => {
  bulkRevokeModalOpen.value = false;
};

// Handle successful revocation
const handleRevocationSuccess = () => {
  selectedPermissionsForRevoke.value = [];
  bulkRevokeModalOpen.value = false;
  // Reload expirations
  loadUpcomingExpirations();
  success("✅ Permissions revoked successfully");
};

// Load dashboard data
const loadDashboardData = async () => {
  try {
    // Load stats
    await Promise.all([loadStats(), loadUpcomingExpirations()]);

    updateLastUpdated();
    console.log("✅ Dashboard data loaded successfully");
  } catch (err) {
    console.error("❌ Error loading dashboard data:", err);
    apiStatus.value = "warning";
    apiStatusText.value = "Some data failed to load";
  }
};

const loadStats = async () => {
  try {
    // Get users count
    const usersRes = await apiClient.get(API_ENDPOINTS.USERS?.LIST || "/users");
    stats.totalUsers = usersRes.data.data?.length || 0;

    // Get systems count
    const systemsRes = await apiClient.get(
      API_ENDPOINTS.SYSTEMS?.LIST || "/systems",
    );
    stats.totalSystems = systemsRes.data.data?.length || 0;

    // Get permissions count
    const permsRes = await apiClient.get(
      API_ENDPOINTS.PERMISSIONS?.LIST || "/permissions",
    );
    const allPermissions = permsRes.data.data || [];
    stats.activePermissions = allPermissions.filter((p) => {
      const now = new Date();
      const expiry = new Date(p.date_time_expiry);
      return expiry > now;
    }).length;

    // Count revoked (from revocation history)
    try {
      const historyRes = await apiClient.get(
        API_ENDPOINTS.PERMISSIONS?.REVOCATION_HISTORY ||
          "/permissions/revocation-history",
      );
      stats.totalRevoked = historyRes.data.pagination?.total || 0;
    } catch (e) {
      console.warn("Could not load revocation count");
      stats.totalRevoked = 0;
    }
  } catch (err) {
    console.error("Error loading stats:", err);
  }
};

const loadUpcomingExpirations = async () => {
  loadingExpirations.value = true;
  try {
    const response = await fetchExpiringPermissions(30);
    upcomingExpirations.value = (response.permissions || [])
      .sort((a, b) => a.days_left - b.days_left)
      .slice(0, 5); // Show top 5
  } catch (err) {
    console.error("Error loading upcoming expirations:", err);
    upcomingExpirations.value = [];
  } finally {
    loadingExpirations.value = false;
  }
};

const updateLastUpdated = () => {
  const now = new Date();
  lastUpdated.value = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const refreshDashboard = async () => {
  await loadDashboardData();
  success("✅ Dashboard refreshed");
};

const getDaysBadgeClass = (days) => {
  if (days <= 1) return "critical";
  if (days <= 3) return "warning";
  if (days <= 7) return "caution";
  return "info";
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Navigation handlers
const goToUsers = () => router.push("/admin/users");
const goToSystems = () => router.push("/admin/system-setup/systems");
const goToRevocationHistory = () => router.push("/admin/revocation-history");
const goToDepartments = () => router.push("/dashboard/departments");
const goToSettings = () => router.push("/dashboard/settings");
const goToPrivileges = () => router.push("/admin/privileges");

// Load on mount
onMounted(() => {
  if (!userStore.isAdmin) {
    console.warn("⚠️ Non-admin user accessing admin dashboard");
    router.push("/dashboard");
    return;
  }

  loadDashboardData();

  // Refresh stats every 5 minutes
  setInterval(loadDashboardData, 5 * 60 * 1000);
});
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
  min-height: 100vh;
}

.header-section {
  margin-bottom: 32px;
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  gap: 12px;
}

.icon {
  font-size: 36px;
  line-height: 1;
}

.page-subtitle {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 28px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.stat-icon.users {
  background: #e3f2fd;
}

.stat-icon.systems {
  background: #f3e5f5;
}

.stat-icon.permissions {
  background: #e8f5e9;
}

.stat-icon.revoked {
  background: #ffebee;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}

/* Metrics Section */
.metrics-section {
  margin-bottom: 32px;
}

/* Quick Actions */
.quick-actions-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}

.action-button {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  font-weight: 500;
  font-size: 13px;
}

.action-button:hover {
  border-color: #999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-icon {
  font-size: 24px;
  line-height: 1;
}

.action-text {
  color: #333;
}

.action-arrow {
  opacity: 0;
  transition: opacity 0.3s ease;
  color: #007bff;
}

.action-button:hover .action-arrow {
  opacity: 1;
}

/* Health Section */
.health-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.health-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.health-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.health-label {
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.health-indicator {
  font-size: 32px;
  margin: 8px 0;
}

.health-indicator.healthy {
  color: #4caf50;
}

.health-indicator.warning {
  color: #ff9800;
}

.health-text {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}

.health-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 8px 0;
}

.refresh-button {
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 11px;
  cursor: pointer;
  margin-top: 8px;
  transition: background 0.2s ease;
}

.refresh-button:hover {
  background: #0056b3;
}

/* Upcoming Expirations */
.upcoming-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.expirations-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.expiration-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  border-left: 4px solid #ff9800;
  background: #fff8f0;
  padding: 12px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.expiration-item.selected {
  background: #fff3e0;
  border-left-color: #2196f3;
}

.expiration-checkbox {
  display: flex;
  align-items: center;
  margin-top: 2px;
}

.expiration-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.expiration-content {
  flex: 1;
  min-width: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.bulk-revoke-button {
  padding: 8px 16px;
  background: #ef5350;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
  white-space: nowrap;
}

.bulk-revoke-button:hover {
  background: #e53935;
}

.expiration-item {
  border-left: 4px solid #ff9800;
  background: #fff8f0;
  padding: 12px;
  border-radius: 4px;
}

.expiration-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.system-name {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 13px;
}

.days-badge {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.days-badge.critical {
  background: #ffcdd2;
  color: #c62828;
}

.days-badge.warning {
  background: #ffe0b2;
  color: #e65100;
}

.days-badge.caution {
  background: #fff9c4;
  color: #f57f17;
}

.days-badge.info {
  background: #bbdefb;
  color: #0d47a1;
}

.expiration-user {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.expiration-date {
  font-size: 11px;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 13px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #ddd;
  border-top-color: #999;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .actions-grid {
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  }

  .health-grid {
    grid-template-columns: 1fr;
  }
}
</style>
