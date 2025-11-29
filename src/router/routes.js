import { createRouter, createWebHistory } from "vue-router";
import Login from "@/pages/auth/Login.vue";
import Register from "@/pages/auth/Register.vue";

const routes = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {path: "/", component: Login},
    {path: "/login", component: Login},
    {path: "/register", component: Register},
]});

export default routes;