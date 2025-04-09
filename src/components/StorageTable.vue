<script lang="ts" setup>
import type { StorageItem } from "../entrypoints/devtools-panel/use-app-store";

defineProps<{
  items: StorageItem[];
}>();

const emit = defineEmits<{
  (e: "edit", item: StorageItem): void;
  (e: "delete", item: StorageItem): void;
}>();
</script>

<template>
  <table class="table table-zebra table-xs">
    <thead>
      <tr class="text-xs font-bold text-black">
        <th>Key</th>
        <th>Value</th>
        <th class="w-20">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in items" :key="item.id" class="hover:bg-base-300">
        <td class="font-bold">{{ item.key }}</td>
        <td
          :title="item.value"
          class="w-full max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap truncate"
        >
          {{ item.value }}
        </td>
        <td class="flex gap-1">
          <button
            class="btn btn-square btn-xs bg-[#3d7fbf] text-white border-none h-[18px] w-[18px]"
            @click="emit('edit', item)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              class="w-3 h-3"
            >
              <path
                fill="currentColor"
                d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456l-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"
              />
            </svg>
          </button>
          <button
            class="btn btn-square btn-xs bg-[#cd5b54] text-white border-none h-[18px] w-[18px]"
            @click="emit('delete', item)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              class="w-3 h-3"
            >
              <path
                fill="currentColor"
                d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"
              />
              <path
                fill="currentColor"
                d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"
              />
            </svg>
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>
