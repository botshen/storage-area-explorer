export default defineBackground(() => {
  console.log("Background script initialized");

  chrome.runtime.onMessageExternal.addListener(
    (message, sender, sendResponse) => {
      console.log("222222222", 222222222);
      if (message.type === "storage-data") {
        console.log("收到存储数据:", message.data);
        // 处理数据...

        // 立即响应，避免service worker提前终止
        sendResponse({ status: "success", message: "已接收数据" });
        return true; // 表示会异步发送响应
      }
    },
  );
});
