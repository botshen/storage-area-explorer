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
      </x-action>
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
