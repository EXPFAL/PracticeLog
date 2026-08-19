import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  scrollBehavior: () => ({ top: 0 }),
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
      props: true,
      beforeEnter: (to) => {
        const id = Number(to.params.id)
        if (isNaN(id) || id <= 0) {
          return { name: 'NotFound' }
        }
      }
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
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('../views/SettingsView.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFound.vue')
    }
  ]
})

export default router
