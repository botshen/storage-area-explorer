<script lang="ts" setup>
const currentTab = ref("chrome.storage.local");

const tabs = [
  "chrome.storage.local",
  "chrome.storage.session",
  "window.localStorage",
  "window.sessionStorage",
];

const switchTab = (tab: string) => {
  currentTab.value = tab;
};

interface StorageItem {
  id: number;
  key: string;
  value: string;
}

const items = ref<StorageItem[]>([
  {
    id: 1,
    key: "USER_AGENT_BROWSER_MAJOR_VERSION",
    value: "Quality Control Specialist",
  },
  {
    id: 2,
    key: "Hart Hagerty",
    value: "Desktop Support Technician",
  },
  {
    id: 3,
    key: "Brice Swyre",
    value: "Tax Accountant",
  },
  {
    id: 4,
    key: "Brice Swyre",
    value: "Tax Accountant",
  },
]);
</script>

<template>
  <div role="tablist" class="tabs tabs-lift m-2">
    <a
      v-for="tab in tabs"
      :key="tab"
      role="tab"
      class="tab"
      :class="{ 'tab-active': currentTab === tab }"
      @click="switchTab(tab)"
    >
      {{ tab }}
    </a>
  </div>

  <!-- Tab 内容区域 -->
  <div class="pl-2">
    <div v-if="currentTab === 'chrome.storage.local'">
      <!-- chrome.storage.local 的具体内容 -->
      <x-action class="flex items-center gap-1">
        <button class="btn btn-xs bg-[#3d7fbf] text-white border-none">
          Add item
        </button>
        <button class="btn btn-xs bg-[#eca451] text-white border-none">
          Clear
        </button>
        <button class="btn btn-xs bg-[#71bedc] text-white border-none">
          Export
        </button>
        <button class="btn btn-xs bg-[#71bedc] text-white border-none">
          Import
        </button>
      </x-action>
      <table class="table table-zebra table-xs">
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
            <th class="w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id" class="hover:bg-base-300">
            <td class="font-bold">{{ item.key }}</td>
            <td class="w-full">{{ item.value }}</td>
            <td class="flex gap-1">
              <button
                class="btn btn-xs bg-[#3d7fbf] text-white border-none w-6 h-6 min-h-6 p-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-4 h-4"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
                  />
                </svg>
              </button>
              <button
                class="btn btn-xs bg-[#dc7171] text-white border-none w-6 h-6 min-h-6 p-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-4 h-4"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                  />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="currentTab === 'chrome.storage.session'">
      <h2 class="text-xl font-bold mb-4">Chrome Storage Session</h2>
      <!-- chrome.storage.session 的具体内容 -->
    </div>

    <div v-else-if="currentTab === 'window.localStorage'">
      <h2 class="text-xl font-bold mb-4">Window Local Storage</h2>
      <!-- window.localStorage 的具体内容 -->
    </div>

    <div v-else-if="currentTab === 'window.sessionStorage'">
      <h2 class="text-xl font-bold mb-4">Window Session Storage</h2>
      <!-- window.sessionStorage 的具体内容 -->
    </div>
  </div>
</template>
