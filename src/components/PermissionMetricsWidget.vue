<template>
  <div class="metrics-container">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading metrics...</p>
    </div>

    <div v-else-if="metrics" class="metrics-content">
      <!-- Metrics Grid -->
      <div class="metrics-grid">
        <div class="metric-card active">
          <div class="metric-icon">✅</div>
          <div class="metric-content">
            <div class="metric-number">
              {{ metrics.total_active_permissions }}
            </div>
            <div class="metric-label">Active Permissions</div>
          </div>
        </div>

        <div class="metric-card warning">
          <div class="metric-icon">⏰</div>
          <div class="metric-content">
            <div class="metric-number">{{ metrics.expiring_this_week }}</div>
            <div class="metric-label">Expiring This Week</div>
          </div>
        </div>

        <div class="metric-card expiring">
          <div class="metric-icon">📅</div>
          <div class="metric-content">
            <div class="metric-number">{{ metrics.expiring_next_30_days }}</div>
            <div class="metric-label">Expiring in 30 Days</div>
          </div>
        </div>

        <div class="metric-card revoked">
          <div class="metric-icon">🔴</div>
          <div class="metric-content">
            <div class="metric-number">
              {{ metrics.total_revoked_permissions }}
            </div>
            <div class="metric-label">Revoked Permissions</div>
          </div>
        </div>
      </div>

      <!-- Activity Row -->
      <div class="activity-row">
        <div class="activity-stat">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-number">{{ metrics.revoked_this_week }}</div>
            <div class="stat-label">Revoked This Week</div>
          </div>
        </div>

        <div class="activity-stat">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <div class="stat-number">{{ metrics.revoked_this_month }}</div>
            <div class="stat-label">Revoked This Month</div>
          </div>
        </div>
      </div>

      <!-- Recent Expirations -->
      <div
        v-if="
          metrics.recent_expirations && metrics.recent_expirations.length > 0
        "
        class="recent-section"
      >
        <h4 class="section-title">⏳ Recent Expirations</h4>
        <div class="items-list">
          <div
            v-for="(exp, idx) in metrics.recent_expirations.slice(0, 5)"
            :key="`exp-${idx}`"
            class="item"
          >
            <div class="item-main">
              <div class="item-email">{{ exp.user_email }}</div>
              <div class="item-system">{{ exp.system_name }}</div>
            </div>
            <div class="item-meta">
              <span :class="['days-badge', getExpiryBadgeClass(exp.days_left)]">
                {{ exp.days_left }} day{{ exp.days_left !== 1 ? "s" : "" }} left
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Revocations -->
      <div
        v-if="
          metrics.recent_revocations && metrics.recent_revocations.length > 0
        "
        class="recent-section"
      >
        <h4 class="section-title">🔐 Recent Revocations</h4>
        <div class="items-list">
          <div
            v-for="(rev, idx) in metrics.recent_revocations.slice(0, 5)"
            :key="`rev-${idx}`"
            class="item"
          >
            <div class="item-main">
              <div class="item-email">{{ rev.user_email }}</div>
              <div class="item-system">{{ rev.system_name }}</div>
            </div>
            <div class="item-meta">
              <span :class="['reason-badge', `reason-${rev.reason}`]">
                {{ formatReason(rev.reason) }}
              </span>
              <div class="item-date">{{ formatDate(rev.revoked_at) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="actions">
        <button @click="goToHistory" class="btn btn-secondary">
          View Full Audit Trail
        </button>
        <button @click="refreshMetrics" class="btn btn-primary">
          🔄 Refresh
        </button>
      </div>
    </div>

    <div v-else class="error-state">
      <p>Failed to load metrics</p>
      <button @click="refreshMetrics" class="btn btn-secondary">
        Try Again
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { usePermissionExpiry } from "@/composables/usePermissionExpiry";
import { useUserStore } from "@/stores/useUserStore";

const router = useRouter();
const { fetchDashboardMetrics } = usePermissionExpiry();
const userStore = useUserStore();

const metrics = ref(null);
const loading = ref(false);

onMounted(async () => {
  if (!userStore.isAdmin) {
    console.warn("⚠️ Admin access required for metrics");
    return;
  }

  await refreshMetrics();
});

const refreshMetrics = async () => {
  loading.value = true;
  try {
    metrics.value = await fetchDashboardMetrics();
    console.log("✅ Metrics loaded successfully");
  } catch (err) {
    console.error("❌ Error loading metrics:", err);
    metrics.value = null;
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  if (date.toDateString() === today.toDateString()) {
    return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString();
  }
};

const formatReason = (reason) => {
  const reasons = {
    automatic_expiry: "Auto-Expired",
    manual: "Manual",
    admin_action: "Admin Action",
  };
  return reasons[reason] || reason;
};

const getExpiryBadgeClass = (daysLeft) => {
  if (daysLeft <= 1) return "critical";
  if (daysLeft <= 7) return "warning";
  return "info";
};

const goToHistory = () => {
  router.push("/admin/revocation-history");
};
</script>

<style scoped>
.metrics-container {
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.loading-state,
.error-state {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #ddd;
  border-top-color: #007bff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.metric-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.metric-number {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.metric-label {
  font-size: 12px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
}

.activity-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.activity-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border-left: 3px solid #007bff;
}

.stat-icon {
  font-size: 24px;
}

.stat-number {
  font-size: 20px;
  font-weight: 600;
  line-height: 1;
}

.stat-label {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.recent-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border-left: 3px solid #ddd;
  transition: border-color 0.2s ease;
}

.item:hover {
  border-left-color: #007bff;
}

.item-main {
  flex: 1;
}

.item-email {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.item-system {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.days-badge,
.reason-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.days-badge.critical {
  background: #ffcdd2;
  color: #c62828;
}

.days-badge.warning {
  background: #fff3cd;
  color: #e65100;
}

.days-badge.info {
  background: #bbdefb;
  color: #0d47a1;
}

.reason-badge.reason-automatic_expiry {
  background: #e3f2fd;
  color: #1565c0;
}

.reason-badge.reason-manual {
  background: #f3e5f5;
  color: #6a1b9a;
}

.reason-badge.reason-admin_action {
  background: #ffebee;
  color: #c62828;
}

.item-date {
  font-size: 11px;
  color: #999;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid #ddd;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 13px;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #545b62;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .item {
    flex-direction: column;
    align-items: flex-start;
  }

  .item-meta {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    margin-top: 8px;
  }

  .actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
