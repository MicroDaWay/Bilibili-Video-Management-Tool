import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: () => import('@/views/Home.vue') },
  { path: '/hot-activities', component: () => import('@/views/HotActivities.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
