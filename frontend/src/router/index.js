import Vue from 'vue'
import Router from 'vue-router'
import IndexPage from '@/components/IndexPage'
import Network from '@/components/NetworkPage'
import OrderMap from '@/components/OrderMapPage'
Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: IndexPage
    },
    {
      path: '/network',
      name: 'network',
      component: Network
    },
    {
      path: '/orderMap',
      name: 'ordermap',
      component: OrderMap
    }
  ]
})
