import {
  createRouter,
  createWebHistory
} from "vue-router";
import Login from "@/pages/auth/Login.vue";
import Register from "@/pages/auth/Register.vue";
import Dashboard from "@/pages/dashboard/Index.vue";
import UserDashboard from "@/pages/dashboard/user/Index.vue";
import AuthTrails from "@/pages/dashboard/AuthTrails.vue";
import Settings from "@/pages/dashboard/Settings.vue";
import CreateUser from "@/pages/users/Create.vue";
import CreatePrivileges from "@/pages/privileges/Index.vue";
import CreateSystemPasswordCategory from "@/pages/system-setup/CreateSystemPasswordCategory.vue";
import CreateSystemPasswordPolicyCategory from "@/pages/system-setup/CreateSystemPasswordPolicyCategory.vue";
import CreateSystemPassword from "@/pages/system-setup/Index.vue";

const routes = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [{
      path: "/",
      component: Login
    },
    {
      path: "/login",
      component: Login
    },
    {
      path: "/register",
      component: Register
    },
    {
      path: "/admin/dashboard",
      component: Dashboard
    },
    {
      path: "/user/dashboard",
      component: UserDashboard
    },
    {
      path: "/admin/dashboard/auth-trails",
      component: AuthTrails
    },
    {
      path: "/dashboard/settings",
      component: Settings
    },
    {
      path: "/admin/dashboard/create-user",
      component: CreateUser
    },
    {
      path: "/admin/dashboard/create-privileges",
      component: CreatePrivileges
    },
    {
      path: "/admin/dashboard/create-system-passwords-category",
      component: CreateSystemPasswordCategory
    },
    {
      path: "/admin/dashboard/create-system-passwords-policy-category",
      component: CreateSystemPasswordPolicyCategory
    },
    {
      path: "/admin/dashboard/create-system-passwords",
      component: CreateSystemPassword
    },
  ]
});

export default routes;