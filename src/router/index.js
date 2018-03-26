import Vue from 'vue'
import Router from 'vue-router'
import Interpreter from '@/components/Interpreter'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Interpreter',
      component: Interpreter
    }
  ]
})
