import {
  createRouter,
  createWebHistory
} from "vue-router";
import { useUserStore } from "@/stores/useUserStore.js";
import Login from "@/pages/auth/Login.vue";
import Register from "@/pages/auth/Register.vue";
import Dashboard from "@/pages/dashboard/Index.vue";
import UserDashboard from "@/pages/dashboard/user/Index.vue";
import UserDashboard2 from "@/pages/dashboard/user/Index2.vue";
import UserAssignedKeys from "@/pages/dashboard/user/AssignedKeys.vue";
import UserPersonalKeys from "@/pages/dashboard/user/PersonalKeys.vue";
import AuditTrails from "@/pages/dashboard/AuditTrails.vue";
import Settings from "@/pages/dashboard/Settings.vue";
import CreateUser from "@/pages/users/Create.vue";
import CreateSystemPasswordPolicy from "@/pages/system-setup/CreateSystemPasswordPolicy.vue";
import CreateSystemCategory from "@/pages/system-setup/CreateSystemCategory.vue";
import CreateSystem from "@/pages/system-setup/CreateSystem.vue";
import CreateSystemPassword from "../pages/system-setup/CreateSystemPassword.vue";
import AssignSystemsToUser from "../pages/system-setup/AssignSystemsToUser.vue";
import Departments from "@/pages/dashboard/Departments.vue";
import NotFound from "@/pages/errors/NotFound.vue";
import ServerError from "@/pages/errors/ServerError.vue";
import RevocationHistory from "@/pages/admin/RevocationHistory.vue";
import NotificationsPage from "@/pages/notifications/Index.vue";

const routes = [
  {
    path: "/notifications",
    component: NotificationsPage,
    meta: {
      requiresAuth: true,
      role: ["user", "admin"],
    },
  },
  {
    path: "/",
    component: Login,
    meta: {
      requiresGuest: true
    }
  },
  {
    path: "/login",
    component: Login,
    meta: {
      requiresGuest: true
    }
  },
  {
    path: "/register",
    component: Register,
    meta: {
      requiresGuest: true
    }
  },
  {
    path: "/user/dashboard",
    component: UserDashboard,
    meta: {
      requiresAuth: true,
      role: ['user', 'admin']
    }
  },
  {
    path: "/user/dashboard2",
    component: UserDashboard2,
    meta: {
      requiresAuth: true,
      role: ['user', 'admin']
    }
  },
  {
    path: "/user/assigned-keys",
    component: UserAssignedKeys,
    meta: {
      requiresAuth: true,
      role: ['user', 'admin']
    }
  },
  {
    path: "/user/personal-keys",
    component: UserPersonalKeys,
    meta: {
      requiresAuth: true,
      role: ['user', 'admin']
    }
  },
  {
    path: "/dashboard/settings",
    component: Settings,
    meta: {
      requiresAuth: true,
      role: ['user', 'admin']
    }
  },
  {
    path: "/admin/dashboard",
    component: Dashboard,
    meta: {
      requiresAuth: true,
      role: ['admin']
    }
  },
  {
    path: "/admin/dashboard/auth-trails",
    component: AuditTrails,
    meta: {
      requiresAuth: true,
      role: ['admin']
    }
  },

  {
    path: "/admin/dashboard/create-user",
    component: CreateUser,
    meta: {
      requiresAuth: true,
      role: ['admin']
    }
  },
  {
    path: "/admin/dashboard/create-system-passwords-policy",
    component: CreateSystemPasswordPolicy,
    meta: {
      requiresAuth: true,
      role: ['admin']
    }
  },
  {
    path: "/admin/dashboard/create-system-category",
    component: CreateSystemCategory,
    meta: {
      requiresAuth: true,
      role: ['admin']
    }
  },
  {
    path: "/admin/dashboard/create-system",
    component: CreateSystem,
    meta: {
      requiresAuth: true,
      role: ['admin']
    }
  },
  {
    path: "/admin/dashboard/create-passwords-for-systems",
    component: CreateSystemPassword,
    meta: {
      requiresAuth: true,
      role: ['admin']
    }
  },
  {
    path: "/admin/dashboard/assign-systems-to-users",
    component: AssignSystemsToUser,
    meta: {
      requiresAuth: true,
      role: ['admin']
    }
  },
  {
    path: "/admin/dashboard/departments",
    component: Departments,
    meta: {
      requiresAuth: true,
      role: ['admin']
    }
  },
  {
    path: "/admin/dashboard/revocation-history",
    component: RevocationHistory,
    meta: {
      requiresAuth: true,
      role: ['admin']
    }
  },
  {
    path: "/error/404",
    component: NotFound,
    meta: {
      title: "Page Not Found"
    }
  },
  {
    path: "/error/500",
    component: ServerError,
    meta: {
      title: "Server Error"
    }
  },
  {
    path: "/:pathMatch(.*)*",
    component: NotFound,
    meta: {
      title: "Page Not Found"
    }
  }
]
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  const isAuthenticated = userStore.isAuthenticated;

  // Use local admin status - only verify on specific pages where needed
  let isAdmin = userStore.isAdmin;

  console.log('🔐 Route Guard:', {
    to: to.path,
    isAuthenticated,
    isAdmin,
    requiresAuth: to.meta.requiresAuth,
    requiredRoles: to.meta.role
  });

  // Check authentication requirement
  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login');
    next("/login");
    return;
  }

  // Check role-based access
  if (to.meta.role) {
    const userRole = isAdmin ? 'admin' : 'user';
    const hasRequiredRole = to.meta.role.includes(userRole);

    console.log('👤 Role check:', {
      userRole,
      requiredRoles: to.meta.role,
      hasAccess: hasRequiredRole
    });

    if (!hasRequiredRole) {
      console.log('❌ Insufficient permissions, redirecting');
      // Redirect unauthorized users to their dashboard
      next(isAdmin ? "/admin/dashboard" : "/user/dashboard");
      return;
    }
  }

  // Redirect authenticated users from guest pages
  if (to.meta.requiresGuest && isAuthenticated) {
    console.log('⏭️ Already authenticated, skipping guest page');
    next(isAdmin ? "/admin/dashboard" : "/user/dashboard");
    return;
  }

  console.log('✅ Route access granted');
  next();
});

export default router;