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
  value: string | number | boolean | undefined;
}

// 存储类型的枚举
export enum StorageType {
  LOCAL_STORAGE = "localStorage",
  SESSION_STORAGE = "sessionStorage",
  CHROME_LOCAL = "chrome.storage.local",
  CHROME_SESSION = "chrome.storage.session",
}

import { ref } from "vue";

// 存储状态
const localStorageItems = ref<StorageItem[]>([]);
const sessionStorageItems = ref<StorageItem[]>([]);
const chromeLocalStorageItems = ref<StorageItem[]>([]);
const chromeSessionStorageItems = ref<StorageItem[]>([]);

// 获取 localStorage 数据
const getLocalStorage = () => {
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
      localStorageItems.value = storageItems;
    },
  );
};

// 获取 sessionStorage 数据
const getSessionStorage = () => {
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
      sessionStorageItems.value = storageItems;
    },
  );
};

// 设置 Chrome Storage 数据
const setChromeStorageData = (data: any, type: string) => {
  if (!data) return;
  console.log("dat=====a", data);
  // 处理 chrome.storage.local 数据
  if (type === "local") {
    const storageItems: StorageItem[] = Object.entries(data).map(
      ([key, value], index) => ({
        id: index + 1,
        key,
        value: value as string | number | boolean | undefined,
      }),
    );
    chromeLocalStorageItems.value = storageItems;
  }

  // 处理 chrome.storage.sync 数据
  if (type === "sync") {
    const storageItems: StorageItem[] = Object.entries(data).map(
      ([key, value], index) => ({
        id: index + 1,
        key,
        value: value as string | number | boolean | undefined,
      }),
    );
    chromeSessionStorageItems.value = storageItems;
  }
};

let pollIntervalId: number | null = null;

// 设置轮询来检测变化
const startPolling = () => {
  // 清除之前的轮询
  if (pollIntervalId !== null) {
    clearInterval(pollIntervalId);
  }

  // 每500毫秒轮询一次
  pollIntervalId = setInterval(() => {
    getLocalStorage();
    getSessionStorage();
  }, 2000) as unknown as number;
};

// 停止轮询
const stopPolling = () => {
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
    chromeLocalStorageItems,
    chromeSessionStorageItems,
    setChromeStorageData,
    startPolling,
    stopPolling,
  };
};
