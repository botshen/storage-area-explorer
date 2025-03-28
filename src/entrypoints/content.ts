export default defineContentScript({
  matches: ["<all_urls>"],
  runAt: "document_end",

  main() {
    console.log("Storage Area Explorer: 内容脚本已启动");

    // 监听页面中的自定义事件
    document.addEventListener("__sendToContentScript", (event: Event) => {
      // 转换 event 为自定义事件类型
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        // 发送消息到扩展的后台
        chrome.runtime.sendMessage(customEvent.detail);
      }
    });
  },
});
