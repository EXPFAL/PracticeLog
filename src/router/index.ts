import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('../views/Dashboard.vue')
    },
    {
      path: '/practices',
      name: 'PracticeList',
      component: () => import('../views/PracticeList.vue')
    },
    {
      path: '/practice/:id',
      name: 'PracticeDetail',
      component: () => import('../views/PracticeDetail.vue'),
      props: true
    },
    {
      path: '/export',
      name: 'Export',
      component: () => import('../views/ExportView.vue')
    },
    {
      path: '/search',
      name: 'Search',
      component: () => import('../views/SearchView.vue')
    },
    {
      path: '/stats',
      name: 'Stats',
      component: () => import('../views/StatsView.vue')
    }
  ]
})

export default router
