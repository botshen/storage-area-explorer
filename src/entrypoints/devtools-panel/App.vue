<script lang="ts" setup>
import {
  onMounted,
  watch,
  computed,
  onUnmounted,
  ref,
  getCurrentInstance,
  toRaw,
} from "vue";
import { useAppStore, type StorageItem } from "./use-app-store";
import StorageActions from "../../components/StorageActions.vue";
import StorageTable from "../../components/StorageTable.vue";
import StorageEditForm from "../../components/StorageEditForm.vue";
import StorageAddForm from "../../components/StorageAddForm.vue";
import { InjectionService } from "@/utils/injection";
import { storageHookScript } from "@/utils/storage-hook";
import { onMessage } from "@/utils/messaging";

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
  chromeLocalStorageItems,
  chromeSessionStorageItems,
  setChromeStorageData,
  getLocalStorage,
  getSessionStorage,
  startPolling,
  stopPolling,
} = store;

// 用于显示警告信息的函数
const showAlert = (message: string) => {
  // 避免使用 window.alert 来绕过类型检查问题
  // eslint-disable-next-line no-alert
  alert(message);
};

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

  // getLocalStorage();
  // getSessionStorage();

  // // 启动轮询
  // startPolling();
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
      }
      isEditing.value = false;
    },
  );
};

// 添加删除功能
const deleteItem = (item: StorageItem) => {
  const { key } = item;

  if (
    currentTab.value === "chrome.storage.local" ||
    currentTab.value === "chrome.storage.session"
  ) {
    showAlert("注意：Chrome Storage 目前仅支持查看，不支持编辑和删除操作");
    return;
  }

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
      }
    },
  );
};

// 添加清空功能
const clearStorage = () => {
  if (
    currentTab.value === "chrome.storage.local" ||
    currentTab.value === "chrome.storage.session"
  ) {
    showAlert("注意：Chrome Storage 目前仅支持查看，不支持编辑和删除操作");
    return;
  }

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
      }
    },
  );
};

// 添加新的状态控制
const isAdding = ref(false);

const addItem = () => {
  isAdding.value = true;
};

const cancelAdd = () => {
  isAdding.value = false;
};
const doChromeStorage = async (type: string, data?: any) => {
  try {
    // 获取扩展的URL
    const extensionURL = chrome.runtime.getURL("");
    // URL格式为: chrome-extension://<extensionId>/
    const extensionId = extensionURL.split("/")[2];

    console.log("Extension ID:", extensionId);

    // 检查当前页面是否是扩展页面
    chrome.devtools.inspectedWindow.eval(
      `location.protocol === 'chrome-extension:'`,
      async (result, isException) => {
        if (isException) {
          console.error("检查页面类型时出错:", isException);
          return;
        }

        if (!result) {
          console.warn("当前页面不是扩展页面，无法访问chrome.storage.local");
          showAlert("注意：只有在检查扩展页面时才能访问chrome.storage.local");
          return;
        }

        try {
          const injectionService = new InjectionService();
          console.log("type", type);
          console.log("data", data);
          const xx = toRaw(data);
          let _data = "";
          if (xx) {
            _data = JSON.stringify(xx);
          }
          console.log("_data", _data);
          const params = {
            EXTENSION_DETAIL_TYPE: `'${type}'`,
            EXTENSION_DETAIL_DATA: `'${_data}'`,
            EXTENSION_ID_PLACEHOLDER: `'${extensionId}'`,
          };
          await injectionService.evalInInspectedWindow(
            storageHookScript.toString(),
            params,
          );
          console.log("注入脚本成功执行");
        } catch (error) {
          console.error("注入脚本执行失败:", error);
          showAlert("获取chrome.storage.local失败，请查看控制台了解详情");
        }
      },
    );
  } catch (error) {
    console.error("获取chrome.storage.local时出错:", error);
    showAlert("获取chrome.storage.local失败，请查看控制台了解详情");
  }
};
const saveNewItem = (item: StorageItem) => {
  console.log("currentTab.value", currentTab.value);
  if (currentTab.value === "chrome.storage.local") {
    doChromeStorage("setLocalStorage", item);
  } else if (currentTab.value === "chrome.storage.sync") {
    doChromeStorage("setSyncStorage", item);
  } else {
    chrome.devtools.inspectedWindow.eval(
      `
    (function() {
      try {
        if (${currentTab.value === "window.localStorage"}) {
          localStorage.setItem('${item.key}', '${item.value.replace(/'/g, "\\'")}');
          return true;
        } else if (${currentTab.value === "window.sessionStorage"}) {
          sessionStorage.setItem('${item.key}', '${item.value.replace(/'/g, "\\'")}');
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
          // 保存成功 - 监控会自动捕获变更
          isAdding.value = false;
        }
      },
    );
  }
};

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
    <div class="pl-2 flex-1">
      <div v-if="currentTab === 'chrome.storage.local'">
        <!-- chrome.storage.local 的具体内容 -->
        <div class="flex flex-col h-full">
          <StorageActions @add="addItem" @clear="clearStorage" />
          <!-- 添加界面 -->
          <StorageAddForm
            v-if="isAdding"
            @save="saveNewItem"
            @cancel="cancelAdd"
          />

          <!-- 编辑界面 -->
          <StorageEditForm
            v-else-if="isEditing"
            v-model:item="editingItem"
            @save="saveEdit"
            @cancel="cancelEdit"
          />
          <!-- 表格界面 -->
          <StorageTable
            v-else
            :items="chromeLocalStorageItems"
            @edit="() => showAlert('Chrome Storage 目前仅支持查看')"
            @delete="() => showAlert('Chrome Storage 目前仅支持查看')"
          />
        </div>
      </div>

      <div v-else-if="currentTab === 'chrome.storage.session'">
        <div class="flex flex-col h-full">
          <StorageActions @add="addItem" @clear="clearStorage" />

          <!-- 表格界面 -->
          <StorageTable
            :items="chromeSessionStorageItems"
            @edit="() => showAlert('Chrome Storage 目前仅支持查看')"
            @delete="() => showAlert('Chrome Storage 目前仅支持查看')"
          />
        </div>
      </div>

      <div v-else-if="currentTab === 'window.localStorage'" class="h-full">
        <!-- window.localStorage 的具体内容 -->
        <StorageActions @add="addItem" @clear="clearStorage" />

        <!-- 添加界面 -->
        <StorageAddForm
          v-if="isAdding"
          @save="saveNewItem"
          @cancel="cancelAdd"
        />

        <!-- 编辑界面 -->
        <StorageEditForm
          v-else-if="isEditing"
          v-model:item="editingItem"
          @save="saveEdit"
          @cancel="cancelEdit"
        />

        <!-- 表格界面 -->
        <StorageTable
          v-else
          :items="localStorageItems"
          @edit="openEdit"
          @delete="deleteItem"
        />
      </div>

      <div v-else-if="currentTab === 'window.sessionStorage'">
        <!-- window.sessionStorage 的具体内容 -->
        <StorageActions @add="addItem" @clear="clearStorage" />

        <!-- 添加界面 -->
        <StorageAddForm
          v-if="isAdding"
          @save="saveNewItem"
          @cancel="cancelAdd"
        />

        <!-- 编辑界面 -->
        <StorageEditForm
          v-else-if="isEditing"
          v-model:item="editingItem"
          @save="saveEdit"
          @cancel="cancelEdit"
        />

        <!-- 表格界面 -->
        <StorageTable
          v-else
          :items="sessionStorageItems"
          @edit="openEdit"
          @delete="deleteItem"
        />
      </div>
    </div>
  </div>
</template>
