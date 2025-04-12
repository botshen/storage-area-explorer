export default defineBackground(() => {
  const injectedScriptPorts: { [key: string]: chrome.runtime.Port } = {};
  browser.runtime.onConnect.addListener((port) => {
    console.log("port", port);
    // 检查连接名称，确定是来自注入脚本的连接
    if (port.name === "inspected-storage-connection") {
      console.log("接收到来自注入脚本的连接");

      // 跟踪连接的来源
      const tabId = port.sender?.tab?.id;
      // const extensionId = port.sender.id;

      // 存储端口引用以便后续使用
      if (tabId !== undefined) {
        injectedScriptPorts[tabId] = port;
      }

      // 监听来自注入脚本的消息
      port.onMessage.addListener((message) => {
        console.log("收到来自注入脚本的消息:", message);

        // // 转发消息到开发者工具面板
        // const devToolsPort = devToolsPorts[tabId];
        // if (devToolsPort) {
        //   devToolsPort.postMessage({
        //     source: "injected-script",
        //     tabId: tabId,
        //     extensionId: extensionId,
        //     data: message
        //   });
        // }
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
