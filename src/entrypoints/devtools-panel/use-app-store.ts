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

// 注入监控脚本以实时监控 localStorage 和 sessionStorage 的变化
const setupStorageMonitoring = () => {
  if (isMonitoring.value) return;

  chrome.devtools.inspectedWindow.eval(
    `
    (function() {
      // 防止重复注入
      if (window.__storageMonitoringSetup) return true;
      
      // 创建一个自定义事件用于向 devtools 发送变更
      const sendStorageUpdate = (storageType, key, value) => {
        window.dispatchEvent(new CustomEvent('__storageAreaUpdate', {
          detail: { storageType, key, value }
        }));
      };
      
      // 使用 Proxy 代理 localStorage
      const originalLocalStorage = window.localStorage;
      const localStorageProxy = new Proxy(originalLocalStorage, {
        get(target, prop) {
          const value = Reflect.get(target, prop);
          
          if (typeof value === 'function') {
            return function(...args) {
              const result = value.apply(target, args);
              
              // 只拦截修改类方法
              if (['setItem', 'removeItem', 'clear'].includes(prop)) {
                if (prop === 'setItem') {
                  sendStorageUpdate('localStorage', args[0], args[1]);
                } else if (prop === 'removeItem') {
                  sendStorageUpdate('localStorage', args[0], null);
                } else if (prop === 'clear') {
                  sendStorageUpdate('localStorage', null, null);
                }
              }
              
              return result;
            };
          }
          
          return value;
        },
        // 添加 set 拦截器，处理直接赋值情况
        set(target, prop, value) {
          // 对索引属性或直接赋值进行拦截
          if (typeof prop === 'string' && prop !== 'length' && !prop.startsWith('__')) {
            // 执行原始设置操作
            const result = Reflect.set(target, prop, value);
            // 发送更新通知
            sendStorageUpdate('localStorage', prop, value);
            return result;
          }
          return Reflect.set(target, prop, value);
        }
      });
      
      // 使用 Proxy 代理 sessionStorage
      const originalSessionStorage = window.sessionStorage;
      const sessionStorageProxy = new Proxy(originalSessionStorage, {
        get(target, prop) {
          const value = Reflect.get(target, prop);
          
          if (typeof value === 'function') {
            return function(...args) {
              const result = value.apply(target, args);
              
              if (['setItem', 'removeItem', 'clear'].includes(prop)) {
                if (prop === 'setItem') {
                  sendStorageUpdate('sessionStorage', args[0], args[1]);
                } else if (prop === 'removeItem') {
                  sendStorageUpdate('sessionStorage', args[0], null);
                } else if (prop === 'clear') {
                  sendStorageUpdate('sessionStorage', null, null);
                }
              }
              
              return result;
            };
          }
          
          return value;
        },
        // 添加 set 拦截器，处理直接赋值情况
        set(target, prop, value) {
          // 对索引属性或直接赋值进行拦截
          if (typeof prop === 'string' && prop !== 'length' && !prop.startsWith('__')) {
            // 执行原始设置操作
            const result = Reflect.set(target, prop, value);
            // 发送更新通知
            sendStorageUpdate('sessionStorage', prop, value);
            return result;
          }
          return Reflect.set(target, prop, value);
        }
      });
      
      // 覆盖原始的 Storage 对象
      Object.defineProperty(window, 'localStorage', {
        value: localStorageProxy
      });
      
      Object.defineProperty(window, 'sessionStorage', {
        value: sessionStorageProxy
      });
      
      // 添加事件监听器用于内容脚本捕获
      window.__storageMonitoringSetup = true;
      return true;
    })()
    `,
    (result, isException) => {
      if (isException) {
        console.error("无法设置存储监控:", isException);
        return;
      }

      if (result) {
        isMonitoring.value = true;
        console.log("存储监控已成功设置");

        // 初始获取当前的存储数据
        getLocalStorage();
        getSessionStorage();

        // 设置内容脚本的消息监听器
        setupContentScriptListener();
      }
    },
  );
};

// 设置与内容脚本的通信
const setupContentScriptListener = () => {
  // 向内容脚本注入事件监听器
  chrome.devtools.inspectedWindow.eval(
    `
    (function() {
      // 防止重复注入
      if (window.__storageListenerSetup) return;
      
      window.addEventListener('__storageAreaUpdate', function(event) {
        // 使用 chrome.runtime.sendMessage 将消息发送到扩展
        const message = {
          type: 'storageUpdate',
          data: event.detail
        };
        
        // 将事件数据作为自定义属性附加到文档上
        // 这样内容脚本可以读取它
        const customEvent = new CustomEvent('__sendToContentScript', {
          detail: message
        });
        document.dispatchEvent(customEvent);
      });
      
      window.__storageListenerSetup = true;
    })()
    `,
    (result, isException) => {
      if (isException) {
        console.error("无法设置内容脚本监听器:", isException);
      }
    },
  );

  // 监听从后台脚本发送过来的消息
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "storageUpdate") {
      const { storageType, key, value } = message.data;

      if (storageType === StorageType.LOCAL_STORAGE) {
        handleLocalStorageUpdate(key, value);
      } else if (storageType === StorageType.SESSION_STORAGE) {
        handleSessionStorageUpdate(key, value);
      }
    }
  });
};

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
