import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import i18n from "./i18n";
import utils from "./mixins/utils";
import VueSvgInlinePlugin from "vue-svg-inline-plugin";
import VueSmoothScroll from "vue3-smooth-scroll";
import upperFirst from "lodash/upperFirst";
import camelCase from "lodash/camelCase";
import "./assets/css/main.css";

const app = createApp(App)
  .use(store)
  .use(router)
  .use(i18n)
  .use(VueSvgInlinePlugin)
  .use(VueSmoothScroll, { updateHistory: false, duration: 1000 })
  .mixin(utils);

const requireComponent = require.context("@/components", true, /[\w-]+\.vue$/);
requireComponent.keys().forEach((fileName) => {
  const componentConfig = requireComponent(fileName);
  const componentName = upperFirst(
    camelCase(fileName.replace(/^\.\//, "").replace(/\.\w+$/, ""))
  );
  app.component(componentName, componentConfig.default || componentConfig);
});

app.mount("#app");
