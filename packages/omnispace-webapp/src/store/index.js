import { createStore } from "vuex";
import VuexPersistence from "vuex-persist";
import web3, { mainnetProvider } from "./modules/web3";
import axios from "axios";

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
});

export default createStore({
  state: {
    notifs: [],
    logs: [],
    ens: {},
    auth: {},
  },
  mutations: {
    notify(state, payload) {
      state.notifs.push({ ...payload, timestamp: Date.now() });
    },
    emptyNotifs(state) {
      state.notifs = [];
    },
    log(state, payload) {
      state.logs.push({ ...payload, timestamp: Date.now() });
    },
    emptyLogs(state) {
      state.logs = [];
    },
    saveENS(state, payload) {
      state.ens[payload[0]] = payload[1];
    },
    auth(state, payload) {
      state.auth = payload;
    },
  },
  actions: {
    notify({ commit }, payload) {
      Array.isArray(payload)
        ? commit("notify", { message: payload[0], color: payload[1] })
        : commit("notify", {
            message: payload,
            color: "green",
          });
    },
    log({ commit }, payload) {
      commit("log", {
        message: payload,
        date: new Date().toLocaleString("en-US", {
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          hour12: false,
        }),
      });
    },
    async getENS({ commit }, payload) {
      const ens = {};
      ens.name = await mainnetProvider.lookupAddress(payload);
      if (ens.name) {
        ens.addr = await mainnetProvider.resolveName(ens.name);
        if (ens.addr.toLowerCase() === payload.toLowerCase()) {
          try {
            await axios.get(
              `https://metadata.ens.domains/mainnet/avatar/${ens.name}/meta`
            );
            ens.avatar = `https://metadata.ens.domains/mainnet/avatar/${ens.name}`;
          } catch (e) {
            ens.avatar = undefined;
          }
          commit("saveENS", [payload.toLowerCase(), ens]);
          return;
        }
      }
      commit("saveENS", [payload.toLowerCase(), ""]);
    },
    auth({ commit }, payload) {
      commit("auth", payload);
    },
  },
  modules: {
    web3,
  },
  plugins: [vuexLocal.plugin],
});
