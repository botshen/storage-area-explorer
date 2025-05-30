<script lang="ts" setup>
import { createJSONEditor } from "vanilla-jsoneditor";
import { ref } from "vue";

const jsonEditorContainer = ref<HTMLDivElement>();
const responseEditor = ref<any>(null);

onMounted(() => {
  if (jsonEditorContainer.value) {
    responseEditor.value = createJSONEditor({
      target: jsonEditorContainer.value,
      props: {
        mode: "text",
        showEditor: true,
        readOnly: false,
        content: {
          json: {},
          text: undefined,
        },
        onChange: (updatedContent: any) => {
          if (updatedContent.json) {
            console.log(updatedContent.json);
          } else if (updatedContent.text) {
            console.log(updatedContent.text);
          }
        },
      },
    });
  }
});
</script>

<template>
  <div
    ref="jsonEditorContainer"
    class="w-full !max-h-[400px] jse-theme-light"
  ></div>
</template>
