import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap/dist/js/bootstrap.js";
import { auth } from './firebase';

let app;

// Use the auth object to listen to the authentication state change
auth.onAuthStateChanged(user => {
  if (!app) {
    app = createApp(App);
    app.use(router);
    app.mount('#app');
  }
});
