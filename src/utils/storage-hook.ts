export const storageHookScript = async function (chrome: typeof window.chrome) {
  if (!chrome?.storage || !chrome?.runtime) {
    console.error("Chrome API not available or missing required permissions");
    return;
  }
  function tryParseJson<T>(data: string, defaultValue: T) {
    try {
      return JSON.parse(data) as T;
    } catch (e) {
      return defaultValue;
    }
  }

  // 使用一个明确的占位符变量，这将被injection服务替换
  // @ts-ignore
  const extensionId = EXTENSION_ID_PLACEHOLDER;
  // @ts-ignore
  const type = EXTENSION_DETAIL_TYPE;
  // @ts-ignore
  const storageData = EXTENSION_DETAIL_DATA;
  // @ts-ignore
  let data = {};

  if (storageData !== "undefined") {
    data = tryParseJson(storageData, {});
  }

  console.log("data--", data);
  // 创建获取local存储的Promise
  const getLocalStorage = (): Promise<Record<string, any>> => {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (items) => {
        resolve(chrome.runtime.lastError ? {} : items || {});
      });
    });
  };

  // 创建获取sync存储的Promise
  const getSyncStorage = (): Promise<Record<string, any>> => {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (items) => {
        resolve(chrome.runtime.lastError ? {} : items || {});
      });
    });
  };

  const sendMessage = (data: any, kind: string) => {
    chrome.runtime.sendMessage(extensionId, {
      type: `chrome-storage-data/${kind}`,
      detail: data,
    });
  };

  // 使用表驱动替代多个条件判断
  const actions: Record<string, () => Promise<void>> = {
    setLocalStorage: async () => {
      // 获取当前存储的数据
      const currentData = await getLocalStorage();
      // 只更新指定的键值对
      if ("key" in data && "value" in data) {
        currentData[data.key] = data.value;
        chrome.storage.local.set(currentData);
      }
      const updatedLocalData = await getLocalStorage();
      sendMessage(updatedLocalData, "local");
    },
    setSyncStorage: async () => {
      // 获取当前存储的数据
      const syncData = await getSyncStorage();
      // 只更新指定的键值对
      if ("key" in data && "value" in data) {
        syncData[data.key] = data.value;
        chrome.storage.sync.set(syncData);
      }
      const updatedSyncData = await getSyncStorage();
      sendMessage(updatedSyncData, "sync");
    },
    getLocalStorage: async () => {
      const localData = await getLocalStorage();
      sendMessage(localData, "local");
    },
    getSyncStorage: async () => {
      const syncData = await getSyncStorage();
      sendMessage(syncData, "sync");
    },
  };

  // 执行对应的行为
  if (actions[type]) {
    await actions[type]();
  }
};
