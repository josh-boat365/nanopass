import { createRouter, createWebHistory } from "vue-router";
import Login from "@/pages/auth/Login.vue";
import Register from "@/pages/auth/Register.vue";
import Dashboard from "@/pages/dashboard/Index.vue";

const routes = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {path: "/", component: Login},
    {path: "/login", component: Login},
    {path: "/register", component: Register},
    {path: "/dashboard", component: Dashboard},
]});

export default routes;