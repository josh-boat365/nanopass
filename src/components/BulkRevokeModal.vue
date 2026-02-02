<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">Revoke Multiple Permissions</h2>
        <button @click="close" class="close-button" aria-label="Close">
          ✕
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <!-- Selection Summary -->
        <div v-if="selectedPermissions.length > 0" class="selection-summary">
          <div class="summary-item">
            <span class="summary-label">Selected Permissions:</span>
            <span class="summary-value">{{ selectedPermissions.length }}</span>
          </div>
          <button @click="clearSelection" class="btn-clear">
            Clear Selection
          </button>
        </div>

        <!-- Permissions List -->
        <div class="permissions-section">
          <h3 class="section-title">Permissions to Revoke</h3>
          <div v-if="selectedPermissions.length > 0" class="permissions-list">
            <div
              v-for="perm in selectedPermissions"
              :key="perm.id"
              class="permission-item"
            >
              <div class="permission-checkbox">
                <input
                  type="checkbox"
                  :checked="true"
                  @change="togglePermission(perm.id)"
                />
              </div>
              <div class="permission-details">
                <div class="permission-system">{{ perm.system_name }}</div>
                <div class="permission-user">{{ perm.user_email }}</div>
              </div>
              <div class="permission-expiry">
                <span class="expiry-label">Expires:</span>
                <span class="expiry-date">{{
                  formatDate(perm.expiry_date)
                }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-message">
            No permissions selected for revocation
          </div>
        </div>

        <!-- Reason Selection -->
        <div class="form-group">
          <label for="reason">Revocation Reason *</label>
          <select
            id="reason"
            v-model="form.reason"
            class="form-control"
            required
          >
            <option value="">-- Select a reason --</option>
            <option value="manual">Manual Revocation</option>
            <option value="admin_action">Admin Action</option>
            <option value="policy_violation">Policy Violation</option>
            <option value="user_request">User Request</option>
            <option value="termination">Employee Termination</option>
            <option value="other">Other</option>
          </select>
          <span v-if="!form.reason" class="error-text">
            Reason is required
          </span>
        </div>

        <!-- Notes Section -->
        <div class="form-group">
          <label for="notes">Additional Notes (Optional)</label>
          <textarea
            id="notes"
            v-model="form.notes"
            class="form-control textarea"
            rows="4"
            placeholder="Add any additional context or details..."
          ></textarea>
          <span class="char-count"
            >{{ form.notes.length }} / 500 characters</span
          >
        </div>

        <!-- Confirmation Checkbox -->
        <div class="confirmation-section">
          <label class="confirmation-label">
            <input
              v-model="form.confirmed"
              type="checkbox"
              class="confirmation-input"
            />
            <span>
              I confirm that I want to revoke
              <strong>{{ selectedPermissions.length }}</strong>
              permission(s). This action cannot be undone.
            </span>
          </label>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button @click="close" class="btn btn-secondary">Cancel</button>
        <button
          @click="submitRevocation"
          :disabled="!canSubmit || isSubmitting"
          class="btn btn-danger"
        >
          <span v-if="isSubmitting" class="spinner"></span>
          {{
            isSubmitting
              ? "Revoking..."
              : `Revoke ${selectedPermissions.length} Permission(s)`
          }}
        </button>
      </div>

      <!-- Results Summary (shown after submission) -->
      <div v-if="showResults" class="results-section">
        <div class="results-header">
          <h3>Revocation Results</h3>
        </div>
        <div class="results-content">
          <div class="result-stat successful">
            <span class="result-icon">✅</span>
            <span class="result-count">{{ results.revoked }}</span>
            <span class="result-label">Successfully Revoked</span>
          </div>
          <div v-if="results.failed > 0" class="result-stat failed">
            <span class="result-icon">⚠️</span>
            <span class="result-count">{{ results.failed }}</span>
            <span class="result-label">Failed</span>
          </div>
        </div>

        <div
          v-if="results.details && results.details.length > 0"
          class="results-details"
        >
          <h4>Details</h4>
          <div class="details-list">
            <div
              v-for="(detail, idx) in results.details"
              :key="idx"
              :class="['detail-item', detail.status]"
            >
              <span class="detail-system">{{ detail.system_name }}</span>
              <span class="detail-status">{{
                detail.status === "revoked" ? "✅ Revoked" : "❌ Failed"
              }}</span>
              <span v-if="detail.message" class="detail-message">
                {{ detail.message }}
              </span>
            </div>
          </div>
        </div>

        <div class="results-footer">
          <button @click="close" class="btn btn-primary">Done</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { usePermissionExpiry } from "@/composables/usePermissionExpiry";
import { useToast } from "@/composables/useToast";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  permissions: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close", "revoke-success"]);

const { bulkRevokePermissions } = usePermissionExpiry();
const { success, error: showError } = useToast();

// Form state
const form = ref({
  reason: "",
  notes: "",
  confirmed: false,
});

const selectedPermissions = ref([]);
const isSubmitting = ref(false);
const showResults = ref(false);
const results = ref({
  revoked: 0,
  failed: 0,
  details: [],
});

// Computed properties
const canSubmit = computed(() => {
  return (
    form.value.reason &&
    form.value.confirmed &&
    selectedPermissions.value.length > 0 &&
    !isSubmitting.value
  );
});

// Initialize selected permissions
const initializePermissions = () => {
  selectedPermissions.value = props.permissions.map((p) => ({
    id: p.id,
    system_name: p.systemName || p.system_name,
    user_email: p.email || p.user_email,
    expiry_date: p.date_time_expiry || p.expiry_date,
  }));
};

// Toggle permission selection
const togglePermission = (permissionId) => {
  selectedPermissions.value = selectedPermissions.value.filter(
    (p) => p.id !== permissionId,
  );
};

// Clear all selections
const clearSelection = () => {
  selectedPermissions.value = [];
};

// Format date
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// Submit revocation
const submitRevocation = async () => {
  if (!canSubmit.value) return;

  isSubmitting.value = true;
  showResults.value = false;

  try {
    const permissionIds = selectedPermissions.value.map((p) => p.id);

    // Prepare permission data for admin notification
    const permissionsData = selectedPermissions.value.map((p) => ({
      id: p.id,
      user_email: p.user_email,
      system_name: p.system_name,
      date_time_expiry: p.expiry_date,
    }));

    const response = await bulkRevokePermissions(
      permissionIds,
      form.value.reason,
      form.value.notes || undefined,
      permissionsData,
    );

    // Process results
    results.value = {
      revoked: response.revoked || 0,
      failed: response.failed || 0,
      details: response.results || [],
    };

    showResults.value = true;

    // Emit success event
    emit("revoke-success", {
      total: response.total,
      revoked: response.revoked,
      failed: response.failed,
    });

    if (response.revoked > 0) {
      success(`✅ Successfully revoked ${response.revoked} permission(s)`);
    }

    if (response.failed > 0) {
      showError(`⚠️ Failed to revoke ${response.failed} permission(s)`);
    }
  } catch (err) {
    console.error("Error revoking permissions:", err);
    showError("Failed to revoke permissions. Please try again.");
    showResults.value = false;
  } finally {
    isSubmitting.value = false;
  }
};

// Close modal
const close = () => {
  // Reset form
  form.value = {
    reason: "",
    notes: "",
    confirmed: false,
  };
  selectedPermissions.value = [];
  showResults.value = false;
  results.value = { revoked: 0, failed: 0, details: [] };
  emit("close");
};

// Watch for props changes
import { watch } from "vue";
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      initializePermissions();
    }
  },
);
</script>

