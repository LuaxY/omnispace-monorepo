<template>
  <div class="flex gap-5">
    <div v-for="(planet, name) in planets" :key="name">
      <Suspense fallback="Loading...">
        <UiPlanet :name="name" :planet="planet" />
      </Suspense>
    </div>
  </div>
</template>

<script setup>
import planets from "@/planets.json";
</script>
