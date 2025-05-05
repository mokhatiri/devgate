import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'

const routes = [
  {
    path: '/',
    name: 'dashboard',
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
    path: '/goals/:id',
    name: 'goal-details',
    component: () => import('../views/GoalDetailsView.vue')
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
  },
  {
    path: '/notifications',
    name: 'notifications',
    component: () => import('../views/NotificationsView.vue')
  },
  {
    path: '/userprofile/:id',
    name: 'userprofile',
    component: HomeView
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Function to check if user exists in Firestore
async function checkUserExists(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    return userDoc.exists()
  } catch (error) {
    console.error('Error checking user existence:', error)
    return false
  }
}

const publicRoutes = ['login', 'signup', 'forgot-password']

// Updated auth state observer
onAuthStateChanged(auth, async (user) => {
  const currentRouteName = router.currentRoute.value.name
  
  if (!user) {
    if (!publicRoutes.includes(currentRouteName)) {
      router.push({ name: 'login' })
    }
    return
  }

  // Check if user exists in Firestore
  const userExists = await checkUserExists(user.uid)
  if (!userExists && !publicRoutes.includes(currentRouteName)) {
    // User is authenticated but not in Firestore
    auth.signOut() // Sign out the user
    router.push({ 
      name: 'login',
      query: { 
        error: 'account-not-found',
        message: 'Please create an account first'
      }
    })
  }
})

// Updated navigation guard
router.beforeEach(async (to, from, next) => {
  if (publicRoutes.includes(to.name)) {
    next()
    return
  }

  const user = auth.currentUser
  if (!user) {
    next({ name: 'login' })
    return
  }

  // Check if user exists in Firestore
  const userExists = await checkUserExists(user.uid)
  if (!userExists) {
    auth.signOut() // Sign out the user
    next({ 
      name: 'login',
      query: { 
        error: 'account-not-found',
        message: 'Please create an account first'
      }
    })
    return
  }

  next()
})

export default router