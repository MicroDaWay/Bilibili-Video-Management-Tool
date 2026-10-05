import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: () => import('@/views/Home.vue') },
  { path: '/manuscript-management', component: () => import('@/views/ManuscriptManagement.vue') },
  { path: '/hot-activities', component: () => import('@/views/HotActivities.vue') },
  { path: '/revenue-center', component: () => import('@/views/RevenueCenter.vue') },
  { path: '/update-database', component: () => import('@/views/UpdateDatabase.vue') },
  {
    path: '/disqualified-manuscript',
    component: () => import('@/views/DisqualifiedManuscript.vue')
  },
  { path: '/view-less-one-hundred', component: () => import('@/views/ViewLessOneHundred.vue') }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
