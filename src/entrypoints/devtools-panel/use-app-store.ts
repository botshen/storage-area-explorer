// 添加自定义属性到 Window 接口
declare global {
  interface Window {
    __storageMonitoringSetup?: boolean;
    __storageListenerSetup?: boolean;
    __storagePollingCleanup?: () => void;
  }
}

// 存储项的类型定义
export interface StorageItem {
  id: number;
  key: string;
  value: string;
}

// 存储类型的枚举
export enum StorageType {
  LOCAL_STORAGE = "localStorage",
  SESSION_STORAGE = "sessionStorage",
}

import { ref } from "vue";

// 存储状态
const localStorageItems = ref<StorageItem[]>([]);
const sessionStorageItems = ref<StorageItem[]>([]);
const isMonitoring = ref<boolean>(false);

// 处理 localStorage 更新
const handleLocalStorageUpdate = (key: string | null, value: string | null) => {
  if (key === null && value === null) {
    // clear() 被调用
    localStorageItems.value = [];
  } else if (value === null) {
    // removeItem() 被调用
    localStorageItems.value = localStorageItems.value.filter(
      (item) => item.key !== key,
    );
  } else {
    // setItem() 被调用
    const existingIndex = localStorageItems.value.findIndex(
      (item) => item.key === (key as string),
    );

    if (existingIndex >= 0) {
      // 更新现有项
      localStorageItems.value[existingIndex].value = value;
    } else {
      // 添加新项
      const newId =
        localStorageItems.value.length > 0
          ? Math.max(...localStorageItems.value.map((item) => item.id)) + 1
          : 1;

      localStorageItems.value.push({
        id: newId,
        key: key as string,
        value,
      });
    }
  }
};

// 处理 sessionStorage 更新
const handleSessionStorageUpdate = (
  key: string | null,
  value: string | null,
) => {
  if (key === null && value === null) {
    // clear() 被调用
    sessionStorageItems.value = [];
  } else if (value === null) {
    // removeItem() 被调用
    sessionStorageItems.value = sessionStorageItems.value.filter(
      (item) => item.key !== key,
    );
  } else {
    // setItem() 被调用
    const existingIndex = sessionStorageItems.value.findIndex(
      (item) => item.key === (key as string),
    );

    if (existingIndex >= 0) {
      // 更新现有项
      sessionStorageItems.value[existingIndex].value = value;
    } else {
      // 添加新项
      const newId =
        sessionStorageItems.value.length > 0
          ? Math.max(...sessionStorageItems.value.map((item) => item.id)) + 1
          : 1;

      sessionStorageItems.value.push({
        id: newId,
        key: key as string,
        value,
      });
    }
  }
};

// 获取 localStorage 数据
const getLocalStorage = () => {
  console.log("Getting localStorage...");
  chrome.devtools.inspectedWindow.eval(
    `(function() {
      try {
        const storage = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            storage[key] = localStorage.getItem(key);
          }
        }
        return storage;
      } catch (e) {
        console.error('Error in getLocalStorage:', e);
        return {};
      }
    })()`,
    (result, isException) => {
      if (isException) {
        console.error("Error fetching localStorage:", isException);
        return;
      }

      const storageItems: StorageItem[] = Object.entries(
        result as Record<string, string>,
      ).map(([key, value], index) => ({
        id: index + 1,
        key,
        value: value || "",
      }));
      console.log("localStorage items:", storageItems);
      localStorageItems.value = storageItems;
    },
  );
};

// 获取 sessionStorage 数据
const getSessionStorage = () => {
  console.log("Getting sessionStorage...");
  chrome.devtools.inspectedWindow.eval(
    `(function() {
      try {
        const storage = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            storage[key] = sessionStorage.getItem(key);
          }
        }
        return storage;
      } catch (e) {
        console.error('Error in getSessionStorage:', e);
        return {};
      }
    })()`,
    (result, isException) => {
      if (isException) {
        console.error("Error fetching sessionStorage:", isException);
        return;
      }

      const storageItems: StorageItem[] = Object.entries(
        result as Record<string, string>,
      ).map(([key, value], index) => ({
        id: index + 1,
        key,
        value: value || "",
      }));
      console.log("sessionStorage items:", storageItems);
      sessionStorageItems.value = storageItems;
    },
  );
};

let pollIntervalId: number | null = null;

// 设置轮询来检测变化
const startPolling = () => {
  console.log("Starting polling...");
  // 清除之前的轮询
  if (pollIntervalId !== null) {
    clearInterval(pollIntervalId);
  }

  // 每500毫秒轮询一次
  pollIntervalId = setInterval(() => {
    console.log("Polling...");
    getLocalStorage();
    getSessionStorage();
  }, 500) as unknown as number;
};

// 停止轮询
const stopPolling = () => {
  console.log("Stopping polling...");
  if (pollIntervalId !== null) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
};

export const useAppStore = () => {
  return {
    getLocalStorage,
    getSessionStorage,
    localStorageItems,
    sessionStorageItems,
    startPolling,
    stopPolling,
  };
};
