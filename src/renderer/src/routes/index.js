import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: () => import('@/views/Home.vue') },
  { path: '/hot-activities', component: () => import('@/views/HotActivities.vue') },
  { path: '/manuscript-management', component: () => import('@/views/ManuscriptManagement.vue') },
  { path: '/update-database', component: () => import('@/views/UpdateDatabase.vue') }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
