// injects/storage-hook.ts
export const storageHookScript = async function (chrome: typeof window.chrome) {
  const storages: Record<string, any> = {};

  try {
    if (!chrome || !chrome.storage || !chrome.runtime) {
      console.error("Chrome API not available or missing required permissions");
      return;
    }

    // 使用一个明确的占位符变量，这将被injection服务替换
    // @ts-ignore
    const extensionId = EXTENSION_ID_PLACEHOLDER;

    try {
      // 获取存储数据并发送到背景页
      if (chrome.storage) {
        try {
          chrome.storage.local.get(null, (items) => {
            if (chrome.runtime.lastError) {
              console.error("获取存储数据失败:", chrome.runtime.lastError);
              return;
            }
            console.log("items", items);
            try {
              chrome.runtime.sendMessage(
                extensionId,
                {
                  type: "storage-data",
                  area: "local",
                  data: items || {},
                },
                (message) => {
                  console.log("bg返回的数据", message);
                },
              );
            } catch (error) {
              console.error("发送数据到背景页失败:", error);
            }
          });
        } catch (storageError) {
          console.error("访问chrome.storage.local失败:", storageError);
        }
      }
    } catch (connectError) {
      console.error("无法连接到扩展:", connectError, chrome.runtime.lastError);
    }
  } catch (e) {
    console.error("初始化存储钩子失败:", e);
  }
};
