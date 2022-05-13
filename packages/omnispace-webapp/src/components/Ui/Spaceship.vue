<template>
  <div class="cursor-pointer rounded-md bg-gray-200 p-1 hover:bg-gray-300">
    <div class="text-xs">{{ spaceship.name }}</div>
    <img :src="spaceship.image_data" :alt="spaceship.name" />
  </div>
</template>

<script setup>
import { defineProps } from "vue";

defineProps({
  spaceship: {
    type: Object,
    required: true,
  },
});
</script>
