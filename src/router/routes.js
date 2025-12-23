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
import AuthTrails from "@/pages/dashboard/AuthTrails.vue";
import Settings from "@/pages/dashboard/Settings.vue";
import CreateUser from "@/pages/users/Create.vue";
// import CreatePrivileges from "@/pages/privileges/Index.vue";
import CreateSystemPasswordCategory from "@/pages/system-setup/CreateSystemCategory.vue";
import CreateSystemPasswordPolicyCategory from "@/pages/system-setup/CreateSystemPasswordPolicyCategory.vue";
import CreateSystemPassword from "@/pages/system-setup/Index.vue";

const routes = [{
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
      requiresAuth: true
    }
  },
  {
    path: "/user/dashboard2",
    component: UserDashboard2,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/user/assigned-keys",
    component: UserAssignedKeys,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/user/personal-keys",
    component: UserPersonalKeys,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/dashboard/settings",
    component: Settings,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/admin/dashboard",
    component: Dashboard,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/admin/dashboard/auth-trails",
    component: AuthTrails,
    meta: {
      requiresAuth: true
    }
  },
  
  {
    path: "/admin/dashboard/create-user",
    component: CreateUser,
    meta: {
      requiresAuth: true
    }
  },
  // {
  //   path: "/admin/dashboard/create-privileges",
  //   component: CreatePrivileges
  // },
  {
    path: "/admin/dashboard/create-system-passwords-category",
    component: CreateSystemPasswordCategory,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/admin/dashboard/create-system-passwords-policy-category",
    component: CreateSystemPasswordPolicyCategory,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: "/admin/dashboard/create-system-passwords",
    component: CreateSystemPassword,
    meta: {
      requiresAuth: true
    }
  },
]
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const isAuthenticated = userStore.isAuthenticated;

  if (to.meta.requiresAuth && !isAuthenticated) {
    next("/login");
  } else if (to.meta.requiresGuest && isAuthenticated) {
    next("/user/dashboard");
  } else {
    next();
  }
});

export default router;