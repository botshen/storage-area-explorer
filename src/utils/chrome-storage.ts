import { InjectionService } from "@/utils/injection";
import { storageHookScript } from "@/utils/storage-hook";
import { toRaw } from "vue";

export async function doChromeStorage(type: string, data?: any) {
  try {
    // 获取扩展的URL
    const extensionURL = chrome.runtime.getURL("");
    // URL格式为: chrome-extension://<extensionId>/
    const extensionId = extensionURL.split("/")[2];

    console.log("Extension ID:", extensionId);

    // 检查当前页面是否是扩展页面
    chrome.devtools.inspectedWindow.eval(
      `location.protocol === 'chrome-extension:'`,
      async (result, isException) => {
        if (isException) {
          console.error("检查页面类型时出错:", isException);
          return;
        }

        if (!result) {
          console.warn("当前页面不是扩展页面，无法访问chrome.storage.local");
          return;
        }

        try {
          const injectionService = new InjectionService();
          console.log("type", type);
          console.log("data", data);
          const xx = toRaw(data);
          let _data = "";
          if (xx) {
            _data = JSON.stringify(xx);
          }
          console.log("_data", _data);
          const params = {
            EXTENSION_DETAIL_TYPE: `'${type}'`,
            EXTENSION_DETAIL_DATA: `'${_data}'`,
            EXTENSION_ID_PLACEHOLDER: `'${extensionId}'`,
          };
          await injectionService.evalInInspectedWindow(
            storageHookScript.toString(),
            params,
          );
          console.log("注入脚本成功执行");
        } catch (error) {
          console.error("注入脚本执行失败:", error);
        }
      },
    );
  } catch (error) {
    console.error("获取chrome.storage.local时出错:", error);
  }
}
