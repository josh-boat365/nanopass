<template>
  <div
    v-if="expiringPermissions.length > 0"
    class="alert alert-warning alert-dismissible fade show"
    role="alert"
  >
    <div class="alert-content">
      <AlertCircle class="alert-icon" />
      <div class="alert-body">
        <strong class="alert-title"
          >⏰ {{ expiringPermissions.length }} Permission{{
            expiringPermissions.length !== 1 ? "s" : ""
          }}
          Expiring Soon</strong
        >
        <p class="alert-message">
          Review your access and plan for renewal if needed
        </p>
        <div v-if="expiringPermissions.length <= 3" class="expiring-list">
          <div
            v-for="perm in expiringPermissions"
            :key="perm.id"
            class="expiring-item"
          >
            <span class="system-name">{{ perm.system_name }}</span>
            <span :class="['days-badge', getDaysBadgeClass(perm.days_left)]">
              {{ perm.days_left }} day{{ perm.days_left !== 1 ? "s" : "" }} left
            </span>
          </div>
        </div>
        <button @click="viewDetails" class="btn btn-sm btn-warning">
          View Details
        </button>
      </div>
    </div>
    <button
      type="button"
      class="btn-close"
      @click="dismissAlert"
      aria-label="Close"
    ></button>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import { AlertCircle } from "lucide-vue-next";
import { usePermissionExpiry } from "@/composables/usePermissionExpiry";

const { fetchExpiringPermissions, calculateDaysLeft } = usePermissionExpiry();

const expiringPermissions = ref([]);
const loading = ref(false);
const dismissed = ref(false);

const displayedPermissions = computed(() => {
  if (dismissed.value) return [];
  return expiringPermissions.value;
});

onMounted(async () => {
  loading.value = true;
  try {
    const data = await fetchExpiringPermissions(7);
    if (data && data.permissions) {
      expiringPermissions.value = data.permissions.map((perm) => ({
        ...perm,
        days_left: calculateDaysLeft(perm.expiry_date),
      }));
      console.log(
        `📢 Found ${expiringPermissions.value.length} expiring permission(s)`,
      );
    }
  } catch (err) {
    console.error("Failed to fetch expiring permissions:", err);
  } finally {
    loading.value = false;
  }
});

const getDaysBadgeClass = (daysLeft) => {
  if (daysLeft <= 1) return "critical";
  if (daysLeft <= 3) return "warning";
  return "info";
};

const dismissAlert = () => {
  dismissed.value = true;
  console.log("✓ Alert dismissed");
};

const viewDetails = () => {
  // Scroll to permissions list or emit event to parent
  const element = document.querySelector(".permissions-list");
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};
</script>

<style scoped>
.alert {
  border-radius: 8px;
  border: 1px solid #ffc107;
  background: #fff8e1;
  margin-bottom: 20px;
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.alert-content {
  flex: 1;
}

.alert-icon {
  width: 20px;
  height: 20px;
  color: #ff9800;
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-title {
  display: block;
  color: #e65100;
  font-size: 1rem;
  margin-bottom: 4px;
}

.alert-message {
  color: #f57f17;
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.expiring-list {
  margin: 10px 0;
  padding: 8px 0;
}

.expiring-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 0.9rem;
  color: #333;
}

.system-name {
  font-weight: 500;
}

.days-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
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

.btn {
  margin-top: 8px;
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  background: #ffc107;
  color: #000;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn:hover {
  background: #ffb300;
  transform: translateY(-1px);
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #999;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.btn-close:hover {
  color: #333;
}

@media (max-width: 768px) {
  .alert {
    flex-direction: column;
  }

  .expiring-item {
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
  }
}
</style>
