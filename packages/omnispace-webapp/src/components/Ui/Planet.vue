<template>
  <div
    class="flex w-96 flex-col gap-y-5 rounded-md border-4 bg-white p-5"
    :style="{ 'border-color': planet.color }"
  >
    <div>
      <div>🌎 {{ name }}</div>
      <div>
        <a :href="explorer + '/address/' + planet.address" target="_blank">
          🔗 {{ _shorten(planet.address) }}
        </a>
      </div>
    </div>
    <div class="flex items-center gap-x-5">
      <button
        @click="build"
        class="rounded-md border border-gray-400 bg-gray-200 px-4 py-2 font-medium uppercase hover:bg-gray-300"
      >
        ⚙️ Build a spaceship
      </button>
      <span v-if="loader" class="flex items-center">
        <svg
          class="-ml-1 mr-3 h-5 w-5 animate-spin text-gray-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        LOADING...
      </span>
    </div>
    <div v-if="!Array.from(spaceships.keys()).length">No spaceships...</div>
    <div class="grid grid-cols-3 gap-2" v-else>
      <UiSpaceship
        v-for="[i, spaceship] in spaceships"
        :key="i"
        :spaceship="spaceship"
        @click="openLauncher(i)"
      />
    </div>
    <Dialog :open="isOpen" @close="isOpen = false" class="relative z-50">
      <div class="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div class="fixed inset-0 flex items-center justify-center text-center">
        <DialogPanel class="w-full max-w-sm rounded bg-white p-5">
          <DialogTitle class="mb-5 text-xl font-bold">
            Space Launcher
          </DialogTitle>
          Send <b>{{ currentSpaceship.name }}</b> to
          <select v-model="selectedPlanet">
            <option
              v-for="(planet, i) in availablePlanets"
              :key="i"
              :value="planet"
            >
              {{ planet }}
            </option>
          </select>
          <div>
            <button
              @click="hypersapceJump(currentSpaceship.id, selectedPlanet)"
              class="mt-5 rounded-md border border-gray-400 bg-gray-200 px-4 py-2 font-medium uppercase hover:bg-gray-300"
            >
              🚀 Hyperspace jump
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, defineProps, onUnmounted } from "vue";
import { ethers } from "ethers";
import { decode } from "js-base64";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/vue";
import networks from "@/store/modules/networks.json";
import planets from "@/planets.json";
import OmnispaceJSON from "../../../../omnispace-contracts/artifacts/contracts/Omnispace.sol/Omnispace.json";

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  planet: {
    type: Object,
    required: true,
  },
});

const availablePlanets = Object.keys(planets).filter((p) => p != props.name);
const selectedPlanet = ref(availablePlanets[0]);

const loader = ref(false);
const isOpen = ref(false);

const network = networks[props.planet.chainId];
const explorer = network.explorer;

const spaceships = ref(new Map());
const currentSpaceship = ref({});

/** @type {ethers.providers.JsonRpcProvider} */
const provider = new ethers.providers.JsonRpcProvider(network.rpc[0]);
const signer = new ethers.Wallet(
  process.env.VUE_APP_WALLET_PRIVATE_KEY,
  provider
);

const instance = new ethers.Contract(
  props.planet.address,
  OmnispaceJSON.abi,
  signer
);

const build = () => {
  loader.value = true;
  instance
    .build()
    .then((tx) => {
      console.log("BUILD TX", tx);
      tx.wait()
        .then((receipt) => {
          console.log("BUILD RECEIPT", receipt);
          loader.value = false;
        })
        .catch((error) => {
          console.log("BUILD ERROR WAIT", error);
          loader.value = false;
        });
    })
    .catch((error) => {
      console.log("BUILD ERROR TX", error);
      loader.value = false;
    });
};

const getSpaceship = async (id) => {
  let tokenURI;
  try {
    tokenURI = await instance.tokenURI(id);
    // eslint-disable-next-line no-empty
  } catch (e) {
    // no token found, ignore error
  }

  if (tokenURI && tokenURI != "") {
    const decoded = decode(
      String(tokenURI).replace("data:application/json;base64,", "")
    );
    return JSON.parse(decoded);
  }
  return "";
};

const openLauncher = (id) => {
  currentSpaceship.value = spaceships.value.get(id);
  currentSpaceship.value.id = id;
  isOpen.value = true;
};

const hypersapceJump = async (id, planet) => {
  isOpen.value = false;
  const estimatedGas = await instance.estimateHyperspaceJump(
    planets[planet].lzId,
    id
  );
  console.log(
    id,
    planet,
    planets[planet].lzId,
    ethers.utils.formatEther(estimatedGas)
  );
  loader.value = true;
  instance
    .hyperspaceJump(planets[planet].lzId, id, {
      value: estimatedGas.mul(2),
    })
    .then((tx) => {
      console.log("JUMP TX", tx);
      tx.wait()
        .then((receipt) => {
          console.log("JUMP RECEIPT", receipt);
          loader.value = false;
        })
        .catch((error) => {
          console.log("JUMP ERROR WAIT", error);
          loader.value = false;
        });
    })
    .catch((error) => {
      console.log("JUMP ERROR TX", error);
      loader.value = false;
    });
};

const ids = [];
[...Array(10)].forEach((e, i) => ids.push(++i));
[...Array(10)].forEach((e, i) => ids.push(++i + 2000));
[...Array(10)].forEach((e, i) => ids.push(++i + 3000));

ids.forEach(async (id) => {
  const result = await getSpaceship(id);
  if (result && result != "") {
    spaceships.value.set(id, result);
  }
});

instance.on("Transfer", async (from, to, id) => {
  console.log("TRANSFER", props.name, from, to, id.toNumber());
  if (to == "0x0000000000000000000000000000000000000000") {
    spaceships.value.delete(id.toNumber());
  } else {
    const result = await getSpaceship(id.toNumber());
    if (result && result != "") {
      spaceships.value.set(id.toNumber(), result);
    }
  }
});

onUnmounted(() => {
  instance.removeAllListeners();
});
</script>
