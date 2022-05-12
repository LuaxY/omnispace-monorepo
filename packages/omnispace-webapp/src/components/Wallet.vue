<template>
  <Menu as="div" class="relative" v-slot="{ open }" v-if="connected">
    <button
      v-if="
        parseInt($store.state.web3.network, 16) != networkId &&
        $store.state.web3.network != networkId &&
        $store.state.web3.network != ''
      "
      @click="changeNetwork"
      class="flex items-center rounded-full bg-red-500 px-5 py-3 text-base font-medium text-white ring-4 ring-white hover:bg-white hover:text-red-500 hover:ring-red-500"
    >
      <ExclamationIcon class="mr-1 mt-0.5 w-6" />
      Incorrect Network
    </button>
    <MenuButton
      v-else
      class="flex cursor-pointer items-center gap-x-4 whitespace-nowrap rounded-full border-4 border-primary bg-white py-2 px-2"
      :class="ens ? '' : ''"
    >
      <img
        class="w-12 rounded-full"
        :src="ens.avatar"
        :alt="ens.name"
        v-if="ens && ens.avatar"
      />
      <Jazzicon
        :address="address"
        :diameter="ens ? 48 : 32"
        class="inline-block align-middle leading-none"
        v-else
      />
      <div class="flex flex-col justify-start text-left text-primary">
        <div :class="ens ? 'text-lg font-bold' : 'text-lg'">
          {{ ens ? ens.name : _shorten(address) }}
        </div>
        <div class="text-sm font-medium text-neutral-600" v-if="ens">
          {{ _shorten(address) }}
        </div>
      </div>
      <svg
        viewBox="113.868 132.95 286.131 167.05"
        xmlns="http://www.w3.org/2000/svg"
        class="mx-2 w-3 text-primary transition duration-300 ease-out"
        :class="open ? 'rotate-180' : ''"
      >
        <path
          d="M 137.934 132.95 L 375.934 132.95 C 397.334 132.95 408.034 158.85 392.934 173.95 L 273.934 292.95 C 264.534 302.35 249.334 302.35 240.034 292.95 L 120.934 173.95 C 105.834 158.85 116.534 132.95 137.934 132.95 Z"
          fill="currentColor"
        />
      </svg>
    </MenuButton>
    <div v-show="open">
      <MenuItems
        static
        class="bg-back absolute right-0 -mt-24 w-full space-y-5 rounded-xl border-2 border-primary bg-white p-2 pb-4 text-neutral-900 shadow-lg focus:outline-none md:mt-4"
      >
        <div
          class="flex flex-col gap-y-1 rounded-lg border-2 border-primary bg-neutral-100 px-3 py-2"
        >
          <div class="text-left text-xs font-semibold text-neutral-800">
            You hold
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-x-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 32 32"
              >
                <g fill="none" fill-rule="evenodd">
                  <circle cx="16" cy="16" r="16" fill="#627EEA" />
                  <g fill="#FFF" fill-rule="nonzero">
                    <path fill-opacity=".602" d="M16.498 4v8.87l7.497 3.35z" />
                    <path d="M16.498 4L9 16.22l7.498-3.35z" />
                    <path
                      fill-opacity=".602"
                      d="M16.498 21.968v6.027L24 17.616z"
                    />
                    <path d="M16.498 27.995v-6.028L9 17.616z" />
                    <path
                      fill-opacity=".2"
                      d="M16.498 20.573l7.497-4.353-7.497-3.348z"
                    />
                    <path
                      fill-opacity=".602"
                      d="M9 16.22l7.498 4.353v-7.701z"
                    />
                  </g>
                </g>
              </svg>
              <div
                class="font-mono text-lg font-bold slashed-zero lining-nums proportional-nums text-primary"
              >
                {{ _n(balance, "0,0")
                }}<span class="text-neutral-600"
                  ><span v-if="balance == 0">.</span
                  >{{ _n(balance, ".[000000]") }}</span
                >
              </div>
            </div>
            <div class="text-lg font-semibold text-neutral-800">Ξ</div>
          </div>
        </div>
        <div class="space-y-2 px-3">
          <MenuItem>
            <a
              :href="'https://etherscan.io/address/' + address"
              target="_blank"
              class="flex w-full items-center gap-x-1 text-left font-bold hover:text-neutral-600"
            >
              Etherscan <ExternalLinkIcon class="w-4" />
            </a>
          </MenuItem>
          <MenuItem>
            <button
              class="w-full text-left font-bold hover:text-neutral-600"
              @click="$store.dispatch('web3/switch')"
            >
              Switch Wallet
            </button>
          </MenuItem>
          <MenuItem>
            <button
              class="w-full text-left font-bold text-red-500 hover:text-red-400"
              @click="$store.dispatch('web3/logout')"
            >
              Disconnect
            </button>
          </MenuItem>
        </div>
      </MenuItems>
    </div>
  </Menu>
  <div
    v-else
    @click="$store.dispatch('web3/connect')"
    class="flex cursor-pointer items-center gap-x-4 whitespace-nowrap rounded-full border-4 border-white bg-[#5865F2] py-3 px-8 font-bold uppercase text-white shadow-md"
  >
    Connect
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import Jazzicon from "vue3-jazzicon/src/components";
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/vue";
import { ExternalLinkIcon, ExclamationIcon } from "@heroicons/vue/solid";
import { networkId, changeNetwork } from "@/store/modules/web3";

const store = useStore();

store.dispatch("web3/init");

const connected = computed(() => store.state.web3.connected);
const address = computed(() => store.state.web3.address);
const balance = computed(() => store.state.web3.balance);

const ens = computed(() => {
  let ens = store.state.ens[address.value.toLowerCase()];
  if (!ens) {
    store.dispatch("getENS", address.value.toLowerCase());
  }
  return ens;
});
</script>

<style lang="stylus">
.web3modal-modal-lightbox
  z-index 9999 !important
</style>
