import { defineConfig } from "wxt";
import Icons from "unplugin-icons/vite";
import Tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  srcDir: "src",
  extensionApi: "chrome",
  experimental: {
    entrypointImporter: "vite-node",
  },
  modules: [
    "@wxt-dev/module-vue",
    "@wxt-dev/i18n/module",
    "@wxt-dev/auto-icons",
  ],
  imports: {
    presets: ["vue-router"],
    imports: [
      { from: "@tanstack/vue-query", name: "useQuery" },
      { from: "@tanstack/vue-query", name: "useMutation" },
    ],
  },
  runner: {
    disabled: true,
  },
  vite: () => ({
    plugins: [Icons({ compiler: "vue3" }), Tailwindcss() as any],
    ssr: {
      // List any dependencies that depend on webextension-polyfill here for vite-node importer to work
      noExternal: ["@webext-core/proxy-service", "@webext-core/messaging"],
    },
  }),
  manifest: ({ browser }) => {
    const permissions = ["storage", "tabs"];

    return {
      default_locale: "en",
      name: "__MSG_name__",
      description: "__MSG_description__",
      permissions,
      host_permissions: ["<all_urls>"],
    };
  },
  autoIcons: {
    grayscaleOnDevelopment: false,
  },
});
