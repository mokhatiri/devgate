import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebase'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('../views/SignUp.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('../views/ForgotPassword.vue')
  },
  {
    path : '/explore/:id?',
    name : 'explore',
    component : () => import('../views/ExploreView.vue')
  },
  {
    path: '/addcommunity',
    name: 'addcommunity',
    component: () => import('../views/AddCommunityView.vue')
  },
  {
    path: '/chat',
    name: 'chat',
    component: () => import('../views/ChatView.vue')
  },
  {
    path : '/editcommunity/:id',
    name : 'editcommunity',
    component : () => import ('../views/EditCommunity.vue')
  },
  {
    path : '/communitydetails/:id',
    name :'communitydetails',
    component : () => import ('../views/CommunityDetails.vue')

  }    

]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// if the user isn't auth reroute him to login, and only allow him to enter login, signup, forgot-password
onAuthStateChanged(auth, (user) => {
  if (!user && router.currentRoute.value.name !== 'login' && router.currentRoute.value.name !== 'signup' && router.currentRoute.value.name !== 'forgot-password') {
    router.push({ name: 'login' })
  }
})

router.beforeEach((to, from, next) => {
  if (to.name === 'login' || to.name === 'signup' || to.name === 'forgot-password') {
    next()
  } else {
    if (auth.currentUser) {
      next()
    } else {
      next({ name: 'login' })
    }
  }
})

export default router