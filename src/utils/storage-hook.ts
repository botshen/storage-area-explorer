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
    console.log("发送数据到静态页", {
      type: "storage-data",
      area: "local",
      data: {},
    });

    let port: chrome.runtime.Port | undefined;
    try {
      port = chrome.runtime.connect(extensionId, {
        name: "inspected-storage-connection",
      });

      console.log("连接成功建立到扩展:", extensionId);

      // 监听连接错误
      port.onDisconnect.addListener(() => {
        console.error("连接已断开", chrome.runtime.lastError);
      });

      // 监听来自背景页的消息
      port.onMessage.addListener((message) => {
        // 处理来自背景页的消息
        console.log("收到来自背景页的消息:", message);
      });

      // 获取存储数据并发送到背景页
      if (chrome.storage) {
        try {
          chrome.storage.local.get(null, (items) => {
            if (chrome.runtime.lastError) {
              console.error("获取存储数据失败:", chrome.runtime.lastError);
              return;
            }

            try {
              if (port) {
                port.postMessage({
                  type: "storage-data",
                  area: "local",
                  data: items || {},
                });
                console.log("已发送存储数据到背景页");
              } else {
                console.error("Port已不可用，无法发送数据");
              }
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
