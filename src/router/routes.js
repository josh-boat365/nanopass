import {
  createRouter,
  createWebHistory
} from "vue-router";
import Login from "@/pages/auth/Login.vue";
import Register from "@/pages/auth/Register.vue";
import Dashboard from "@/pages/dashboard/Index.vue";
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
      path: "/dashboard",
      component: Dashboard
    },
    {
      path: "/dashboard/auth-trails",
      component: AuthTrails
    },
    {
      path: "/dashboard/settings",
      component: Settings
    },
    {
      path: "/dashboard/create-user",
      component: CreateUser
    },
    {
      path: "/dashboard/create-privileges",
      component: CreatePrivileges
    },
    {
      path: "/dashboard/create-system-passwords-category",
      component: CreateSystemPasswordCategory
    },
    {
      path: "/dashboard/create-system-passwords-policy-category",
      component: CreateSystemPasswordPolicyCategory
    },
    {
      path: "/dashboard/create-system-passwords",
      component: CreateSystemPassword
    },
  ]
});

export default routes;