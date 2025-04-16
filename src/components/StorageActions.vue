<script lang="ts" setup>
const emit = defineEmits<{
  (e: "add"): void;
  (e: "clear"): void;
}>();
</script>

<template>
  <div class="flex items-center gap-1 mb-2">
    <button
      class="btn btn-xs bg-[#3d7fbf] text-white border-none"
      @click="emit('add')"
    >
      Add item
    </button>
    <button
      class="btn btn-xs bg-[#eca451] text-white border-none"
      @click="emit('clear')"
    >
      Clear
    </button>
    <!-- <button class="btn btn-xs bg-[#71bedc] text-white border-none">
      Export
    </button>
    <button class="btn btn-xs bg-[#71bedc] text-white border-none">
      Import
    </button> -->
  </div>
</template>
