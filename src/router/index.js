import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/roller' },
  { path: '/roller', name: 'Roller', component: () => import('../views/RollerView.vue') },
  { path: '/card', name: 'Card', component: () => import('../views/CardView.vue') },
  { path: '/statistics', name: 'Statistics', component: () => import('../views/StatisticsView.vue') },
  { path: '/records', name: 'Records', component: () => import('../views/RecordsView.vue') },
  { path: '/lists', name: 'Lists', component: () => import('../views/ListsView.vue') },
  { path: '/lists/manage', name: 'ListManage', component: () => import('../views/ListManageView.vue') },
  { path: '/group-manage', name: 'GroupManage', component: () => import('../views/GroupManageView.vue') },
  { path: '/settings', name: 'Settings', component: () => import('../views/SettingsView.vue') },
  { path: '/settings/balance-curve', redirect: '/settings' },
  { path: '/about', name: 'About', component: () => import('../views/AboutView.vue') },
  { path: '/about/contributors', name: 'Contributors', component: () => import('../views/ContributorsView.vue') },
  { path: '/download', name: 'Download', component: () => import('../views/DownloadView.vue') },
  { path: '/announcement', name: 'Announcement', component: () => import('../views/AnnouncementView.vue') },
  { path: '/floating', name: 'Floating', component: () => import('../views/FloatingLauncherView.vue') }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
