export default defineBackground(() => {
  console.log("Background script initialized");
  const injectedScriptPorts: { [key: string]: chrome.runtime.Port } = {};

  chrome.runtime.onConnect.addListener((port) => {
    console.log("New connection established with port:", port.name);

    // 检查连接名称，确定是来自注入脚本的连接
    if (port.name === "inspected-storage-connection") {
      console.log("接收到来自注入脚本的连接");

      // 跟踪连接的来源
      const tabId = port.sender?.tab?.id;

      // 存储端口引用以便后续使用
      if (tabId !== undefined) {
        injectedScriptPorts[tabId] = port;
      }

      // 监听来自注入脚本的消息
      port.onMessage.addListener((message) => {
        console.log("收到来自注入脚本的消息:", message);

        // 回复消息确认接收
        try {
          port.postMessage({
            type: "acknowledgement",
            status: "success",
            message: "已接收数据",
          });
        } catch (error) {
          console.error("发送回复消息失败:", error);
        }
      });

      // 处理连接断开
      port.onDisconnect.addListener(() => {
        console.log("注入脚本连接断开");
        if (tabId !== undefined) {
          delete injectedScriptPorts[tabId];
        }
      });
    }
  });
});
