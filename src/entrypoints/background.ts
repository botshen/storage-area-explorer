// 定义消息类型
interface StorageUpdateMessage {
  type: "storageUpdate";
  data: {
    storageType: string;
    key: string | null;
    value: string | null;
  };
}

export default defineBackground(() => {
  // 存储连接到的 devtools 端口
  const devtoolsPorts: Record<string, chrome.runtime.Port> = {};

  // 当 DevTools 面板连接时
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name.startsWith("storage-area-explorer-")) {
      const tabId = port.name.split("-").pop();
      if (tabId) {
        console.log(`DevTools connected for tab ${tabId}`);
        devtoolsPorts[tabId] = port;

        // 当 DevTools 断开连接时
        port.onDisconnect.addListener(() => {
          console.log(`DevTools disconnected for tab ${tabId}`);
          delete devtoolsPorts[tabId];
        });
      }
    }
  });

  // 接收来自内容脚本的消息
  chrome.runtime.onMessage.addListener(
    (message: StorageUpdateMessage, sender) => {
      if (sender.tab && sender.tab.id && message.type === "storageUpdate") {
        const tabId = String(sender.tab.id);

        // 如果有对应的 DevTools 端口，则转发消息
        if (devtoolsPorts[tabId]) {
          console.log(`Forwarding storage update to DevTools for tab ${tabId}`);
          devtoolsPorts[tabId].postMessage(message);
        }
      }

      // 必须返回 true 以保持消息端口打开，以便异步响应
      return true;
    },
  );

  // 安装监听
  browser.runtime.onInstalled.addListener(async ({ reason }) => {
    if (reason === "install") {
      console.log("Storage Area Explorer 已安装");
    }
  });
});
