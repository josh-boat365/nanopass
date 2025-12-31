// src/composables/useSessionTimeout.js

import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/useUserStore';
import { useToast } from './useToast';

export const useSessionTimeout = () => {
    const router = useRouter();
    const userStore = useUserStore();
    const { showError } = useToast();

    // Configuration
    const SESSION_TIMEOUT_MINUTES = 45;
    const WARNING_BEFORE_LOGOUT_MINUTES = 2; // Show warning 2 minutes before logout
    const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000;
    const WARNING_TIMEOUT_MS = (SESSION_TIMEOUT_MINUTES - WARNING_BEFORE_LOGOUT_MINUTES) * 60 * 1000;

    // State
    let timeoutId = null;
    let warningTimeoutId = null;
    let activityListeners = [];
    const showTimeoutWarning = ref(false);
    const remainingMinutes = ref(WARNING_BEFORE_LOGOUT_MINUTES);
    let countdownInterval = null;
    let secondsRemaining = WARNING_BEFORE_LOGOUT_MINUTES * 60; // Track seconds
    let isLoggingOut = false; // Prevent duplicate logout attempts

    /**
     * Force logout - directly clears all session data
     * This is the most reliable way to logout immediately
     */
    const forceLogout = () => {
        console.log("🔒 Force logout - clearing session data immediately");

        // Immediately clear localStorage (synchronous, guaranteed)
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');

        // Manually clear the store state (setup syntax stores don't have $reset)
        userStore.user = null;
        userStore.token = null;
        userStore.users = [];
        userStore.currentUserDetails = null;

        console.log("✅ Session data cleared successfully");
    };

    /**
     * Graceful logout with API call and fallback
     * Attempts to notify backend but doesn't fail if API is unreachable
     */
    const gracefulLogout = async () => {
        console.log("📤 Graceful logout - notifying backend");

        try {
            // Try to call logout endpoint with 3 second timeout
            const logoutPromise = userStore.logout();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Logout timeout')), 3000)
            );

            await Promise.race([logoutPromise, timeoutPromise]);
            console.log("✅ Graceful logout completed");
        } catch (err) {
            console.warn("⚠️ Graceful logout failed, using force logout:", err.message);
            forceLogout();
        }
    };

    /**
     * Handle session expiration with robust error handling
     * Ensures logout happens no matter what
     */
    const handleSessionExpired = async () => {
        // Prevent duplicate logout attempts
        if (isLoggingOut) {
            console.log("⚠️ Logout already in progress, skipping duplicate");
            return;
        }

        isLoggingOut = true;
        console.log("❌ Session expired - initiating logout");

        try {
            // Clear all timeouts immediately
            if (timeoutId) clearTimeout(timeoutId);
            if (warningTimeoutId) clearTimeout(warningTimeoutId);
            if (countdownInterval) clearInterval(countdownInterval);

            // Remove activity listeners
            removeActivityListeners();

            // Attempt graceful logout first, falls back to force logout
            await gracefulLogout();

            // Navigate to login with a small delay to ensure state is cleared
            setTimeout(() => {
                router.push("/login");
            }, 100);

        } catch (err) {
            console.error("❌ Error in session expiration:", err);

            // Ultimate fallback - force clear and redirect
            forceLogout();
            router.push("/login");
        } finally {
            isLoggingOut = false;
        }
    };

    // Reset the session timeout
    const resetSessionTimeout = () => {
        console.log("⏱️ Session timeout reset");

        // Clear existing timeouts
        if (timeoutId) clearTimeout(timeoutId);
        if (warningTimeoutId) clearTimeout(warningTimeoutId);
        if (countdownInterval) clearInterval(countdownInterval);

        showTimeoutWarning.value = false;

        // Set warning timeout
        warningTimeoutId = setTimeout(() => {
            console.log("⚠️ Session expiration warning shown");
            showTimeoutWarning.value = true;
            remainingMinutes.value = WARNING_BEFORE_LOGOUT_MINUTES;
            secondsRemaining = WARNING_BEFORE_LOGOUT_MINUTES * 60;

            // Start countdown - update every second for real-time display
            countdownInterval = setInterval(() => {
                secondsRemaining--;
                remainingMinutes.value = Math.ceil(secondsRemaining / 60);

                // Auto-logout when time reaches 0
                if (secondsRemaining <= 0) {
                    console.log("⏰ Countdown reached 0 - auto logout triggered");
                    clearInterval(countdownInterval);
                    handleSessionExpired();
                }
            }, 1000);
        }, WARNING_TIMEOUT_MS);

        // Set logout timeout as backup
        timeoutId = setTimeout(() => {
            console.log("⏰ Backup timeout triggered - logout");
            handleSessionExpired();
        }, SESSION_TIMEOUT_MS);
    };

    // Extend session (user dismisses warning)
    const extendSession = () => {
        console.log("✅ Session extended by user");
        showTimeoutWarning.value = false;
        resetSessionTimeout();
    };

    // Track user activity
    const handleActivity = () => {
        // Only reset if user is authenticated and not logging out
        if (userStore.isAuthenticated && !isLoggingOut) {
            resetSessionTimeout();
        }
    };

    // Add activity event listeners
    const addActivityListeners = () => {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

        events.forEach(event => {
            document.addEventListener(event, handleActivity, { capture: true });
            activityListeners.push({ event, handler: handleActivity });
        });

        console.log("📡 Activity listeners added");
    };

    // Remove activity event listeners
    const removeActivityListeners = () => {
        activityListeners.forEach(({ event, handler }) => {
            document.removeEventListener(event, handler, { capture: true });
        });
        activityListeners = [];
        console.log("📡 Activity listeners removed");
    };

    // Initialize session timeout on mount
    onMounted(() => {
        if (userStore.isAuthenticated) {
            console.log("🕐 Initializing session timeout (45 minutes)");
            addActivityListeners();
            resetSessionTimeout();
        }
    });

    // Cleanup on unmount
    onUnmounted(() => {
        if (timeoutId) clearTimeout(timeoutId);
        if (warningTimeoutId) clearTimeout(warningTimeoutId);
        if (countdownInterval) clearInterval(countdownInterval);
        removeActivityListeners();
    });

    return {
        showTimeoutWarning,
        remainingMinutes,
        extendSession,
        handleSessionExpired,
        forceLogout,
        gracefulLogout,
        SESSION_TIMEOUT_MINUTES,
        WARNING_BEFORE_LOGOUT_MINUTES
    };
};
