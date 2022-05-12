<template>
  <div class="fixed right-0 top-0 z-50 mx-5 mt-2 text-center">
    <div class="mb-4 space-y-2">
      <div v-for="(item, i) in items" :key="i">
        <div
          class="inline-block cursor-pointer rounded-md border-2 bg-white py-2 px-5 sm:max-w-sm"
          :class="colors[item.color]"
          v-if="now < item.timestamp + duration && !item.hide"
          @click="item.hide = true"
        >
          {{ item.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from "vue";
import { useStore } from "vuex";
export default {
  name: "Notifications",
  setup() {
    const store = useStore();
    const now = ref(Date.now());
    const duration = ref(4000);
    const items = computed(() => store.state.notifs);
    const colors = {
      red: "border-red-500 text-red-500",
      orange: "border-orange-500 text-orange-500",
      yellow: "border-yellow-500 text-yellow-500",
      green: "border-green-500 text-green-500",
      blue: "border-blue-500 text-blue-500",
    };
    setInterval(() => (now.value = Date.now()), 1000);
    return {
      items,
      now,
      duration,
      colors,
    };
  },
};
</script>
