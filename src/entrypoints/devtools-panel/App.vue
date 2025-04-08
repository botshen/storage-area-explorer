<script lang="ts" setup>
import {
  onMounted,
  watch,
  computed,
  onUnmounted,
  ref,
  getCurrentInstance,
} from "vue";
import { useAppStore, type StorageItem } from "./use-app-store";

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
    "chrome.storage.session",
    "window.localStorage",
    "window.sessionStorage",
  ];

  return isExtensionPage.value
    ? allTabs
    : allTabs.filter((tab) => !tab.startsWith("chrome.storage"));
});

const switchTab = (tab: string) => {
  currentTab.value = tab;
};
const {
  localStorageItems,
  sessionStorageItems,
  getLocalStorage,
  getSessionStorage,
  startPolling,
  stopPolling,
} = store;

// 当切换到 localStorage tab 时自动获取数据
watch(currentTab, (newTab) => {
  console.log("Tab changed to:", newTab);
  if (newTab === "window.localStorage") {
    getLocalStorage();
  }
  if (newTab === "window.sessionStorage") {
    getSessionStorage();
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
      console.log("Protocol check result:", result);
      isExtensionPage.value = result === "chrome-extension:";
      // 如果当前选中的是 chrome.storage 相关标签，且不是扩展页面
      if (
        !isExtensionPage.value &&
        currentTab.value.startsWith("chrome.storage")
      ) {
        currentTab.value = "window.localStorage";
      }
    },
  );

  getLocalStorage();
  getSessionStorage();

  // 启动轮询
  startPolling();
});

// 在组件卸载时停止轮询
onUnmounted(() => {
  stopPolling();
});

// 添加编辑相关的状态和方法
const editingItem = ref<StorageItem>({
  id: 0,
  key: "",
  value: "",
});

// 添加编辑状态控制
const isEditing = ref(false);

const openEdit = (item: StorageItem) => {
  editingItem.value = { ...item };
  isEditing.value = true;
};

const cancelEdit = () => {
  isEditing.value = false;
};

const saveEdit = () => {
  // 保存编辑后的值
  const { key, value } = editingItem.value;

  chrome.devtools.inspectedWindow.eval(
    `
    (function() {
      try {
        if (${currentTab.value === "window.localStorage"}) {
          localStorage.setItem('${key}', '${value.replace(/'/g, "\\'")}');
          return true;
        } else if (${currentTab.value === "window.sessionStorage"}) {
          sessionStorage.setItem('${key}', '${value.replace(/'/g, "\\'")}');
          return true;
        }
        return false;
      } catch (e) {
        console.error('保存失败:', e);
        return false;
      }
    })()
    `,
    (result, isException) => {
      if (isException || !result) {
        console.error("保存失败:", isException);
      } else {
        // 更新成功 - 监控会自动捕获变更
        console.log("保存成功");
      }
      isEditing.value = false;
    },
  );
};

// 添加删除功能
const deleteItem = (item: StorageItem) => {
  const { key } = item;

  chrome.devtools.inspectedWindow.eval(
    `
    (function() {
      try {
        if (${currentTab.value === "window.localStorage"}) {
          localStorage.removeItem('${key}');
          return true;
        } else if (${currentTab.value === "window.sessionStorage"}) {
          sessionStorage.removeItem('${key}');
          return true;
        }
        return false;
      } catch (e) {
        console.error('删除失败:', e);
        return false;
      }
    })()
    `,
    (result, isException) => {
      if (isException || !result) {
        console.error("删除失败:", isException);
      } else {
        // 删除成功 - 监控会自动捕获变更
        console.log("删除成功");
      }
    },
  );
};

