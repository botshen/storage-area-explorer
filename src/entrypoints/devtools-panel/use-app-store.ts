// 添加自定义属性到 Window 接口
declare global {
  interface Window {
    __storageMonitoringSetup?: boolean;
    __storageListenerSetup?: boolean;
    __storagePollingCleanup?: () => void;
  }
}

export interface StorageItem {
  id: number;
  key: string;
  value: string;
}

import { ref } from "vue";

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

        // 启动轮询机制
        const cleanupPolling = setupPollingForSpecialKeys();

        // 添加清理功能
        window.__storagePollingCleanup = cleanupPolling;
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

      if (storageType === "localStorage") {
        handleLocalStorageUpdate(key, value);
      } else if (storageType === "sessionStorage") {
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

const getLocalStorage = () => {
  chrome.devtools.inspectedWindow.eval(
    `(function() {
      const storage = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          storage[key] = localStorage.getItem(key);
        }
      }
      return storage;
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
      console.log("storageItems", storageItems);
      localStorageItems.value = storageItems;
    },
  );
};

const getSessionStorage = () => {
  chrome.devtools.inspectedWindow.eval(
    `(function() {
      const storage = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          storage[key] = sessionStorage.getItem(key);
        }
      }
      return storage;
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
      console.log("storageItems", storageItems);
      sessionStorageItems.value = storageItems;
    },
  );
};

// 添加主动轮询重要存储项的函数
const setupPollingForSpecialKeys = () => {
  // 存储上一次值的缓存
  const lastValues: Record<string, string> = {};

  // 初始化上一次的所有localStorage的值
  chrome.devtools.inspectedWindow.eval(
    `(function() {
      const result = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          result[key] = localStorage.getItem(key);
        }
      }
      return result;
    })()`,
    (result, isException) => {
      if (!isException && result) {
        Object.assign(lastValues, result);
      }
    },
  );

  // 设置定期轮询
  const pollInterval = setInterval(() => {
    chrome.devtools.inspectedWindow.eval(
      `(function() {
        const result = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            result[key] = localStorage.getItem(key);
          }
        }
        return result;
      })()`,
      (result, isException) => {
        if (isException || !result) return;

        const currentStorage = result as Record<string, string | null>;

        // 检查新增和修改的键
        for (const key in currentStorage) {
          const newValue = currentStorage[key];
          const oldValue = lastValues[key];

          // 如果值发生变化或是新键
          if (newValue !== oldValue) {
            console.log(`轮询检测到 ${key} 变更:`, {
              old: oldValue,
              new: newValue,
            });
            lastValues[key] = newValue || "";

            // 如果是 JSON 字符串，尝试深度比较内部结构
            if (
              newValue &&
              oldValue &&
              newValue.startsWith("{") &&
              oldValue.startsWith("{")
            ) {
              try {
                const newObj = JSON.parse(newValue);
                const oldObj = JSON.parse(oldValue);

                // 递归查找变化的属性
                const findChangedProps = (
                  newObj: any,
                  oldObj: any,
                  path: string[] = [],
                ) => {
                  for (const prop in newObj) {
                    const currentPath = [...path, prop];
                    // 如果属性在旧对象中不存在
                    if (!(prop in oldObj)) {
                      console.log(`新增属性: ${currentPath.join(".")}`);
                      handleLocalStorageUpdate(key, newValue);
                      continue;
                    }

                    // 如果属性的值发生变化
                    if (
                      typeof newObj[prop] === "object" &&
                      newObj[prop] !== null &&
                      typeof oldObj[prop] === "object" &&
                      oldObj[prop] !== null
                    ) {
                      // 递归检查嵌套对象
                      findChangedProps(newObj[prop], oldObj[prop], currentPath);
                    } else if (newObj[prop] !== oldObj[prop]) {
                      console.log(
                        `属性值变更: ${currentPath.join(".")} 从 ${oldObj[prop]} 变为 ${newObj[prop]}`,
                      );
                      handleLocalStorageUpdate(key, newValue);
                    }
                  }

                  // 检查删除的属性
                  for (const prop in oldObj) {
                    if (!(prop in newObj)) {
                      const currentPath = [...path, prop];
                      console.log(`删除属性: ${currentPath.join(".")}`);
                      handleLocalStorageUpdate(key, newValue);
                    }
                  }
                };

                findChangedProps(newObj, oldObj);
              } catch (e) {
                // 如果解析失败，直接更新整个值
                handleLocalStorageUpdate(key, newValue);
              }
            } else {
              // 非 JSON 或解析失败，直接更新整个值
              handleLocalStorageUpdate(key, newValue);
            }
          }
        }

        // 检查删除的键
        for (const key in lastValues) {
          if (!(key in currentStorage)) {
            console.log(`轮询检测到键被删除: ${key}`);
            handleLocalStorageUpdate(key, null);
            delete lastValues[key];
          }
        }
      },
    );
  }, 1000); // 每秒轮询一次

  // 返回清理函数
  return () => {
    clearInterval(pollInterval);
  };
};

export const useAppStore = () => {
  return {
    getLocalStorage,
    getSessionStorage,
    localStorageItems,
    sessionStorageItems,
    setupStorageMonitoring,
    isMonitoring,
  };
};