<style scoped>
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
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
}

.close-button:hover {
  color: #333;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.selection-summary {
  background: #f0f4ff;
  border: 1px solid #d0deff;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.summary-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.summary-value {
  font-size: 18px;
  font-weight: 700;
  color: #007bff;
}

.btn-clear {
  background: transparent;
  border: 1px solid #d0deff;
  color: #0056b3;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-clear:hover {
  background: #e7f0ff;
}

.permissions-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.permissions-list {
  border: 1px solid #ddd;
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #eee;
  transition: background 0.2s ease;
}

.permission-item:last-child {
  border-bottom: none;
}

.permission-item:hover {
  background: #f9f9f9;
}

.permission-checkbox {
  display: flex;
  align-items: center;
}

.permission-checkbox input {
  cursor: pointer;
}

.permission-details {
  flex: 1;
  min-width: 0;
}

.permission-system {
  font-weight: 600;
  color: #333;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.permission-user {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.permission-expiry {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #999;
  white-space: nowrap;
}

.expiry-label {
  color: #666;
}

.expiry-date {
  font-weight: 500;
}

.empty-message {
  text-align: center;
  padding: 30px 20px;
  color: #999;
  font-size: 13px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.textarea {
  resize: vertical;
  font-family: inherit;
}

.char-count {
  display: block;
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.error-text {
  display: block;
  font-size: 12px;
  color: #d32f2f;
  margin-top: 4px;
}

.confirmation-section {
  background: #fff8f0;
  border: 1px solid #ffe0b2;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}

.confirmation-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
}

.confirmation-input {
  margin-top: 4px;
  cursor: pointer;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
  background: #f9f9f9;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #d0d0d0;
}

.btn-danger {
  background: #d32f2f;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #b71c1c;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.results-section {
  border-top: 1px solid #eee;
  padding: 20px;
  background: #f9f9f9;
}

.results-header {
  margin-bottom: 16px;
}

.results-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.results-content {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.result-stat {
  flex: 1;
  padding: 12px;
  border-radius: 6px;
  text-align: center;
}

.result-stat.successful {
  background: #e8f5e9;
  border: 1px solid #c8e6c9;
}

.result-stat.failed {
  background: #ffebee;
  border: 1px solid #ffcdd2;
}

.result-icon {
  font-size: 16px;
  display: block;
  margin-bottom: 4px;
}

.result-count {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin: 4px 0;
}

.result-label {
  display: block;
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
}

.results-details {
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}

.results-details h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
}

.details-list {
  display: grid;
  gap: 8px;
}

.detail-item {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
}

.detail-item.revoked {
  background: #f0fdf4;
  border-left: 3px solid #22c55e;
}

.detail-item.failed {
  background: #fef2f2;
  border-left: 3px solid #ef4444;
}

.detail-system {
  font-weight: 500;
  color: #333;
}

.detail-status {
  font-weight: 600;
  white-space: nowrap;
}

.detail-message {
  grid-column: 1 / -1;
  font-size: 11px;
  color: #666;
  margin-top: 4px;
}

.results-footer {
  display: flex;
  justify-content: center;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

@media (max-width: 640px) {
  .modal-content {
    max-width: 95vw;
  }

  .modal-body {
    max-height: calc(90vh - 140px);
  }

  .selection-summary {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .summary-item {
    width: 100%;
  }

  .btn-clear {
    width: 100%;
  }

  .results-content {
    flex-direction: column;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
