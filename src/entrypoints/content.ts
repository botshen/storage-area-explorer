export default defineContentScript({
  matches: ["*://*.github.com/*"],
  runAt: "document_end",

  main() {
    console.log("Hello, world!");
  },
});
