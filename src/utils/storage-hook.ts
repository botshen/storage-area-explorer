export const storageHookScript = async function (chrome: typeof window.chrome) {
  if (!chrome?.storage || !chrome?.runtime) {
    console.error("Chrome API not available or missing required permissions");
    return;
  }

  // 使用一个明确的占位符变量，这将被injection服务替换
  // @ts-ignore
  const extensionId = EXTENSION_ID_PLACEHOLDER;

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

  // 并行获取两种存储数据
  const [localData, syncData] = await Promise.all([
    getLocalStorage(),
    getSyncStorage(),
  ]);

  // 发送合并的数据
  chrome.runtime.sendMessage(extensionId, {
    type: "chrome-storage-data",
    detail: {
      local: localData,
      sync: syncData,
    },
  });
};
