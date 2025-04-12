// injects/storage-hook.ts
export const storageHookScript = async function (chrome: typeof window.chrome) {
  const storages: Record<string, any> = {};

  try {
    if (chrome.storage) {
      // 连接到扩展
      console.log("连接到扩展", chrome.runtime.id);

      // const port = chrome.runtime.connect(chrome.runtime.id, {
      //   name: 'storage-connection'
      // });

      // // 监听存储变化
      // const storageListener = (changes: any, areaName: string) => {
      //   port.postMessage({
      //     type: 'storage-change',
      //     changes,
      //     area: areaName
      //   });
      // };

      // // 添加存储监听器
      // chrome.storage.onChanged.addListener(storageListener);

      // // 获取存储引用
      // storages.local = chrome.storage.local;
      // storages.sync = chrome.storage.sync;
      // storages.managed = chrome.storage.managed;
      // console.log('storages.local',await storages.local.getKeys())
      // // 清理函数
      // port.onDisconnect.addListener(() => {
      //   chrome.storage.onChanged.removeListener(storageListener);
      // });

      const port = chrome.runtime.connect(chrome.runtime.id, {
        name: "inspected-storage-connection",
      });
      port.postMessage("xxxxxx");

      // 处理操作请求
      //  port.onMessage.addListener((message) => {
      //   const { area, method, args = [] } = message;
      //   const storage = storages[area];

      //   if (storage && storage[method]) {
      //     storage[method](...args, (result: any) => {
      //       port.postMessage({
      //         type: 'operation-result',
      //         result,
      //         messageId: message.id
      //       });
      //     });
      //   }
      // });
      // 发送数据到背景页
      function sendDataToBackground(data: any) {
        console.log("发送数据到背景页", data);
        port.postMessage(data);
      }

      // 监听来自背景页的消息
      port.onMessage.addListener((message) => {
        // 处理来自背景页的消息
        console.log("收到来自背景页的消息:", message);
      });

      // 获取存储数据并发送到背景页
      if (chrome.storage) {
        chrome.storage.local.get(null, (items) => {
          sendDataToBackground({
            type: "storage-data",
            area: "local",
            data: items,
          });
        });
      }
    }
  } catch (e) {
    console.error("Failed to initialize storage hook:", e);
  }
};
