import "whatwg-fetch";
import cssVars from "css-vars-ponyfill";
import { sync } from "vuex-router-sync";
import store from "@/store";
import router from "@/router";
import i18n from "@/i18n";
import Vue from "@/utils/vue";
import { recaptcha, loginPage } from "@/utils/constants";
import { login, validateLogin } from "@/utils/auth";
import App from "@/App.vue";
import Vuetify from "vuetify";
import 'vuetify/dist/vuetify.min.css'
import "@mdi/font/css/materialdesignicons.css";



cssVars();

sync(store, router);


async function start() {
  try {
    if (loginPage) {
      await validateLogin();
    } else {
      await login("", "", "");
    }
  } catch (e) {
    console.log(e);
  }

  if (recaptcha) {
    await new Promise((resolve) => {
      const check = () => {
        if (typeof window.grecaptcha === "undefined") {
          setTimeout(check, 100);
        } else {
          resolve();
        }
      };

      check();
    });
  }
  Vue.use(Vuetify)

  new Vue({
    el: "#app",
    store,
    router,
    i18n,
    template: "<App/>",
    vuetify: new Vuetify(),
    components: { App },
  });
}

start();
