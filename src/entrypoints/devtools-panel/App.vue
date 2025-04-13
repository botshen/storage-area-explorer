<script lang="ts" setup>
import {
  onMounted,
  watch,
  computed,
  onUnmounted,
  ref,
  getCurrentInstance,
} from "vue";
import type { Component } from "vue";
import { useAppStore } from "./use-app-store";
import { onMessage } from "@/utils/messaging";
import { doChromeStorage } from "@/utils/chrome-storage";

// 导入页面组件
import LocalStoragePage from "./pages/window.localStorage.vue";
import SessionStoragePage from "./pages/window.sessionStorage.vue";
import ChromeLocalStoragePage from "./pages/chrome.storage.local.vue";
import ChromeSyncStoragePage from "./pages/chrome.storage.sync.vue";

const store = useAppStore();
// 将 store 暴露到全局，这样 main.ts 可以访问
const app = getCurrentInstance();
if (app) {
  app.appContext.app.config.globalProperties.$store = store;
}

const currentTab = ref("window.localStorage");

// 添加一个计算属性来过滤 tabs
const isExtensionPage = ref(false);

const tabs = computed(() => {
  const allTabs = [
    "chrome.storage.local",
    "chrome.storage.sync",
    "window.localStorage",
    "window.sessionStorage",
  ];

  return isExtensionPage.value
    ? allTabs
    : allTabs.filter((tab) => !tab.startsWith("chrome.storage"));
});

// 组件映射
const tabComponents: Record<string, Component> = {
  "window.localStorage": LocalStoragePage,
  "window.sessionStorage": SessionStoragePage,
  "chrome.storage.local": ChromeLocalStoragePage,
  "chrome.storage.sync": ChromeSyncStoragePage,
};

const switchTab = (tab: string) => {
  currentTab.value = tab;
};

const {
  getLocalStorage,
  getSessionStorage,
  setChromeStorageData,
  startPolling,
  stopPolling,
} = store;

// 当切换到 localStorage tab 时自动获取数据
watch(currentTab, (newTab) => {
  if (newTab === "window.localStorage") {
    getLocalStorage();
  }
  if (newTab === "window.sessionStorage") {
    getSessionStorage();
  }
  if (newTab === "chrome.storage.local") {
    doChromeStorage("getLocalStorage");
  }
  if (newTab === "chrome.storage.sync") {
    doChromeStorage("getSyncStorage");
  }
});

// 在组件挂载时设置连接和监控
onMounted(() => {
  // 检查当前页面类型
  chrome.devtools.inspectedWindow.eval(
    `location.protocol`,
    (result, isException) => {
      if (isException) {
        console.error("Error checking protocol:", isException);
        return;
      }

      isExtensionPage.value = result === "chrome-extension:";
      // 如果当前选中的是 chrome.storage 相关标签，且不是扩展页面
      if (isExtensionPage.value) {
        currentTab.value = "chrome.storage.local";
      } else {
        currentTab.value = "window.localStorage";
      }
    },
  );
});

// 在组件卸载时停止轮询
onUnmounted(() => {
  stopPolling();
});

// 监听从内容脚本发来的消息
onMessage("sendToDevPanel", (data) => {
  console.log("收到数据:", data.data.detail);
  if (data.data.detail) {
    setChromeStorageData(data.data.detail, data.data.type);
  }
});
</script>

<template>
  <div class="h-full flex flex-col">
    <div role="tablist" class="tabs tabs-box m-2">
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
    <div class="px-2 flex-1">
      <component :is="tabComponents[currentTab]"></component>
    </div>
  </div>
</template>
