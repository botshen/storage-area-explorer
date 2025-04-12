import { sendMessage } from "../utils/messaging";

export default defineBackground(() => {
  console.log("Background script initialized");

  chrome.runtime.onMessageExternal.addListener(
    async (message, sender, sendResponse) => {
      if (message.type === "chrome-storage-data") {
        console.log("收到存储数据:", message.detail);
        // 处理数据...
        await sendMessage("sendToDevPanel", {
          detail: message.detail,
        });
        // 立即响应，避免service worker提前终止
        sendResponse({ status: "success", message: "已接收数据" });
        return true; // 表示会异步发送响应
      }
    },
  );
});
