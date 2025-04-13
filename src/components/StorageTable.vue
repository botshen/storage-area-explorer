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
  <table class="w-full text-xs table-zebra my-2">
    <thead>
      <tr class="bg-gray-100">
        <th class="p-2 text-left font-bold text-gray-700 whitespace-nowrap">
          Key
        </th>
        <th class="p-2 text-left font-bold text-gray-700">Value</th>
        <th class="p-2 text-left font-bold text-gray-700 w-20">Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="item in items"
        :key="item.id"
        class="border-t border-gray-200 hover:bg-gray-50"
      >
        <td class="px-2 whitespace-nowrap font-bold text-black">
          {{ item.key }}
        </td>
        <td class="w-full max-w-[300px] truncate">
          <x-string
            class="block text-[#008000]"
            v-if="typeof item.value === 'string'"
          >
            "{{ item.value }}"
          </x-string>
          <x-number
            class="block text-[#800000]"
            v-else-if="typeof item.value === 'number'"
          >
            {{ item.value }}
          </x-number>
          <x-boolean v-else-if="typeof item.value === 'boolean'">
            {{ item.value }}
          </x-boolean>
          <x-object v-else>
            {{ item.value }}
          </x-object>
        </td>
        <td class="p-2">
          <div class="flex gap-2">
            <button
              class="p-1 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              @click="emit('edit', item)"
              title="Edit"
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
              class="p-1 rounded bg-red-600 text-white hover:bg-red-700 transition-colors"
              @click="emit('delete', item)"
              title="Delete"
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
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>