// 添加清空功能
const clearStorage = () => {
  // 根据当前标签页类型清空对应的存储
  chrome.devtools.inspectedWindow.eval(
    `
    (function() {
      try {
        if (${currentTab.value === "window.localStorage"}) {
          localStorage.clear();
          return true;
        } else if (${currentTab.value === "window.sessionStorage"}) {
          sessionStorage.clear();
          return true;
        }
        return false;
      } catch (e) {
        console.error('清空失败:', e);
        return false;
      }
    })()
    `,
    (result, isException) => {
      if (isException || !result) {
        console.error("清空失败:", isException);
      } else {
        // 清空成功 - 监控会自动捕获变更
        console.log("清空成功");
      }
    },
  );
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
    </div>

    <div v-else-if="currentTab === 'chrome.storage.session'">
      <h2 class="text-xl font-bold mb-4">Chrome Storage Session</h2>
      <!-- chrome.storage.session 的具体内容 -->
    </div>

    <div v-else-if="currentTab === 'window.localStorage'">
      <!-- window.localStorage 的具体内容 -->
      <x-action class="flex items-center gap-1">
        <button class="btn btn-xs bg-[#3d7fbf] text-white border-none">
          Add item
        </button>
        <button
          class="btn btn-xs bg-[#eca451] text-white border-none"
          @click="clearStorage"
        >
          Clear
        </button>
        <button class="btn btn-xs bg-[#71bedc] text-white border-none">
          Export
        </button>
        <button class="btn btn-xs bg-[#71bedc] text-white border-none">
          Import
        </button>
      </x-action>
      <!-- 编辑界面 -->
      <div v-if="isEditing" class="mt-4 px-1 pr-4">
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Key</span>
          </label>
          <input
            type="text"
            class="input input-bordered w-full"
            v-model="editingItem.key"
          />
        </div>
        <div class="form-control w-full mt-4">
          <label class="label">
            <span class="label-text">Value</span>
          </label>
          <textarea
            class="textarea textarea-bordered w-full h-32"
            v-model="editingItem.value"
          ></textarea>
        </div>
        <div class="mt-4 flex gap-2">
          <button class="btn btn-sm" @click="cancelEdit">取消</button>
          <button class="btn btn-sm btn-primary" @click="saveEdit">保存</button>
        </div>
      </div>

      <!-- 表格界面 -->
      <table v-else class="table table-zebra table-xs">
        <thead>
          <tr class="text-xs font-bold text-black">
            <th>Key</th>
            <th>Value</th>
            <th class="w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in localStorageItems"
            :key="item.id"
            class="hover:bg-base-300"
          >
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
                @click="openEdit(item)"
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
                @click="deleteItem(item)"
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
    </div>

    <div v-else-if="currentTab === 'window.sessionStorage'">
      <!-- window.sessionStorage 的具体内容 -->
      <x-action class="flex items-center gap-1">
        <button class="btn btn-xs bg-[#3d7fbf] text-white border-none">
          Add item
        </button>
        <button
          class="btn btn-xs bg-[#eca451] text-white border-none"
          @click="clearStorage"
        >
          Clear
        </button>
        <button class="btn btn-xs bg-[#71bedc] text-white border-none">
          Export
        </button>
        <button class="btn btn-xs bg-[#71bedc] text-white border-none">
          Import
        </button>
      </x-action>
      <!-- 编辑界面 -->
      <div v-if="isEditing" class="mt-4 px-1 pr-4">
        <div class="form-control w-full">
          <label class="label">
            <span class="label-text">Key</span>
          </label>
          <input
            type="text"
            class="input input-bordered w-full"
            v-model="editingItem.key"
          />
        </div>
        <div class="form-control w-full mt-4">
          <label class="label">
            <span class="label-text">Value</span>
          </label>
          <textarea
            class="textarea textarea-bordered w-full h-32"
            v-model="editingItem.value"
          ></textarea>
        </div>
        <div class="mt-4 flex gap-2">
          <button class="btn btn-sm" @click="cancelEdit">取消</button>
          <button class="btn btn-sm btn-primary" @click="saveEdit">保存</button>
        </div>
      </div>

      <!-- 表格界面 -->
      <table v-else class="table table-zebra table-xs">
        <thead>
          <tr class="text-xs font-bold text-black">
            <th>Key</th>
            <th>Value</th>
            <th class="w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in sessionStorageItems"
            :key="item.id"
            class="hover:bg-base-300"
          >
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
                @click="openEdit(item)"
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
                @click="deleteItem(item)"
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
    </div>
  </div>
</template>
