interface VueElement extends Element {
  __vue_app__?: {
    config: {
      globalProperties: {
        $store: any; // 替换为你的 store 具体类型
      };
    };
  };
}

browser.devtools.panels.create(
  "Storage Explorer Plus",
  "icon/128.png",
  "devtools-panel.html",
  (extensionPanel) => {
    console.log("devtools-panel.html");
    extensionPanel.onShown.addListener(function (panelWindow) {
      const app = (panelWindow.document.querySelector("#app") as VueElement)
        ?.__vue_app__;
      const store = app?.config?.globalProperties.$store;
      console.log("store", store);
      if (store) {
        store.getLocalStorage();
      }
    });
  },
);
