import { ethers } from "ethers";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Torus from "@toruslabs/torus-embed";
import Portis from "@portis/web3";
import Authereum from "authereum";
import MewConnect from "@myetherwallet/mewconnect-web-client";
import WalletLink from "walletlink";
import networks from "./networks.json";

export const networkId = process.env.VUE_APP_NETWORK_ID;
export const network = networks[networkId];

// /** @type {ethers.providers.JsonRpcProvider} */
// export const mainnetProvider = new ethers.providers.JsonRpcProvider(
//   networks[1].rpc[0]
// );

/** @type {ethers.providers.AlchemyProvider} */
export const mainnetProvider = new ethers.providers.AlchemyProvider(
  networks[1].network,
  "-xZN4CbntuRCIKrOSZgfdxUpV9zG_KtM" // TODO: env var OR networks.json
);

// /** @type {ethers.providers.JsonRpcProvider} */
// export const defaultProvider = new ethers.providers.JsonRpcProvider(
//   network.rpc[0]
// );

/** @type {ethers.providers.AlchemyProvider} */
export const defaultProvider = new ethers.providers.AlchemyProvider(
  network.network,
  "-xZN4CbntuRCIKrOSZgfdxUpV9zG_KtM" // TODO: env var OR networks.json
);

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: process.env.VUE_APP_INFURA_ID,
      rpc: {
        // networkId: network.rpc[0],
      },
    },
  },

  torus: {
    package: Torus,
    options: {
      networkParams: {
        host: network.rpc[0],
        chainId: network.chainId,
        networkId: network.key,
      },
    },
  },

  portis: {
    package: Portis,
    options: {
      id: process.env.VUE_APP_PORTIS_ID,
    },
  },

  authereum: {
    package: Authereum,
  },

  mewconnect: {
    package: MewConnect,
    options: {
      infuraId: process.env.VUE_APP_INFURA_ID,
      rpc: network.rpc[0],
      // network: network.key,
    },
  },

  walletlink: {
    package: WalletLink,
    options: {
      appName: process.env.VUE_APP_NAME,
      infuraId: process.env.VUE_APP_INFURA_ID,
      rpc: network.rpc[0],
      chainId: network.chainId,
      // appLogoUrl: null,
      // darkMode: true,
    },
  },
};

providerOptions.walletconnect.options.rpc[networkId] = network.rpc[0];

export const web3Modal = new Web3Modal({
  network: "mainnet",
  cacheProvider: true,
  providerOptions,
  // theme: {
  //   background: "var(--main-bg)",
  //   main: "var(--main-text)",
  //   secondary: "var(--main-link)",
  //   border: "var(--main-border)",
  //   hover: "var(--main-hover)",
  // },
});

if (!localStorage.getItem("force-refresh")) {
  localStorage.setItem("force-refresh", "true");
  localStorage.removeItem("walletconnect");
  localStorage.removeItem("vuex");
  web3Modal.clearCachedProvider();
}

export let provider = null;
export let web3Provider = null;

export async function changeNetwork() {
  if (!web3Provider) return;

  try {
    await web3Provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ethers.utils.hexValue(network.chainId) }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await web3Provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: ethers.utils.hexValue(network.chainId),
              chainName: network.name,
              nativeCurrency: network.nativeCurrency,
              rpcUrls: [network.publicRpc],
              blockExplorerUrls: [network.explorer],
            },
          ],
        });
      } catch (addError) {
        console.error("wallet_addEthereumChain", addError);
      }
    }
    console.error("wallet_switchEthereumChain", switchError);
  }
}

// initial state
const state = () => ({
  connected: false,
  error: null,
  address: "",
  balance: 0,
  network: "",
  ens: null,
});

// getters
const getters = {};

// actions
const actions = {
  async connect({ commit, dispatch }) {
    web3Provider = await web3Modal.connect();

    web3Provider.on("chainChanged", (chainId) => {
      commit("network", chainId);
      // if (chainId != networkRequired) {
      //   setTimeout(() => {
      //     changeNetwork()
      //   }, 1000)
      // }
      // window.location.reload();
    });

    web3Provider.on("accountsChanged", async (accounts) => {
      if (accounts.length === 0) {
        dispatch("logout");
      } else {
        const signer = provider.getSigner(accounts[0]);
        const network = await provider.getNetwork();
        commit("address", await signer.getAddress());
        commit("balance", ethers.utils.formatEther(await signer.getBalance()));
        commit("network", network.chainId);
        commit("connected", true);
      }
    });

    web3Provider.on("connect", (/*connectInfo*/) => {
      // if (connectInfo.chainId != networkRequired) {
      //   setTimeout(() => {
      //     changeNetwork();
      //   }, 1000);
      // }
    });

    web3Provider.on("disconnect", async (error) => {
      console.error(error);
      dispatch("logout");
    });

    provider = new ethers.providers.Web3Provider(web3Provider, "any");
    const signer = provider.getSigner();
    const network = await provider.getNetwork();
    commit("address", await signer.getAddress());
    commit("balance", ethers.utils.formatEther(await signer.getBalance()));
    commit("network", network.chainId);
    commit("connected", true);
  },

  logout({ commit }) {
    web3Modal.clearCachedProvider();
    // Web3Modal.cachedProvider = "";
    // Web3Modal.removeLocal(Web3Modal.CACHED_PROVIDER_KEY);
    localStorage.removeItem("walletconnect");
    commit("address", "");
    commit("balance", 0);
    commit("error", "");
    commit("network", "");
    commit("ens", "");
    commit("connected", false);
    commit("auth", {}, { root: true });
  },

  switch({ dispatch }) {
    dispatch("logout");
    dispatch("connect");
  },

  init({ dispatch }) {
    if (web3Modal.cachedProvider) {
      dispatch("connect");
    }
  },
};

// mutations
const mutations = {
  connected: function (state, value) {
    state.connected = value;
  },
  error: function (state, value) {
    state.error = value;
  },
  address: function (state, value) {
    state.address = value;
  },
  balance: function (state, value) {
    state.balance = value;
  },
  network: function (state, value) {
    state.network = value;
  },
  ens: function (state, value) {
    state.ens = value;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
